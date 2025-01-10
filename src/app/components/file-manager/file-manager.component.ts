import { Component, OnDestroy, OnInit, Output } from '@angular/core';
import { FileNode, TreeNode } from '../../models/file-system.model';
import { FileSystemService } from '../../services/file-system.service';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { NewFolderComponent } from '../new-folder/new-folder.component';
import { FlatTreeControl, NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener, MatTreeNestedDataSource } from '@angular/material/tree';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { CdkDrag, CdkDragDrop, CdkDragEnter, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { SelectionService } from '../../services/file-selection.service';
import { BatchOperationsService } from '../../services/batch-operations.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-file-manager',
  standalone: false,
  templateUrl: './file-manager.component.html',
  styleUrl: './file-manager.component.scss',
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('collapsed <=> expanded', [animate('300ms ease-in-out')]),
    ]),
  ],
})

export class FileManagerComponent implements OnInit {
  selectedNode$!: Observable<FileNode | null>;
  isSelectionMode$!: Observable<boolean>;
  selectedItems$!: Observable<FileNode[]>;


  constructor(
    public batchService: BatchOperationsService,
    private fileSystemService: FileSystemService,
    private dialog: MatDialog,
    public selectionService: SelectionService,
    private notificationService: NotificationService
  ) {
  }

  private destroy$ = new Subject<void>();
  private transformer = (node: FileNode, level: number): TreeNode => {
    return {
      ...node,
      expanded: false,
      level: level,
    };
  };

  treeControl = new FlatTreeControl<TreeNode>(
    node => node.level,
    node => node.type === 'folder'
  );

  treeFlattener = new MatTreeFlattener(
    this.transformer,
    node => node.level,
    node => node.type === 'folder',
    node => this.getChildren(node)
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  nodesMap = new Map<string, TreeNode>();
  isDragging = false;
  selectedFile: TreeNode | null = null;
  selectedFileContent: string | null = null;
  showPreview: boolean = false;
  private nodes: FileNode | null = null;

  ngOnInit() {
    this.loadNodes();
    this.selectedNode$ = this.selectionService.selectedNode$;

    this.isSelectionMode$ = this.batchService.isSelectionMode$;
    this.selectedItems$ = this.batchService.selectedItems$;

    this.isSelectionMode$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isSelectionMode => {
      if (isSelectionMode) {
        this.batchService.clearSelection();
      }
    }
    )
  }

  hasChild = (_: number, node: TreeNode) => node.type === 'folder';
  hasChildren = (_: number, node: TreeNode) => node.type === 'folder' && (node.children && node.children.length > 0);

  private loadNodes() {
    this.fileSystemService.getNodes().subscribe(nodes => {
      const root = nodes.find(node => node.parentId === null);
      if (root) {
        const tree = this.buildTree(nodes, root.id);
        this.dataSource.data = tree;
        this.clearNodes();
      }
    });
  }

  drop(event: CdkDragDrop<TreeNode>) {
    console.log('draggedNode', event.item.data);
    console.log('targetNode', event.container.data);
    if (!event.container || !event.previousContainer) return;

    const draggedNode = event.item.data as TreeNode;
    const targetNode = event.container.data as TreeNode;

    // Don't allow dropping if target is not a folder
    if (targetNode.type !== 'folder') return;
    // Call yr service to update the node's parent
    this.fileSystemService.updateNode(draggedNode.id, { parentId: targetNode.id })
      .subscribe( {
        next: () => {
          
          if (!!targetNode.children) {
            this.removeNode(this.dataSource.data, draggedNode);
            this.addNode(targetNode.children, targetNode.id, draggedNode);
            this.treeControl.expand(targetNode);
            this.loadNodes();
            this.notificationService.showToast(`${draggedNode.type === 'folder' ? 'Folder' : 'File'} moved successfully`, 'success');
          }
        },

        error: (err) => {
         this.notificationService.showToast(`Error moving ${draggedNode.type === 'folder' ? 'folder' : 'file'}`, 'error');
        },
      });
  }

  canDrop = (drag: CdkDrag<any>, drop: CdkDropList<any>) => {
    const draggedNode = drag.data as TreeNode;
    const dropNode = drop.data as TreeNode;

    // Prevent dropping on itself
    if (draggedNode.id === dropNode.id) {
      return false;
    }

    // Only allow dropping into folders
    if (dropNode.type !== 'folder') {
      return false;
    }

    // Prevent dropping a parent into its own child
    if (this.isDescendant(draggedNode, dropNode)) {
      return false;
    }

    return true;
  }
  isDescendant(parent: TreeNode, child: TreeNode): boolean {
    if (!parent.children) {
      return false;
    }

    return parent.children.some(node =>
      node.id === child.id || this.isDescendant(node, child)
    );
  }

