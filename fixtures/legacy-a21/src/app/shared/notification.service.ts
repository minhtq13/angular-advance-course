import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  text: string;
}

/**
 * Thay ngx-toastr (peer dependency chỉ nhận Angular ^21, chặn ng update lên 22).
 * Signal -> màn hình tự cập nhật cả khi không có zone.js.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  private readonly list = signal<Notification[]>([]);
  readonly messages = this.list.asReadonly();

  success(text: string, durationMs = 3000): void {
    const id = this.nextId++;
    this.list.update((l) => [...l, { id, text }]);
    setTimeout(() => this.list.update((l) => l.filter((n) => n.id !== id)), durationMs);
  }
}
