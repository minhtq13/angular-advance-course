# Đáp án lab buổi 10

## Áp đáp án vào code

Trong thư mục gốc repo, từ `session10-start`:

```bash
git apply course/session-10/solution/bai1-inventory-va-ke-hoach.patch
git apply course/session-10/solution/bai2-go-chan-va-standalone.patch
git apply course/session-10/solution/bai3-ng-update-22.patch
git apply course/session-10/solution/bai4-zoneless-va-adr.patch
git apply course/session-10/solution/bai5-capstone-bang-chung.patch
cd fixtures/legacy-a21 && npm ci      # sau mỗi patch đổi package-lock.json (bài 2, 3, 4)
```

Gỡ theo thứ tự ngược lại. Bản đã áp đủ là nhánh `session10-end`. Patch bài 3 dài (khoảng 9.000 dòng) vì gồm `package-lock.json` của Angular 22.

Đã kiểm tra: sau **từng** patch, fixture `npm ci` + `ng test` + `ng build` xanh; `frontend/` không đổi, gate 16 project xanh trên `-start` và `-end`;
áp đủ ra đúng `session10-end`, gỡ ra về đúng `session10-start`. Trên trình duyệt (bản gốc và bản cuối): 5 phiếu, bấm Duyệt → thông báo, dòng
"Đã duyệt" tự ẩn sau 3 giây, 0 lỗi console. Số đo trên máy Apple Silicon.

---

## Bài 1 — Inventory và migration plan

Bản mẫu: `docs/nang-cap-angular-22.md`. Điểm chấm: tìm ra `ngx-toastr` chặn (peer `^21.0.0`, không phát hành từ 2026-02-06) kèm thông báo thật;
`ngx-pipes` bỏ rơi (2023-05-07) nhưng không chặn; Angular 22 cần TypeScript `>=6.0 <6.1` (cột "Latest" của `npm outdated` là 7.0.2) và Node
`^22.22.3 || ^24.15.0 || >=26` (bỏ Node 20); thứ tự "hiện đại hóa trên 21 rồi mới nâng" có lý do; mỗi checkpoint có lệnh rollback kèm `npm ci`.

## Bài 2 — Checkpoint 1–2 trên Angular 21

| Bước | Kết quả đo |
|---|---|
| Test `NotificationService` viết trước | Đỏ: `Could not resolve "./notification.service"` |
| Checkpoint 1 (thay `ngx-toastr`) | 9 test xanh; bundle ban đầu 377,59 → 342,33 kB |
| `standalone --mode=convert-to-standalone` | 4 file; **3 test đỏ**: `Unexpected "_TicketListComponent" found in the "declarations" array of the "TestBed.configureTestingModule" call, ... is marked as standalone`. Migration không sửa spec |
| `--mode=prune-ng-modules` | `Nothing to be done.` |
| `--mode=standalone-bootstrap` | Xóa `app-module.ts`; `main.ts` dùng `importProvidersFrom(BrowserModule, AppRoutingModule, HttpClientModule, ReactiveFormsModule, NgPipesModule)`, còn import `platformBrowser` thừa |
| Sửa tay | `app.config.ts` (`provideHttpClient`, `provideRouter`), `app.routes.ts`; spec dùng `imports: [Component]`, `provideHttpClientTesting()`: 9 xanh |
| `control-flow` | 2 file, xanh; giữ `track byId($index, t)` (viết `track t.id` gọn hơn) |
| `inject` | 2 file, xanh |
| `signal-input-migration` | **0/1**. `--insert-todos`: `This input is used in a control flow expression (e.g. @if or *ngIf) and migrating would break narrowing currently.` Chuyển tay: `input.required<Ticket>()` + `@let t = ticket();` |
| `output-migration` | 1/1 |
| Kết thúc bài 2 | 10 test (thêm "thông báo hiện trên màn hình"), bundle 313,94 kB; không còn `NgModule`, `*ngIf`, `@Input`, `HttpClientModule` |

