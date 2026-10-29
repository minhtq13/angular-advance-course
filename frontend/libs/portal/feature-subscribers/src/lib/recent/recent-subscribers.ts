import { Injectable, signal } from '@angular/core';

export interface RecentSubscriber {
  id: number;
  msisdn: string;
  fullName: string;
}

const MAX_RECENT = 5;

/**
 * Thue bao xem gan day (toi da 5): nhan vien CSKH hay quay lai khach hang vua tra cuu.
 * providedIn: 'root' de giu danh sach khi chuyen qua lai giua cac man hinh.
 */
@Injectable({ providedIn: 'root' })
export class RecentSubscribers {
  private readonly list = signal<RecentSubscriber[]>([]);
  readonly items = this.list.asReadonly();

  add(subscriber: RecentSubscriber): void {
    this.list.update((items) =>
      [subscriber, ...items.filter((s) => s.id !== subscriber.id)].slice(
        0,
        MAX_RECENT,
      ),
    );
  }
}
