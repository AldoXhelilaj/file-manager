import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  duration?: number;
  action?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  
  constructor(private snackBar: MatSnackBar) {}

  // For quick toast messages
  showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000) {
    const panelClass = `notification-${type}`;
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: [panelClass],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  // For more persistent notifications
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date()
    };

    const currentNotifications = this.notifications.getValue();
    this.notifications.next([...currentNotifications, newNotification]);

    // Auto-remove if duration is set
    if (notification.duration) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, notification.duration);
    }
  }

  removeNotification(id: string) {
    const currentNotifications = this.notifications.getValue();
    this.notifications.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}