# Angular File Manager

A modern file management system built with Angular, featuring an intuitive interface for managing files and folders with advanced features like drag-and-drop, file preview, and real-time notifications.

## Features

### Core Functionality
- **File & Folder Management**
  - Create, read, update, and delete files/folders
  - Rename files and folders
  - Move files between folders
  - Create nested folder structures
  - File size display
  - File type identification with appropriate icons

### Advanced Features
- **Drag and Drop**
  - Intuitive drag-and-drop interface
  - Visual feedback during drag operations
  - Validation for valid drop targets
  - Prevents dropping folders into their own children

- **Batch Operations**
  - Multi-select files and folders
  - Batch delete functionality
  - Batch move operations
  - Select/deselect all items in a folder

- **File Preview**
  - Preview panel for selected files
  - Supports different file types (images, text, PDF)
  - Preview panel can be toggled

- **Notification System**
  - Real-time operation feedback
  - Success/error notifications
  - Operation progress updates
  - Customizable notification duration
  - Different notification types (success, error, info, warning)

### User Interface
- **Tree View Structure**
  - Hierarchical display of files and folders
  - Expandable/collapsible folders
  - Visual indication of current selection
  - Clear parent-child relationships

- **Responsive Design**
  - Adapts to different screen sizes
  - Mobile-friendly interface
  - Flexible layout system

## Technical Implementation

### Technologies Used
- Angular 19.0.0
- Angular Material 19.0.4
- Angular CDK for drag-and-drop
- RxJS for state management
- JSON Server for backend mock

### Key Components
- `FileManagerComponent`: Main component handling the file system display
- `FilePreviewComponent`: Handles file preview functionality
- `NotificationComponent`: Manages the notification system
- `TreeViewComponent`: Implements the hierarchical file structure

### Services
- `FileSystemService`: Handles CRUD operations
- `NotificationService`: Manages system notifications
- `SelectionService`: Handles file/folder selection
- `BatchOperationsService`: Manages batch operations

## Getting Started

### Prerequisites
- Node.js (latest LTS version)
- npm (comes with Node.js)
- Angular CLI (`npm install -g @angular/cli`)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd file-manager
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server and JSON server:
```bash
npm run start:dev
```

The application will be available at `http://localhost:4200`

### Building for Production

To build the application for production:
```bash
ng build --configuration production
```

## Usage Examples

### Creating a New Folder
```typescript
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
```

### Implementing Drag and Drop
```typescript
drop(event: CdkDragDrop<TreeNode>) {
  const draggedNode = event.item.data as TreeNode;
  const targetNode = event.container.data as TreeNode;

  if (targetNode.type !== 'folder') return;

  this.fileSystemService.updateNode(draggedNode.id, { parentId: targetNode.id })
    .subscribe(() => {
      this.loadNodes();
    });
}
```

## Project Structure
```
src/
├── app/
│   ├── components/
│   │   ├── file-manager/
│   │   ├── file-preview/
│   │   └── notification/
│   ├── services/
│   │   ├── file-system.service.ts
│   │   ├── notification.service.ts
│   │   └── selection.service.ts
│   └── models/
│       └── file-system.model.ts
├── environments/
└── assets/
```
