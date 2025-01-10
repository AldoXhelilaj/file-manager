import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FilePreviewService } from '../../services/file-preview.service';
import { FileNode } from '../../models/file-system.model';
import { SelectionService } from '../../services/file-selection.service';
import { Subscription } from 'rxjs';
import { BatchOperationsService } from '../../services/batch-operations.service';

@Component({
  selector: 'app-file-preview',
  standalone: false,
  templateUrl: './file-preview.component.html',
  styleUrl: './file-preview.component.scss'
})
export class FilePreviewComponent implements OnInit, OnDestroy {
  fileID!: string;
  fileData: FileNode | null = null;
  loading = true;
  error: string | null = null;
  private subscription: Subscription = new Subscription();

  constructor(
    public filePreviewService: FilePreviewService,
    private selectionService: SelectionService,
    private batchService: BatchOperationsService
  ) { }

  ngOnInit() {

    if (!this.batchService.isSelectionModeValue) {
      this.subscription.add(
        this.selectionService.selectedNode$.subscribe(node => {
          console.log(node)
          if (node?.id !== this.fileID) {
            this.fileID = node?.id ?? '';
            this.loadFileData();
          }
        })
      );
    }

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private async loadFileData() {
    if (!this.fileID) {
      this.fileData = null;
      return;
    }

    try {
      this.loading = true;
      this.error = null;
      const fileDataResult = await this.filePreviewService.getFileData(this.fileID).toPromise();
      this.fileData = fileDataResult ?? null;
    } catch (err) {
      this.error = 'Failed to load file information';
      console.error('Preview error:', err);
    } finally {
      this.loading = false;
    }
  }

  getIconClass(): string {
    const extension = this.filePreviewService.getFileExtension(this.fileData?.name || '');
    const classMap: { [key: string]: string } = {
      'pdf': 'icon-pdf',
      'doc': 'icon-document',
      'docx': 'icon-document',
      'xls': 'icon-spreadsheet',
      'xlsx': 'icon-spreadsheet',
      'csv': 'icon-spreadsheet',
      'zip': 'icon-archive',
      'rar': 'icon-archive',
      'jpg': 'icon-image',
      'jpeg': 'icon-image',
      'png': 'icon-image',
      'gif': 'icon-image'
    };

    return classMap[extension] || 'icon-default';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  closePreview() {
    this.selectionService.clearSelection();
    this.fileID = '';
    this.fileData = null;
  }
}