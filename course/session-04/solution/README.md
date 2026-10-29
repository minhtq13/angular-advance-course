# Đáp án lab buổi 4

## Áp đáp án vào code

Trong thư mục gốc repo, từ `session04-start`:

```bash
git apply course/session-04/solution/bai1-ma-tran-state.patch
git apply course/session-04/solution/bai2-signal-store.patch
git apply course/session-04/solution/bai3-bo-loc-tren-url.patch
git apply course/session-04/solution/bai4-lam-moi-sau-ghi.patch
git apply course/session-04/solution/bai5-xoa-state-khi-doi-phien.patch
```

Gỡ theo thứ tự ngược lại. Bản đã áp đủ là nhánh `session04-end`.

Đã kiểm tra:
- Sau **từng** patch, `nx run-many -t lint test build` pass (16 project).
- Áp đủ 5 patch ra đúng `session04-end`, gỡ ra về đúng `session04-start`.
- Trên trình duyệt thật với backend thật:
  - Lọc **Đã xử lý** → URL `/tickets?status=RESOLVED`; F5 giữ bộ lọc; Back về `/tickets`.
  - Từ `/tickets?status=NEW` bấm **Tạo phiếu** → tạo xong quay về `/tickets?status=NEW`, phiếu mới ở đầu bảng.
  - Đổi phiên: ở `session04-start`, supervisor1 **thấy** thuê bao agent1 vừa xem; sau Bài 5 thì không.

---

## Bài 1 — Ma trận state

Bản mẫu: `docs/ma-tran-state.md` (trong patch). Các điểm hay chọn sai:

| State | Hay chọn | Nên chọn | Vì sao |
|---|---|---|---|
| Bộ lọc trang Phiếu | Store root để "giữ khi chuyển trang" | **URL** | Cần F5, chia sẻ link, Back. Store root vẫn mất khi F5 |
| Danh sách phiếu | Store root để "khỏi tải lại" | Store theo component, tải lại mỗi lần vào | Server state là bản sao, dễ cũ; dữ liệu nhiều người sửa |
| Thuê bao xem gần đây | Bỏ qua vòng đời | Session: root + **xóa khi đổi phiên** | Dữ liệu cá nhân của khách hàng |
| `approvingId` | Đưa vào store | `signal` trong component | Chỉ một nút cần biết |

## Bài 2 — `TicketListStore`

Ý chính (bản cuối nằm trong patch Bài 3, vì Bài 3 thay `filters`/`page` bằng URL):

```ts
const load = rxMethod<{ query: TicketQuery; page: PageRequest }>(
  pipe(
    tap(() => patchState(store, { status: 'loading' })),
    switchMap(({ query, page }) =>
      tickets.search(query, page).pipe(
        tap(({ items, total }) => patchState(store, { items, total, status: 'done' })),
        catchError(() => { patchState(store, { status: 'error' }); return EMPTY; }),
      ),
    ),
  ),
);
```

Điểm chấm:
- `patchState` là cách duy nhất ghi state; component không có signal bộ lọc nào.
- `_load` riêng tư (dấu `_`), component chỉ gọi `setFilters`, `setPage`, `clearFilters`, `reload`.
- `setPage` cùng trang bị bỏ qua (nz-table phát lại khi khởi tạo); test chứng minh.
- `catchError` bên trong `switchMap` (nối buổi 3).

## Bài 3 — URL là nguồn sự thật

| File | Vai trò |
|---|---|
| `ticket-url.ts` + spec | Đọc/ghi URL, kiểm tra giá trị, bỏ mặc định |
| `ticket-list.store.ts` | `withProps` (`_router`, `_route`, `_params`), `filters`/`page` là `computed` từ URL, method điều hướng |
| `ticket-list.url.spec.ts` | Link chia sẻ, URL sai, Back/Forward, reload |
| `docs/adr/0003-state-trang-phieu.md` | ADR giải pháp |

Hai chi tiết test hay vướng:

```ts
harness = await RouterTestingHarness.create();
TestBed.inject(Router).initialNavigation();   // không có dòng này, router không nghe popstate

async function afterNavigation(action: () => void) {
  const done = firstValueFrom(router.events.pipe(filter((e) => e instanceof NavigationEnd)));
  action();                                    // location.back() / forward()
  await done;
  await settle();
}
```

Điểm chấm:
- Một nguồn sự thật: không có `effect` ghi URL, không có `subscribe` URL ghi signal.
- Giá trị URL được kiểm tra; trang trên URL đếm từ 1; mặc định không lên URL.
- ADR có phương án "đồng bộ hai chiều" bị loại với lý do cụ thể.

## Bài 4 — Làm mới sau ghi

- Duyệt: test xác nhận `search` được gọi **đúng một lần** với **đúng** query và trang trước đó.
- Tạo phiếu: `returnUrl` đi từ danh sách sang trang tạo và quay về. `backToList` dùng `safeReturnUrl` rồi giới hạn tiền tố `/tickets`:
  `/admin/dashboard` là URL nội bộ hợp lệ nhưng không phải danh sách phiếu, nên vẫn về `/tickets`.

## Bài 5 — Xóa state khi đổi phiên

```ts
withHooks((store) => {
  const auth = inject(AuthService);
  return {
    onInit() {
      effect(() => {
        auth.username();
        untracked(() => patchState(store, { items: [] }));
      });
    },
  };
}),
```

Câu hỏi thảo luận (một hướng đúng):
- Effect theo `username` bắt **mọi** đường đổi phiên: bấm đăng xuất, phiên hết hạn và interceptor chuyển về `/login`, đăng nhập người khác.
  Gọi `clear()` trong `logout()` chỉ bắt một đường và buộc `AuthService` (lib shared) biết về store của feature portal (ngược chiều phụ thuộc).
- Đây là một chỗ `effect` hợp lý: phản ứng với sự kiện bên ngoài store (đổi phiên), không phải suy ra giá trị.
- Global Store khi cần audit/time-travel cho thay đổi bộ lọc hoặc nhiều màn hình cùng ghi một state; một trang danh sách thì chưa cần.
