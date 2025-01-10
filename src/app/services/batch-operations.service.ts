import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FileNode } from '../models/file-system.model';
import { BatchOperation } from '../models/file-system.model';

@Injectable({
  providedIn: 'root'
})
export class BatchOperationsService {
  private selectedItems = new BehaviorSubject<FileNode[]>([]);
  selectedItems$ = this.selectedItems.asObservable();

  private isSelectionMode = new BehaviorSubject<boolean>(false);
  isSelectionMode$ = this.isSelectionMode.asObservable();

  constructor() {}


  get isSelectionModeValue(): boolean {
    return this.isSelectionMode.value;
  }

  get selecterItemsValue(): FileNode[] {
    return this.selectedItems.value;
  }
  toggleSelectionMode(enable?: boolean) {
    const newState = enable !== undefined ? enable : !this.isSelectionMode.value;
    this.isSelectionMode.next(newState);
    if (!newState) {
      this.clearSelection();
    }
  }

  toggleItemSelection(item: FileNode) {
    const currentSelection = this.selectedItems.value;
    const index = currentSelection.findIndex(i => i.id === item.id);
    
    if (index === -1) {
      this.selectedItems.next([...currentSelection, item]);
    } else {
      this.selectedItems.next(currentSelection.filter(i => i.id !== item.id));
    }
  }

  isItemSelected(itemId: string): boolean {
    return this.selectedItems.value.some(item => item.id === itemId);
  }

  clearSelection() {
    this.selectedItems.next([]);
    console.log('Selection cleared', this.selectedItems.value);
  }

  async executeBatchOperation(operation: BatchOperation): Promise<void> {
    try {
      switch (operation.type) {
        case 'move':
          await this.moveItems(operation.sourceIds, operation.targetFolderId!);
          break;
        case 'copy':
          await this.copyItems(operation.sourceIds, operation.targetFolderId!);
          break;
        case 'delete':
          await this.deleteItems(operation.sourceIds);
          break;
        case 'download':
          await this.downloadItems(operation.sourceIds);
          break;
        case 'share':
          await this.shareItems(operation.sourceIds);
          break;
      }
      this.clearSelection();
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw error;
    }
  }

  private async moveItems(sourceIds: string[], targetFolderId: string): Promise<void> {
    // Implement move logic
  }

  private async copyItems(sourceIds: string[], targetFolderId: string): Promise<void> {
    // Implement copy logic
  }

  private async deleteItems(sourceIds: string[]): Promise<void> {
    // Implement delete logic
  }

  private async downloadItems(sourceIds: string[]): Promise<void> {
    // Implement download logic
  }

  private async shareItems(sourceIds: string[]): Promise<void> {
    // Implement share logic
  }
}
