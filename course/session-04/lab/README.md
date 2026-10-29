# Lab buổi 4 — State Management và lựa chọn NgRx

**Thời gian:** 120 phút · **Điểm xuất phát:** `git checkout session04-start`

**Use case.** Nhân viên CSKH phàn nàn về trang **Phiếu yêu cầu**: F5 mất bộ lọc, gửi link không mở đúng danh sách, Back văng khỏi trang,
tạo phiếu xong quay về thì mất bộ lọc. Ngoài ra, tính năng **Thuê bao xem gần đây** (có sẵn ở điểm bắt đầu) làm rò dữ liệu: người đăng
nhập sau trên cùng tab thấy khách hàng người trước vừa tra cứu.

**Sản phẩm nộp cuối buổi:** `docs/ma-tran-state.md`, `docs/adr/0003-state-trang-phieu.md`, test tính nhất quán của bộ lọc
(`ticket-list.url.spec.ts`), nhánh code pass `npx nx run-many -t lint test build`.

Trước khi bắt đầu:
```bash
git checkout session04-start
docker compose -f infra/docker-compose.yml up -d
cd frontend && npm ci && npm start
```
Tất cả lệnh `nx` chạy trong `frontend/`. Test lib phiếu: `npx nx test portal-feature-tickets --watch`.

---

## Bài 1 — Ma trận lựa chọn state (15 phút)

Tạo `docs/ma-tran-state.md`. Với mỗi state dưới đây, điền: **phạm vi** (ai đọc), **vòng đời** (mất khi nào), **số nơi ghi**,
**cần giữ khi F5/chia sẻ?**, **loại** (local UI / feature / URL / session / server), **công cụ** bạn chọn.

- Bộ lọc trang Phiếu (trạng thái, ưu tiên, "của tôi"), trang, sort
- Danh sách phiếu + tổng + đang tải/lỗi
- `approvingId`, thông báo "Đã duyệt"
- Người đăng nhập, vai trò
- Thuê bao xem gần đây
- Ngôn ngữ, theme
- Nội dung form tạo phiếu
- Từ khóa ô chọn thuê bao

Thêm một mục: dấu hiệu nào khiến bạn chọn **Global Store** (NgRx Store), và Care Portal có dấu hiệu đó chưa.

---

## Bài 2 — `TicketListStore` (35 phút)

Tạo `libs/portal/feature-tickets/src/lib/ticket-list/ticket-list.store.ts` bằng `signalStore` (`@ngrx/signals`):

1. **State:** `filters` (`status`, `priority`, `onlyMine`), `page` (`PageRequest`), `items`, `total`, `status` (`'loading' | 'done' | 'error'`).
2. **Computed:** `query` (`TicketQuery`, `assignee` lấy từ `AuthService.username()` khi `onlyMine`), `hasFilters`.
3. **Methods:**
   - `setFilters(change)`: gộp bộ lọc, **về trang 0**, giữ `size` và `sort`.
   - `clearFilters()`, `setPage(page)` (bỏ qua nếu `samePage` với trang hiện tại), `reload()`.
   - `_load = rxMethod<{ query; page }>(...)`: `tap` đặt `loading` → `switchMap` gọi `TicketPort.search` → `patchState` kết quả;
     `catchError` **bên trong** `switchMap` đặt `error` và trả `EMPTY`.
4. **Hooks:** `onInit` gọi `store._load(computed(() => ({ query: store.query(), page: store.page() })))`.
5. `TicketListPage`: `providers: [TicketListStore]`, `protected readonly store = inject(TicketListStore)`. Xóa signal bộ lọc, `linkedSignal`,
   `rxResource` khỏi component; template đọc `store.filters()`, `store.items()`, `store.total()`, `store.status()`; thao tác gọi method của store.
   `approvingId`, thông báo vẫn là `signal` trong component (local UI).
6. **Test** `ticket-list.store.spec.ts` (không cần component): `providers: [TicketListStore, fake TicketPort, fake AuthService]`,
   `TestBed.inject(TicketListStore)`, `TestBed.tick()` để chạy effect. Ít nhất:
   - Khởi tạo → một lần gọi `search`, `status` là `done`.
   - Đổi trang rồi đổi bộ lọc → lần gọi cuối có `page: 0`, giữ `size`.
   - `setPage` cùng trang → không gọi thêm.
   - `search` lỗi (`vi.spyOn(port, 'search').mockReturnValueOnce(throwError(...))`) → `error`; `reload()` → `done` với đúng query.

Kiểm tra: test cũ của `ticket-list.page.spec.ts` vẫn pass (hành vi không đổi).

---

## Bài 3 — URL là nguồn sự thật (35 phút)

### 3.1 Đọc/ghi URL

Tạo `ticket-url.ts` (hàm thuần, có test riêng `ticket-url.spec.ts`):
- `filtersFromParams(params: ParamMap)`: `status`, `priority` chỉ nhận giá trị trong danh sách enum; `mine=1` → `onlyMine`.
- `pageFromParams(params)`: `page` trên URL **đếm từ 1**; `size` chỉ 20/50/100; `sort` khớp `^(code|priority|createdAt),(asc|desc)$`;
  sai → mặc định.
- `toQueryParams(filters, page)`: bỏ giá trị mặc định (không ghi `page=1`, `size=20`, `sort=id,desc`).

### 3.2 Store đọc URL

- Bỏ `filters`, `page` khỏi state. Thêm `withProps`: `_router`, `_route = inject(ActivatedRoute)`,
  `_params = toSignal(route.queryParamMap, { requireSync: true })`.
