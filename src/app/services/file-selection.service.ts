import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { FileNode } from "../models/file-system.model";


@Injectable({ providedIn: 'root' })
export class SelectionService {
    private selectedNodeSubject = new BehaviorSubject<FileNode | null>(null);
    selectedNode$: Observable<FileNode | null> = this.selectedNodeSubject.asObservable();
  
    setSelectedNode(node: FileNode | null) {
      this.selectedNodeSubject.next(node);
    }
  
    getSelectedNode(): FileNode | null {
      return this.selectedNodeSubject.getValue();
    }

    clearSelection() {
        this.selectedNodeSubject.next(null);
      }
  }