  getExpansionState(node: TreeNode) {
    return this.treeControl.isExpanded(node) ? 'expanded' : 'collapsed';
  }

  private buildTree(nodes: FileNode[], parentId: string): TreeNode[] {
    return nodes
      .filter(node => node.parentId === parentId)
      .map(node => ({
        ...node,
        level: 0,
        children: this.buildTree(nodes, node.id)
      }))
      .sort((a, b) => {
        // Folders first, then files, then alphabetically
        if (a.type === 'folder' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
  }

  private getChildren(node: TreeNode): TreeNode[] {
    return node.children || [];
  }

  createNewFolder(parentId: string = '1') {
    const dialogRef = this.dialog.open(NewFolderComponent, {
      width: '400px',
      data: { title: 'Create New Folder' }
    });

    dialogRef.afterClosed().subscribe(folderName => {
      if (folderName) {
        this.fileSystemService.createFolder(folderName, parentId)
          .subscribe(() => {
            this.loadNodes();
          });
      }
    });
  }

  uploadFile(event: any, parentId: string = '1') {
    const file = event?.target?.files[0];
    if (file) {
      // this.notificationService.addNotification({ message: `Uploading file...${file.name}`, type: 'info'  });
      this.fileSystemService.uploadFile(file, parentId)
        .subscribe({
          next: () => {
            this.loadNodes();
            this.notificationService.showToast(`File uploaded successfully ${file.name}`, 'success');
          },

          error: (err) => {
            this.notificationService.showToast(`Error uploading file ${file.name}`, 'error');
          },

      


        });
    }
  }

  renameNode(node?: TreeNode) {

    const dialogRef = this.dialog.open(NewFolderComponent, {
      width: '400px',
      data: {
        name: node?.name ?? this.selectionService.getSelectedNode()?.name,
        title: `Rename ${node?.type === 'folder' ? 'Folder' : 'File'}`
      }
    });

    dialogRef.afterClosed().subscribe(newName => {
      if (newName) {
        this.fileSystemService.updateNode((node?.id ?? this.selectionService.getSelectedNode()!.id), { name: newName })
          .subscribe(() => {
            this.loadNodes();

          });
      }
    });
  }

  deleteNode(node: TreeNode) {
    const isFolder = node.type === 'folder';
    const confirmMessage = isFolder
      ? 'Are you sure you want to delete this folder and all its contents?'
      : 'Are you sure you want to delete this file?';

    if (confirm(confirmMessage)) {
      this.fileSystemService.deleteNode(node.id)
        .subscribe( {
          next: () => {
            this.loadNodes();
            this.notificationService.showToast(`${isFolder ? 'Folder' : 'File'} deleted successfully`, 'success');
            
          },

          error: (err) => {
            this.notificationService.showToast(`Error deleting ${isFolder ? 'folder' : 'file'}`, 'error');
          },
        });
    }
  }

  // selectNode(node: FileNode) {
  //   this.selectionService.setSelectedNode(node);

  //   // If it's a file, trigger the preview
  //   if (node.type === 'file') {
  //     // The preview component will handle loading the file content
  //     this.showPreview = true;
  //   }
  // }
  getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'picture_as_pdf';
      case 'doc':
      case 'docx': return 'description';
      case 'jpg':
      case 'jpeg':
      case 'png': return 'image';
      default: return 'insert_drive_file';
    }
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  private findParentNode(nodes: TreeNode[], childId: string): TreeNode | null {
    for (const node of nodes) {
      if (node.children?.some(child => child.id === childId)) {
        return node;
      }
      if (node.children) {
        const foundInChild = this.findParentNode(node.children, childId);
        if (foundInChild) return foundInChild;
      }
    }
    return null;
  }

  private updateNodeLevel(node: TreeNode, level: number) {
    node.level = level;
    if (node.children) {
      node.children.forEach(child => this.updateNodeLevel(child, level + 1));
    }
  }

  private removeNode(nodes: TreeNode[], nodeToRemove: FileNode): boolean {
    return nodes.some((node, index) => {
      if (node.id === nodeToRemove.id) {
        nodes.splice(index, 1);
        return true;
      }
      if (node.children) {
        return this.removeNode(node.children, nodeToRemove);
      }
      return false;
    });
  }

  // Helper method to add a node to a specific parent
  private addNode(nodes: TreeNode[], parentId: string, nodeToAdd: FileNode): boolean {
    return nodes.some(node => {
      if (node.id === parentId && node.children) {
        node.children.push(nodeToAdd);
        return true;
      }
      if (node.children) {
        return this.addNode(node.children, parentId, nodeToAdd);
      }
      return false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Modified node selection method
  selectNode(node: FileNode, event: MouseEvent) {
    event.stopPropagation();
    if (this.batchService.isSelectionModeValue) {
      event.preventDefault();
      event.stopPropagation();
      this.batchService.toggleItemSelection(node);
    } else {
      this.selectionService.setSelectedNode(node);
      if (node.type === 'file') {
        this.showPreview = true;
      }
    }
  }

  // New methods for batch operations
  toggleSelectionMode() {
    this.batchService.toggleSelectionMode();
    this.selectionService.clearSelection();
    this.clearNodes();
  }

  isSelected(node: FileNode): boolean {
    return this.batchService.isItemSelected(node.id);
  }

  // Batch operation handlers
  async handleBatchDelete() {
    const selectedItems = await this.batchService.selecterItemsValue;
    console.log("Delete selected items:", selectedItems);
    if (confirm(`Are you sure you want to delete ${selectedItems?.length} items?`)) {
      try {
        for (const item of selectedItems!) {
          await this.fileSystemService.deleteNode(item.id).toPromise();
        }
        this.batchService.clearSelection();
        this.loadNodes();
        this.notificationService.showToast('Batch delete successful', 'success');
      } catch (error) {
        this.notificationService.showToast('Batch delete failed', 'error');
        console.error('Error during batch delete:', error);
      }
    }
  }

  async handleBatchMove(targetFolderId: string) {
    const selectedItems = await this.batchService.selecterItemsValue;
    try {
      for (const item of selectedItems!) {
        await this.fileSystemService.updateNode(item.id, { parentId: targetFolderId }).toPromise();
      }
      this.batchService.clearSelection();
      this.loadNodes();
      this.notificationService.showToast('Batch move successful', 'success');
    } catch (error) {
      this.notificationService.showToast('Batch move failed', 'error');
    }
  }

  getFoldersList(): TreeNode[] {
    const folders: TreeNode[] = [];

    // Helper function to recursively collect folders
    const collectFolders = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'folder') {
          // Don't include folders that are currently selected
          if (!this.batchService.isItemSelected(node.id)) {
            folders.push(node);
          }
          // Recursively collect subfolders
          if (node.children) {
            collectFolders(node.children);
          }
        }
      });
    };

    // Start collection from the root level
    collectFolders(this.dataSource.data);

    // Sort folders alphabetically
    return folders.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Optional: Add a method to get folder path for better UX
  getFolderPath(node: TreeNode): string {
    const path: string[] = [node.name];
    let current = node;

    // Traverse up the tree to build the path
    while (current.parentId) {
      const parent = this.findNodeById(this.dataSource.data, current.parentId);
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }

    return path.join(' / ');
  }

  // Helper method to find a node by ID
  private findNodeById(nodes: TreeNode[], id: string): TreeNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children) {
        const found = this.findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }


  checkedNodes = new Set<string>();

  // Modify selectNode to handle file preview only
  // selectNode(node: FileNode) {
  //   this.selectionService.setSelectedNode(node);
  //   if (node.type === 'file') {
  //     this.showPreview = true;
  //   }
  // }

  // Add new method for checkbox handling
  onCheckboxChange(node: FileNode, event: any) {
    if (event.source._elementRef.nativeElement.contains(document.activeElement)) {
      event.source._elementRef.nativeElement.click();
    }
    console.log('Checkbox changed for node:', node);
    if (event.checked) {
      this.selectionService.setSelectedNode(node);
      this.batchService.toggleItemSelection(node);
      this.checkedNodes.add(node.id);
    } else {
      this.batchService.toggleItemSelection(node);
      this.checkedNodes.delete(node.id);
    }
  }

  isChecked(nodeId: string): boolean {
    return this.checkedNodes.has(nodeId);
  }

  clearNodes() {
    this.batchService.clearSelection();
    this.checkedNodes.clear()
  }
  // Add method to toggle all checkboxes in a folder
  toggleFolderCheckbox(node: TreeNode, event: any) {
    event.stopPropagation();
    const toggleChildren = (parentNode: TreeNode, checked: boolean) => {
      if (parentNode.children) {
        parentNode.children.forEach(child => {
          if (checked) {
            this.checkedNodes.add(child.id);
            this.batchService.toggleItemSelection(child);
          } else {
            this.checkedNodes.delete(child.id);
            this.batchService.toggleItemSelection(child);
          }
          if (child.type === 'folder') {
            toggleChildren(child, checked);
          }
        });
      }
    };

    if (event.checked) {
      this.checkedNodes.add(node.id);
      this.batchService.toggleItemSelection(node);
      toggleChildren(node, true);
    } else {
      this.checkedNodes.delete(node.id);
      this.batchService.toggleItemSelection(node);
      toggleChildren(node, false);
    }
  }
}

