import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: false,

  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {


  constructor(public notificationService: NotificationService) { }

  ngOnInit() {

  }

  get notifications$() {
    return this.notificationService.getNotifications();
  }

  removeNotification(id: string) {
    this.notificationService.removeNotification(id);
  }
}
