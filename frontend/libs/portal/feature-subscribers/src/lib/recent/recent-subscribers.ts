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
 * Thuê bao xem gần đây (tối đa 5): nhân viên CSKH hay quay lại khách hàng vừa tra cứu.
 * State phiên: providedIn 'root' để giữ khi chuyển màn hình, nhưng chứa dữ liệu cá nhân của khách hàng
 * nên phải xóa khi đổi phiên (đăng xuất, người khác đăng nhập trên cùng tab).
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
        // Mỗi lần người đăng nhập đổi (kể cả đăng xuất) -> xóa. untracked: chỉ theo dõi username.
        effect(() => {
          auth.username();
          untracked(() => patchState(store, { items: [] }));
        });
      },
    };
  }),
);