## Bài 3 — Angular 22

`npx ng update @angular/core@22 @angular/cli@22`: 27 giây, không `--force`. Migration sửa file: `ChangeDetectionStrategy.Eager` vào `App`,
`TicketListComponent`, `TicketRowComponent` (`NotificationsComponent` đã `OnPush` nên không đổi); `provideHttpClient(withXhr())`; `tsconfig.app.json`
tắt `nullishCoalescingNotNullable`, `optionalChainNotNullable`. TypeScript lên `~6.0.3`. 10 test xanh, bundle 336,41 kB, `npm ci` sạch.

## Bài 4 — Zoneless

| Bước | Kết quả |
|---|---|
| Bỏ `provideZoneChangeDetection` + `zone.js` | 1 đỏ: `expected <p class="flash"></p> to be null` (dòng "Đã duyệt" không tự ẩn); bundle 297,49 kB |
| `lastApproved` → `signal` | 10 xanh |
| Bỏ `Eager` ở 3 component (về `OnPush` mặc định) | 10 xanh; bundle 297,44 kB |

ADR mẫu: `docs/adr/0004-nang-cap-app-cu-truoc-roi-zoneless.md`.

## Thử phá (đã chạy thật)

| Phá | Kết quả |
|---|---|
| M1 `NotificationService` không tự ẩn | 2 đỏ (hai test của service) |
| M2 `lastApproved` về field thường (zoneless) | 1 đỏ: "tu an dong Da duyet" |
| M3 bỏ `<app-notifications>` khỏi `App` | Bản đầu: **0 đỏ**. Thêm test "thông báo hiện trên màn hình": 1 đỏ |
| M4 bỏ lọc theo trạng thái | 1 đỏ: "loc theo trang thai" |
| M5 Angular 22 + zone.js, bỏ `Eager` (nâng bằng tay) | 1 đỏ: "tu an dong Da duyet" |
| M6 `ng update --force` | Test vẫn chạy được trên máy (sau khi thêm `import './app-module'`); `npm ci` từ lockfile: `ERESOLVE` |

Bài học từ M3: thay một thư viện UI thì phải có test **ở chỗ dùng** (thông báo hiện trong app), không chỉ test service.
Bài học từ M6: gate trên máy dev không bắt được `--force`; bước `npm ci` sạch (như CI) mới bắt.

## Bài 5 — Capstone

Bản mẫu: `docs/capstone-bang-chung.md`. Đo trên `session09-end` (backend riêng): gate 16 project xanh; không token 401; `agent1` PATCH đóng phiếu 403;
`agent1` `GET /api/admin/stats` 403 (`admin1` 200); `grep` secret trên `frontend/dist/apps`: 0 file (1 kết quả trong `apps/portal-e2e`, không vào bundle);
realm Keycloak `"publicClient": true`.

Điểm chấm: ba điều kiện có output thật; mỗi mục rubric trỏ tới file có thật; kế hoạch áp dụng có số đo hiện tại và cách đo thành công.

---

## Phần chuẩn bị ở `session10-start` (để giảng viên biết)

| Phần | Nội dung |
|---|---|
| `fixtures/legacy-a21/` | `@angular/cli@21 new --standalone=false --zoneless=false --test-runner=vitest`; viết thêm màn hình phiếu kiểu cũ (`NgModule`, `*ngIf/*ngFor`, `@Input/@Output`, constructor DI, `BehaviorSubject`, `HttpClientModule`, `HttpClientTestingModule`), `ngx-toastr` 20.0.5, `ngx-pipes` 3.2.2, 7 test, `.nvmrc` 24.22.0 |
| Test phụ thuộc zone | "tự ẩn dòng Đã duyệt" dùng `autoDetectChanges` + timer thật (Vitest không chạy `fakeAsync`: `Expected to be running in 'ProxyZone'`) |
| `frontend/`, `backend/` | Không đổi |
