import { effect, inject, untracked } from '@angular/core';
import { AuthService } from '@care/shared-data-access-auth';
import {
  patchState,
  signalStore,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';

export interface RecentSubscriber {
  id: number;
  msisdn: string;
  fullName: string;
}

const MAX_RECENT = 5;

/**
 * Thue bao xem gan day (toi da 5): nhan vien CSKH hay quay lai khach hang vua tra cuu.
 * State phien: providedIn 'root' de giu khi chuyen man hinh, nhung chua du lieu ca nhan cua khach hang
 * nen phai xoa khi doi phien (dang xuat, nguoi khac dang nhap tren cung tab).
 */
export const RecentSubscribers = signalStore(
  { providedIn: 'root' },
  withState<{ items: RecentSubscriber[] }>({ items: [] }),
  withMethods((store) => ({
    add(subscriber: RecentSubscriber): void {
      patchState(store, ({ items }) => ({
        items: [
          subscriber,
          ...items.filter((s) => s.id !== subscriber.id),
        ].slice(0, MAX_RECENT),
      }));
    },
  })),
  withHooks((store) => {
    const auth = inject(AuthService);
    return {
      onInit() {
        // Moi lan nguoi dang nhap doi (ke ca dang xuat) -> xoa. untracked: chi theo doi username.
        effect(() => {
          auth.username();
          untracked(() => patchState(store, { items: [] }));
        });
      },
    };
  }),
);
