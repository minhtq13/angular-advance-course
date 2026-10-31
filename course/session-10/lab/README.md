# Lab buổi 10 — Nâng cấp, hiện đại hóa và bảo vệ dự án cuối khóa

**Thời gian:** 120 phút · **Điểm xuất phát:** `git checkout session10-start`

**Use case.** Care Portal "bản cũ" (`fixtures/legacy-a21/`, Angular 21, `NgModule`, zone.js, `ngx-toastr`) phải lên Angular 22. Nâng thẳng thì
`ng update` dừng; `--force` thì CI hỏng; lên được thì test không biên dịch. Lab này: inventory, kế hoạch checkpoint có rollback, hiện đại hóa trên 21,
nâng 22, đánh giá zoneless bằng test, rồi bảo vệ capstone bằng bằng chứng.

**Sản phẩm nộp:** `docs/nang-cap-angular-22.md` (inventory + migration plan) · lịch sử commit theo checkpoint · ADR zoneless · `docs/capstone-bang-chung.md`
(điều kiện bắt buộc, bằng chứng theo rubric, kế hoạch áp dụng) · phiếu chấm chéo (`lab/phieu-cham.md`).

Trước khi bắt đầu:
```bash
git checkout session10-start
git switch -c nhom-<ten>                        # nhánh làm việc của nhóm: mỗi checkpoint một commit
cd fixtures/legacy-a21 && nvm use && npm ci
npx ng test --watch=false && npx ng build       # mốc xuất phát: 7 test xanh
```

`npm ci` cần tải package (`node_modules` của fixture khoảng 320 MB; bài 3 tải thêm Angular 22): mạng có proxy hoặc Nexus thì cấu hình `npm config set registry ...` trước buổi học.

---

## Bài 1 — Inventory và migration plan (20 phút)

1. Liệt kê dependency và phiên bản mới nhất: `npm outdated`, `npx ng update` (không tham số: chỉ liệt kê).
2. Với từng thư viện bên thứ ba: `npm view <pkg> peerDependencies`, `npm view <pkg> time.modified`, `npm view <pkg> license`.
   Thư viện nào **chặn** Angular 22? Thư viện nào bị bỏ rơi nhưng không chặn?
3. Yêu cầu của Angular 22 với Node và TypeScript: `npm view @angular/core@22 engines`, `npm view @angular/compiler-cli@22 peerDependencies.typescript`.
   So với cột "Latest" của `npm outdated` cho `typescript`.
4. Viết `docs/nang-cap-angular-22.md`: bảng inventory (đang dùng, mới nhất, tương thích 22, phát hành gần nhất, kết luận) và bảng checkpoint
   (lệnh, kiểm tra, **lệnh rollback**). Thứ tự: hiện đại hóa trước hay nâng trước? Vì sao?

**Kiểm tra:** chỉ ra thư viện chặn kèm thông báo lỗi thật (chạy thử `npx ng update @angular/core@22 @angular/cli@22` rồi đọc, **không** `--force`);
mỗi checkpoint có lệnh rollback.

## Bài 2 — Checkpoint 1–2 trên Angular 21 (35 phút)

1. **Checkpoint 1: thay `ngx-toastr`.** Viết test trước cho `NotificationService` (hiện thông báo, tự ẩn sau thời gian quy định, nhiều thông báo ẩn
   riêng). Viết service bằng `signal` và một component standalone hiển thị (`role="status"`). Sửa `TicketListComponent`, gỡ package:
   `npm uninstall ngx-toastr`, bỏ CSS toastr trong `angular.json`. Thêm test: thông báo hiện trong `App`. Commit.
2. **Checkpoint 2: standalone.** Chạy lần lượt, **sau mỗi lệnh chạy `npx ng test --watch=false`** và ghi kết quả:
   ```bash
   npx ng g @angular/core:standalone --mode=convert-to-standalone --path=./
   npx ng g @angular/core:standalone --mode=prune-ng-modules --path=./
   npx ng g @angular/core:standalone --mode=standalone-bootstrap --path=./
   ```
   Test nào đỏ, thông báo gì? Migration có sửa spec không? Đọc `src/main.ts` sau bước cuối: còn API kiểu `NgModule` nào? Sửa tay:
   `app.config.ts` với `provideHttpClient()`, `provideRouter()`; spec dùng `imports` và `provideHttpClientTesting()`. Commit.
3. Tiếp: `npx ng g @angular/core:control-flow --path=./`, `... :inject`, `... :signal-input-migration`, `... :output-migration`. Input nào migration
   bỏ qua? Chạy lại với `--insert-todos` để đọc lý do, rồi chuyển tay. Test sau mỗi lệnh. Commit.

**Kiểm tra:** `grep -rn "NgModule\|toastr\|HttpClientModule\|\*ngIf\|@Input" src` không còn gì; test xanh; bảng "lệnh → test đỏ/xanh → sửa gì".

## Bài 3 — Checkpoint 3: Angular 22 (20 phút)

1. `npx ng update @angular/core@22 @angular/cli@22` (không `--force`). Ghi thời gian và **danh sách migration** đã sửa file (đọc output).
2. Test, build, rồi `rm -rf node_modules && npm ci`: lockfile có cài lại được như trên CI không? Commit.
3. **Thử phá:** xóa các dòng `changeDetection: ChangeDetectionStrategy.Eager` mà migration vừa thêm (giả lập "sửa `package.json` bằng tay").
   Test nào đỏ? Đọc mô tả `ChangeDetectionStrategy` trong `node_modules/@angular/core` để giải thích. Hoàn tác.

**Kiểm tra:** không dùng `--force`; `npm ci` sạch; giải thích được mỗi migration đổi hành vi gì (`Eager`, `withXhr()`).

## Bài 4 — Checkpoint 4: zoneless (20 phút)

1. Bỏ `provideZoneChangeDetection` (app và spec), bỏ `zone.js` khỏi `polyfills` trong `angular.json`. Chạy test: test nào đỏ? Vì sao test cũ
   (có `zone.js`) xanh?
2. Sửa cho đúng kiểu zoneless (gợi ý: field gán trong `setTimeout`). Component nào bỏ được `Eager` (về `OnPush` mặc định) mà test vẫn xanh?
3. `npm uninstall zone.js`; so bundle ban đầu trước/sau. Mở `npx ng serve --port 4400`, duyệt một phiếu: thông báo hiện, dòng "Đã duyệt" tự ẩn sau 3 giây.
4. Viết ADR (`course/_templates/adr.md`): nâng thẳng hay theo checkpoint, zoneless có điều kiện gì. Commit.

**Kiểm tra:** test đỏ khi bỏ zone, xanh khi sửa; số bundle; ADR có phương án đã loại và bằng chứng.

## Bài 5 — Capstone (25 phút)

1. **Điều kiện bắt buộc** trên Care Portal (`docker compose -f infra/docker-compose.yml up -d`):
   - Build: `cd frontend && npx nx run-many -t lint test build`.
   - API từ chối: không token → 401; `agent1` `PATCH /api/tickets/1` với `{"status":"CLOSED","version":0}` → 403; `agent1` `GET /api/admin/stats` → 403.
   - Không có secretKey trong client: `npx nx build portal` rồi `grep -rlE 'care-dev-secret|jwt-secret|JWT_SECRET|secretKey|client_secret' dist/apps`.
2. Điền `docs/capstone-bang-chung.md`: bảng điều kiện (lệnh + kết quả), bằng chứng theo rubric (file trong repo), kịch bản demo
   (1 luồng thành công, 3 ca thất bại), **kế hoạch áp dụng** cho một feature của dự án thật (vấn đề có số đo, kỹ thuật, checkpoint, cách đo).
3. Demo 8 phút mỗi nhóm; nhóm khác chấm bằng `lab/phieu-cham.md`.

**Kiểm tra:** ba điều kiện bắt buộc có output thật; mỗi mục rubric trỏ tới file; kế hoạch áp dụng có số đo hiện tại.
