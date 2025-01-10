import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { FileManagerComponent } from './components/file-manager/file-manager.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatTreeModule } from '@angular/material/tree';
import { MatButtonModule } from '@angular/material/button';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NewFolderComponent } from './components/new-folder/new-folder.component';
import { FilePreviewComponent } from './components/file-preview/file-preview.component';
import { MatDividerModule } from '@angular/material/divider';
import { BatchOperationsService } from './services/batch-operations.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NotificationsComponent } from './components/notifications/notifications.component';

@NgModule({
  declarations: [
    AppComponent,
    FileManagerComponent,
    NewFolderComponent,
    FilePreviewComponent,
    NotificationsComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MatSnackBarModule,
    BrowserAnimationsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatTreeModule,
    DragDropModule,
    MatDividerModule,
    MatCheckboxModule,
  ],
  providers: [
    provideAnimationsAsync(),
    BatchOperationsService,

  {
    provide:HTTP_INTERCEPTORS,
    useClass:ErrorInterceptor,
    multi:true
  }
      ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule { }
