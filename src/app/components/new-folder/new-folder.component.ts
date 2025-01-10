import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-new-folder',
  standalone: false,

  templateUrl: './new-folder.component.html',
  styleUrl: './new-folder.component.scss'
})
export class NewFolderComponent {
  folderName: string = '';

  constructor(
    public dialogRef: MatDialogRef<NewFolderComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.folderName = this.data.name || '';
  }

}
