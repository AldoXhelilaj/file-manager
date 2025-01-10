export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    parentId: string | null;
    size?: number;
    lastModified?: Date | string;
    content?: string;
    path?: string[];
    level: number;
  }

  export interface TreeNode extends FileNode {
    children?: TreeNode[];
    expanded?: boolean;
    level: number;
    loading?: boolean;
  }

  export interface BatchOperation {
    type: 'move' | 'copy' | 'delete' | 'download' | 'share';
    sourceIds: string[];
    targetFolderId?: string;
  }