- `filters`, `page` thành `computed` từ `_params()` (`page` dùng `equal: samePage`).
- `setFilters`, `clearFilters`, `setPage` gọi `router.navigate([], { relativeTo: _route, queryParams: toQueryParams(...) })` và trả về
  Promise của nó (test cần `await`). `reload()` giữ nguyên: URL không đổi thì router không điều hướng.

### 3.3 Test tính nhất quán của bộ lọc

`ticket-list.url.spec.ts` với `RouterTestingHarness`, `provideRouter([{ path: 'tickets', component: TicketListPage }])`,
`provideLocationMocks()`; gọi `TestBed.inject(Router).initialNavigation()` sau khi tạo harness. Bốn test:
1. Mở `/tickets?status=RESOLVED&priority=HIGH&page=2` → request đúng bộ lọc, `page: 1`; ô Trạng thái hiện "Đã xử lý".
2. URL sai (`status=DROP&size=5000&sort=password,asc`) → mặc định.
3. `setFilters({ priority: 'HIGH' })` → `router.url` đúng; `location.back()` → về bộ lọc cũ và request lại; `location.forward()` → lại `HIGH`.
   Chờ `NavigationEnd` trước khi kiểm tra (router xử lý popstate bất đồng bộ).
4. `reload()` → gọi lại đúng query dù URL không đổi.

Thử tay: lọc **Đã xử lý**, F5, copy URL sang cửa sổ ẩn danh, đổi bộ lọc 3 lần rồi Back.

### 3.4 ADR-0003

Viết `docs/adr/0003-state-trang-phieu.md` theo mẫu `course/_templates/adr.md`: bối cảnh (4 lời phàn nàn), ít nhất 4 phương án (giữ nguyên,
store root, đồng bộ hai chiều, Global Store, URL là nguồn sự thật), quyết định, hệ quả, cách kiểm chứng (test nào). Thêm dòng vào `docs/adr/README.md`.

---

## Bài 4 — Làm mới sau thao tác ghi (15 phút)

1. **Duyệt phiếu:** sau khi thành công đã gọi `store.reload()`. Bổ sung assertion vào test duyệt ở `ticket-list.page.spec.ts`:
   số lần `search` tăng **đúng 1**, và lần gọi cuối **bằng** lần gọi trước khi duyệt (cùng bộ lọc, cùng trang).
2. **Tạo phiếu quay về đúng bộ lọc:**
   - Store thêm `listUrl` (computed): `router.serializeUrl(router.createUrlTree([], { relativeTo: _route, queryParams: toQueryParams(...) }))`.
   - Nút **Tạo phiếu** ở danh sách: `[queryParams]="{ returnUrl: store.listUrl() }"`.
   - `TicketCreatePage`: `returnUrl = input<string>()`; hàm `backToList(url)` dùng `safeReturnUrl` (từ `@care/shared-data-access-auth`) và
     **chỉ** chấp nhận `/tickets` hoặc `/tickets?...`, còn lại về `/tickets`. Tạo xong `navigateByUrl(backUrl, { state: { created } })`;
     nút **Hủy** `[routerLink]="backUrl()"` (UrlTree).
   - Test `it.each` cho `returnUrl`: `/tickets?status=RESOLVED&page=2` giữ nguyên; `https://evil.example/phish`, `//evil.example`,
     `/admin/dashboard` → `/tickets`.

Thử tay: lọc `?status=NEW`, bấm **Tạo phiếu**, tạo xong phải quay về `/tickets?status=NEW` và thấy phiếu mới ở đầu bảng.

---

## Bài 5 — Xóa state khi đổi phiên (20 phút)

1. **Thấy lỗi:** đăng nhập `agent1`, mở 2 thuê bao, bấm menu **Thuê bao** (không F5): dòng *Xem gần đây*. Đăng xuất, đăng nhập
   `supervisor1`: vẫn thấy 2 thuê bao của agent1.
2. **Test đỏ:** trong `recent-subscribers.spec.ts`, cung cấp `AuthService` giả có `username = signal('agent1')`. Thêm test:
   `add(...)`, rồi `username.set('')` + `TestBed.tick()` → `items()` rỗng; `username.set('supervisor1')` + `TestBed.tick()` → vẫn rỗng.
3. **Sửa:** chuyển `RecentSubscribers` thành `signalStore({ providedIn: 'root' }, withState(...), withMethods(add), withHooks(...))`.
   Trong hook (dạng factory để `inject(AuthService)`), `onInit` tạo `effect` đọc `auth.username()` và
   `untracked(() => patchState(store, { items: [] }))`.
4. Thử lại bước 1.

Câu hỏi thảo luận (review chéo):
- Còn state nào `providedIn: 'root'` trong Care Portal (hoặc dự án của bạn) giữ dữ liệu gắn với người dùng?
- Vì sao xóa bằng effect theo `username` an toàn hơn gọi `recent.clear()` trong `AuthService.logout()`? (Gợi ý: phiên hết hạn,
  interceptor chuyển về `/login`, đăng nhập lại người khác.)
- Nếu cả nhóm 10 người cùng sửa trang Phiếu và cần audit mọi thay đổi bộ lọc, bạn có chuyển sang Global Store không?

---

## Kiểm tra cuối lab

```bash
npx nx run-many -t lint test build
```

## Review chéo (20 phút)

Mỗi nhóm 5 phút: ma trận state (một dòng nhóm khác chọn khác), ADR-0003 (phương án bị loại và lý do), demo F5/Back/link chia sẻ.

## Đáp án

Đáp án nằm trong [`../solution/`](../solution/). Chỉ mở sau khi đã tự làm.
