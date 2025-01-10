import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { FileNode } from '../models/file-system.model';

@Injectable({
  providedIn: 'root'
})
export class FileSystemService {
  private apiUrl = 'http://localhost:3000/nodes';
  private nodesSubject = new BehaviorSubject<FileNode[]>([]);
  nodes$ = this.nodesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadNodes();
  }

  private loadNodes() {
    this.http.get<FileNode[]>(this.apiUrl)
      .pipe(
        catchError(this.handleError)
      )
      .subscribe(nodes => {
        this.nodesSubject.next(nodes);
      });
  }

  getNodes(): Observable<FileNode[]> {
    return this.nodes$;
  }

  getNodeById(id: string): Observable<FileNode> {
    return this.http.get<FileNode>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  getNodesByParentId(parentId: string | null): Observable<FileNode[]> {
    return this.nodes$.pipe(
      map(nodes => nodes.filter(node => node.parentId === parentId))
    );
  }

  createFolder(name: string, parentId: string): Observable<FileNode> {
    const parentNode = this.nodesSubject.value.find(n => n.id === parentId);

    const newFolder: Partial<FileNode> = {
      name,
      type: 'folder',
      parentId,
      path: parentNode ? [...parentNode.path!, name] : [name],
      lastModified: new Date().toISOString()
    };

    return this.http.post<FileNode>(this.apiUrl, newFolder)
      .pipe(
        tap(folder => {
          const currentNodes = this.nodesSubject.value;
          this.nodesSubject.next([...currentNodes, folder]);
        }),
        catchError(this.handleError)
      );
  }

  uploadFile(file: File, parentId: string): Observable<FileNode> {
    const parentNode = this.nodesSubject.value.find(n => n.id === parentId);
    console.log(parentNode);
    const newFile: Partial<FileNode> = {
      name: file.name,
      type: 'file',
      parentId,
      size: file.size,
      path: parentNode ? [...parentNode.path!, file.name] : [file.name],
      lastModified: new Date().toISOString()
    };

    return this.http.post<FileNode>(this.apiUrl, newFile)
      .pipe(
        tap(fileNode => {
          const currentNodes = this.nodesSubject.value;
          this.nodesSubject.next([...currentNodes, fileNode]);
        }),
        catchError(this.handleError)
      );
  }

  updateNode(id: string, updates: Partial<FileNode>): Observable<FileNode> {
    return this.http.patch<FileNode>(`${this.apiUrl}/${id}`, updates)
      .pipe(
        tap(updatedNode => {
          const currentNodes = this.nodesSubject.value;
          const index = currentNodes.findIndex(n => n.id === id);
          if (index !== -1) {
            currentNodes[index] = updatedNode;
            this.nodesSubject.next([...currentNodes]);
          }
        }),
        catchError(this.handleError)
      );
  }

  deleteNode(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          const currentNodes = this.nodesSubject.value;
          const nodesToDelete = this.getAllDescendantIds(id, currentNodes);
          nodesToDelete.push(id);
          const filteredNodes = currentNodes.filter(n => !nodesToDelete.includes(n.id));
          this.nodesSubject.next(filteredNodes);
        }),
        catchError(this.handleError)
      );
  }

  private getAllDescendantIds(nodeId: string, nodes: FileNode[]): string[] {
    const descendants: string[] = [];
    const children = nodes.filter(n => n.parentId === nodeId);
    
    children.forEach(child => {
      descendants.push(child.id);
      if (child.type === 'folder') {
        descendants.push(...this.getAllDescendantIds(child.id, nodes));
      }
    });

    return descendants;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}