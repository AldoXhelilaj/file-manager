import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FileNode } from '../models/file-system.model';

// export interface FileNode {
//   id: string;
//   name: string;
//   type: 'file' | 'folder';
//   parentId: string | null;
//   path: string[];
//   size?: number;
//   lastModified: string;
// }

@Injectable({
    providedIn: 'root'
})
export class FilePreviewService {
    private apiUrl = 'http://localhost:3000';

    constructor(private http: HttpClient) { }

    getFileData(fileId: string): Observable<FileNode> {
        return this.http.get<FileNode>(`${this.apiUrl}/nodes/${fileId}`).pipe(
            catchError(error => throwError(() => new Error('Error fetching file data')))
        );
    }

    getFileExtension(fileName: string): string {
        return fileName.split('.').pop()?.toLowerCase() || '';
    }

    getFileTypeIcon(fileName: string): string {
        const extension = this.getFileExtension(fileName);
        const iconMap: { [key: string]: string } = {
            'pdf': 'picture_as_pdf',
            'doc': 'description',
            'docx': 'description',
            'xls': 'table_chart',
            'xlsx': 'table_chart',
            'csv': 'table_chart',
            'txt': 'description',
            'jpg': 'image',
            'jpeg': 'image',
            'png': 'image',
            'gif': 'gif',
            'mp4': 'video_library',
            'mp3': 'audio_file',
            'zip': 'folder_zip',
            'rar': 'folder_zip'
        };

        return iconMap[extension] || 'insert_drive_file';
    }


}