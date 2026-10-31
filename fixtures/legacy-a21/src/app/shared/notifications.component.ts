import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notifications',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="notifications" role="status" aria-live="polite">
      @for (n of notifications.messages(); track n.id) {
        <p class="notification">{{ n.text }}</p>
      }
    </div>
  `,
  styles: `
    .notifications {
      position: fixed;
      right: 16px;
      bottom: 16px;
      display: grid;
      gap: 8px;
    }
    .notification {
      margin: 0;
      padding: 8px 12px;
      border-radius: 6px;
      background: #135200;
      color: #fff;
    }
  `,
})
export class NotificationsComponent {
  protected readonly notifications = inject(NotificationService);
}
