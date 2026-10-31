---
marp: true
theme: default
paginate: true
size: 16:9
header: 'Angular nâng cao · Buổi 10 — Nâng cấp, hiện đại hóa và bảo vệ dự án cuối khóa'
style: |
  section { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 26px; padding: 50px 64px; }
  h1 { color: #0050b3; }
  h2 { color: #0050b3; border-bottom: 3px solid #0050b3; padding-bottom: 6px; }
  header { color: #8c8c8c; font-size: 16px; }
  code { background: #f0f5ff; color: #1d39c4; }
  pre { font-size: 19px; line-height: 1.35; }
  table { font-size: 20px; }
  th { background: #0050b3; color: #fff; }
  .small { font-size: 20px; color: #595959; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .tip { background: #fffbe6; border-left: 6px solid #faad14; padding: 10px 16px; font-size: 22px; }
  .bad { background: #fff1f0; border-left: 6px solid #f5222d; padding: 10px 16px; font-size: 22px; }
  .good { background: #f6ffed; border-left: 6px solid #52c41a; padding: 10px 16px; font-size: 22px; }
  section.lead { background: #0050b3; color: #fff; justify-content: center; }
  section.lead h1, section.lead h2 { color: #fff; border: none; }
  section.lead header { color: #bae0ff; }
---

<!-- _class: lead -->
<!-- _paginate: false -->

# Buổi 10
## Nâng cấp, hiện đại hóa và bảo vệ dự án cuối khóa

Inventory dependency · checkpoint và rollback · CLI migration · Angular 22 · zoneless · capstone có bằng chứng

---

## Mục tiêu buổi học

Sau buổi này, học viên có thể:

1. Lập **inventory dependency**, tìm thư viện **chặn** nâng cấp
2. Lập **migration plan theo checkpoint**: mỗi bước một commit, test xanh, có rollback
3. Chạy **CLI migration** và sửa phần migration bỏ sót
4. Nâng major bằng `ng update`, hiểu **thay đổi hành vi** của Angular 22
5. Đánh giá **zoneless bằng test**; bảo vệ capstone bằng **bằng chứng**

<p class="small">Sản phẩm đầu ra: migration plan có rollback · capstone có evidence · kế hoạch áp dụng vào một feature thật</p>

---

## Lịch buổi học (4 giờ)

| Thời gian | Hoạt động |
|---|---|
| 20' | Review buổi 9 (pipeline, rollback), phân tích use case |
| 40' | Inventory, checkpoint, thứ tự nâng cấp, migration, Angular 22, zoneless, strangler, capstone |
| 30' | Live demo: nâng thẳng thất bại 3 kiểu; nâng theo checkpoint |
| 10' | Nghỉ |
| 120' | Lab 5 bài (gồm capstone) |
| 20' | Demo nhóm, review chéo theo rubric |

---

## Review buổi 9

- Gate xanh trên máy dev chưa đủ: **bản đã triển khai** cần smoke test
- Một image, nhiều môi trường; version nằm trong image, có trong log lỗi
- Rollback = chạy lại image cũ, đã diễn tập (0,4 giây)

<div class="tip">Hôm nay cùng tư duy đó cho nâng cấp: mỗi bước có test xanh và có đường lui. "Chạy được trên máy tôi" không phải là xong.</div>

---

## Use case: "nâng lên 22 cho kịp"

`fixtures/legacy-a21`: Angular 21, `NgModule`, `*ngIf`, `@Input`, zone.js, `ngx-toastr`, `ngx-pipes`, 7 test. Nâng thẳng:

| Bước | Kết quả đo |
|---|---|
| `ng update @angular/core@22 @angular/cli@22` | **Dừng**: `ngx-toastr` requires `^21.0.0` |
| Thêm `--force` | Xong, 28 giây |
| `npm ci` (máy khác, CI) | **`ERESOLVE`** |
| `ng build` | Xanh |
| `ng test` | **Không biên dịch**: NG8001, NG8002, NG8004 cho mọi component trong `NgModule` |
| Sửa `package.json` bằng tay | `OnPush` mặc định: dòng "Đã duyệt" không tự ẩn |

---

## Inventory dependency

```bash
npm outdated                                      # đang dùng / mới nhất
npx ng update                                     # gói có ng update
npm view ngx-toastr peerDependencies time.modified license
npm view @angular/compiler-cli@22 peerDependencies.typescript
```

| Package | Tương thích 22 | Phát hành gần nhất | Kết luận |
|---|---|---|---|
| `ngx-toastr` 20.0.5 | Không (peer `^21.0.0`) | 2026-02-06 | **Chặn**: thay trước khi nâng |
| `ngx-pipes` 3.2.2 | Có (peer `>=14`) | 2023-05-07 | Bỏ rơi, không chặn: ghi rủi ro |
| `typescript` | Cần `>=6.0 <6.1` | "Latest": 7.0.2 | Đừng theo cột Latest |
| Node | `^22.22.3 \|\| ^24.15.0 \|\| >=26` | | Angular 22 bỏ Node 20 |

---

## `--force` là món nợ, không phải lối tắt

```
npm error ERESOLVE could not resolve
npm error While resolving: ngx-toastr@20.0.5
npm error Found: @angular/common@22.2.4
npm error Could not resolve dependency:
npm error peer @angular/common@"^21.0.0" from ngx-toastr@20.0.5
```

- Trên máy mình: `node_modules` cũ còn đó, mọi thứ "chạy"
- CI, máy đồng nghiệp: `npm ci` từ lockfile **dừng**
- Lựa chọn thật: chờ thư viện, fork, **thay** (30 dòng `NotificationService` với signal), hoặc `overrides` có ghi rủi ro

<div class="bad">Gate trên máy dev không bắt được <code>--force</code>. Bước <code>rm -rf node_modules &amp;&amp; npm ci</code> như CI mới bắt.</div>

---

## Thứ tự: hiện đại hóa trước, nâng major sau

| # | Checkpoint | Angular | Rollback |
|---|---|---|---|
| 0 | Mốc, 7 test | 21 | — |
| 1 | Thay `ngx-toastr` (test trước) | 21 | `git revert` |
| 2 | Standalone, control flow, `inject()`, signal input/output | 21 | `git reset --hard <cp1>` |
| 3 | `ng update` (không `--force`) | **22** | `git reset --hard <cp2> && npm ci` |
| 4 | Zoneless (nếu test chứng minh được) | 22 | `git revert` |

- Mỗi checkpoint **một commit**, test + build xanh
- Rollback luôn kèm `npm ci`: `node_modules` phải khớp lockfile của commit quay về
- Lỗi xuất hiện thì biết ngay do bước nào

---

## Migration standalone: test đỏ ngay bước 1

```bash
npx ng g @angular/core:standalone --mode=convert-to-standalone --path=./
```

```
Error: Unexpected "_TicketListComponent" found in the "declarations" array of the
"TestBed.configureTestingModule" call, "_TicketListComponent" is marked as standalone
```

| Mode | Kết quả |
|---|---|
| `convert-to-standalone` | 4 file; **3 test đỏ** (spec không được sửa) |
| `prune-ng-modules` | `Nothing to be done.` |
| `standalone-bootstrap` | Xóa `app-module.ts`; `main.ts` dùng `importProvidersFrom(HttpClientModule, AppRoutingModule, ...)` |

Phần tay: spec dùng `imports`, `provideHttpClientTesting()`; `app.config.ts` với `provideHttpClient()`, `provideRouter()`.

---

## Migration làm được gì, bỏ sót gì

| Lệnh | Kết quả trên fixture |
|---|---|
| `control-flow` | 2 file; giữ `track byId($index, t)` (viết `track t.id` gọn hơn) |
| `inject` | 2 file, constructor DI → `inject()` |
| `signal-input-migration` | **0/1** |
| `output-migration` | 1/1 |

`--insert-todos` cho biết lý do:

```
// TODO: Skipped for migration because:
//  This input is used in a control flow expression (e.g. `@if` or `*ngIf`)
//  and migrating would break narrowing currently.
```

Sửa tay: `ticket = input.required<Ticket>()` và `@let t = ticket();` trong template.

---

## Angular 22: migration đổi gì

`ng update` (sau checkpoint 2): 27 giây, không `--force`, `npm ci` sạch, 10 test xanh.

| Migration | Vì sao |
|---|---|
| `changeDetection: ChangeDetectionStrategy.Eager` vào 3 component | 22 đổi mặc định sang **`OnPush`** |
| `provideHttpClient(withXhr())` | `FetchBackend` thành mặc định; giữ XHR như cũ |
| Tắt `nullishCoalescingNotNullable`, `optionalChainNotNullable` | Diagnostic mới |
| TypeScript `~6.0.3` | Theo `@angular/compiler-cli` |

```ts
declare enum ChangeDetectionStrategy {
  /** ... NOTE: OnPush is enabled by default. */
  OnPush = 0,
  Eager = 1,
```

---

## Nâng bằng tay = mất migration

Thử phá: bỏ các dòng `Eager` (như khi chỉ sửa số phiên bản trong `package.json`):

```
× duyet phieu: bao thanh cong, tu an dong "Da duyet" sau thoi gian quy dinh
AssertionError: expected <p class="flash"></p> to be null
```

- `lastApproved` là field thường, gán trong `setTimeout`: `OnPush` không kiểm lại component
- Build xanh, không lỗi console: **chỉ test hành vi mới bắt**
- Luôn dùng `ng update`; đọc từng dòng "Migration completed (N files modified)"

<div class="tip">Test bắt được lỗi này viết từ buổi đầu của fixture: "như người dùng, không ai gọi <code>detectChanges</code>".</div>

---

## App còn `NgModule` lên 22: test không biên dịch

```
✘ [ERROR] NG8001: 'router-outlet' is not a known element
✘ [ERROR] NG8002: Can't bind to 'formControl' since it isn't a known property of 'select'
✘ [ERROR] NG8004: No pipe found with name 'async'.
```

- `ng build` xanh; chỉ `ng test` hỏng
- Thêm `import './app-module'` vào **một** spec: 7/7 xanh. Builder test chỉ biên dịch những gì spec import tới; component mất phạm vi `NgModule`
- Cách bền: chuyển standalone **trước** (checkpoint 2), mỗi component tự khai báo `imports`

---

## Zoneless: đánh giá bằng test

| Bước | Kết quả |
|---|---|
| Bỏ `provideZoneChangeDetection`, `zone.js` | 1 test đỏ: dòng "Đã duyệt" không tự ẩn |
| `lastApproved` → `signal` | 10 xanh |
| Bỏ `Eager` ở 3 component (về `OnPush`) | 10 xanh |
| Bundle ban đầu | 336,41 kB → 297,44 kB |

```ts
readonly lastApproved = signal<number | null>(null);
onApprove(id: number) {
  this.lastApproved.set(id);
  setTimeout(() => this.lastApproved.set(null), TicketListComponent.flashMs);
}
```

<p class="small">Test cũ dùng <code>fakeAsync</code> không chạy trên Vitest (<code>Expected to be running in 'ProxyZone'</code>): dùng timer thật + <code>autoDetectChanges</code>.</p>

---

## Thử phá trên fixture

| Phá | Test đỏ |
|---|---|
| Thông báo không tự ẩn | 2 |
| `lastApproved` về field thường (zoneless) | 1 |
| Bỏ `<app-notifications>` khỏi `App` | **0** → thêm test "thông báo hiện trên màn hình" → 1 |
| Bỏ lọc theo trạng thái | 1 |
| 22 + zone.js, bỏ `Eager` | 1 |
| `ng update --force` | Test chạy được; `npm ci`: `ERESOLVE` |

<div class="tip">Thay một thư viện UI: phải có test <b>ở chỗ dùng</b>, không chỉ test service.</div>

---

## Dự án thật lớn hơn: thay thế dần (strangler)

- Không nâng/viết lại một lần. Route mới viết bằng code mới (standalone, signal), route cũ giữ nguyên tới khi thay
- Mỗi route một checkpoint: test, smoke, rollback riêng
- Ranh giới rõ: lib mới không import lib cũ (luật import buổi 1)
- Đo trước/sau từng route: bundle, lỗi, thời gian tải (buổi 5)

<div class="cols">
<div>

**Nên**
- Gỡ thư viện chặn trước
- Hiện đại hóa trên major đang chạy
- Một major mỗi lần

</div>
<div>

**Không nên**
- `--force` rồi "sửa sau"
- Sửa `package.json` bằng tay
- Gộp nâng cấp với tính năng mới

</div>
</div>

---

## Capstone: điều kiện bắt buộc

| Điều kiện | Lệnh | Kết quả mẫu |
|---|---|---|
| Build | `npx nx run-many -t lint test build` | 16 project xanh |
| API từ chối | không token `GET /api/tickets` | 401 |
| | `agent1` `PATCH` đóng phiếu | 403 |
| | `agent1` `GET /api/admin/stats` | 403 (`admin1`: 200) |
| Không secretKey trong client | `grep -rlE 'care-dev-secret\|secretKey\|client_secret' dist/apps` | 0 file |

<p class="small">Một kết quả <code>grep</code> trong <code>apps/portal-e2e</code> (khóa DEV để test ký token hết hạn): test chạy trong Node, không vào bundle. Kiểm <code>dist</code>, không chỉ kiểm mã nguồn.</p>

---

## Capstone: chấm bằng bằng chứng

| Rubric (điểm) | Bằng chứng trong repo |
|---|---|
| Kiến trúc (20) | ADR 0001–0004, luật lib trong `eslint.config.mjs` |
| State (15) | ADR 0003, `docs/ma-tran-state.md` |
| Hiệu năng (15) | `docs/benchmark-buoi-05.md` |
| Bảo mật (20) | `docs/ma-tran-bao-mat.md`, `docs/vong-doi-phien.md`, `docs/checklist-sso.md` |
| Kiểm thử (15) | `docs/bao-cao-kiem-thu.md`, bảng thử phá |
| Build, phát hành (10) | `ci.yml`, release checklist, quy trình rollback |
| AI (5) | `docs/ai-review-...md`, báo cáo năng suất |

Mức đạt 70/100. Demo: 1 luồng thành công, 3 ca thất bại; tính năng đề xuất **tách riêng** khỏi phần đã triển khai.

---

## Kế hoạch áp dụng vào feature thật

| | Ví dụ |
|---|---|
| Feature | Màn hình tra cứu thuê bao của hệ thống đang làm |
| Vấn đề có số đo | Tải 2,1 giây; 3 lỗi 409 bị nuốt tháng trước |
| Kỹ thuật (buổi) | URL là nguồn sự thật (4), hủy request cũ (3), xử lý 409 (2) |
| Checkpoint, rollback | Mỗi bước một commit, test nào xanh |
| Đo thành công | Số đo trước/sau, test mới |
| Ngày xem lại | |

<div class="tip">Không có số đo hiện tại thì không biết đã cải thiện hay chưa.</div>

---

## Live demo (30 phút)

1. **Nâng thẳng** fixture (bản sao): `ng update` dừng vì `ngx-toastr`; `--force`; `npm ci` từ đầu: `ERESOLVE`
2. Trên bản `--force`: `ng build` xanh, `ng test` NG8001/NG8004; thêm `import './app-module'`: xanh lại
3. Bỏ `Eager`: test "tự ẩn" đỏ; đọc `NOTE: OnPush is enabled by default.`
4. **Theo checkpoint**: chạy `convert-to-standalone`, xem 3 test đỏ, sửa spec
5. `ng update` (27 giây, không `--force`), bỏ zone: test đỏ → `signal` → xanh

---

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Inventory, migration plan có checkpoint và rollback | 20 |
| 2 | Trên 21: thay `ngx-toastr` (test trước), standalone, control flow, `inject()`, signal input/output | 35 |
| 3 | `ng update` lên 22, `npm ci` sạch; thử phá `Eager` | 20 |
| 4 | Zoneless bằng test, ADR | 20 |
| 5 | Capstone: điều kiện bắt buộc, demo, review chéo (`lab/phieu-cham.md`), kế hoạch áp dụng | 25 |

Sản phẩm nộp: `docs/nang-cap-angular-22.md` · commit theo checkpoint · ADR · `docs/capstone-bang-chung.md` · phiếu chấm chéo

---

## Chốt khóa học

- Nâng cấp: **gỡ chặn → hiện đại hóa → nâng major → zoneless**, mỗi bước test xanh và có rollback
- `--force`, sửa `package.json` bằng tay: lỗi dời sang CI hoặc sang người dùng
- Test hành vi ("như người dùng") bắt được thay đổi mà build và lint không thấy
- Capstone và công việc thật: **bằng chứng** (số đo, test, ADR, log) thay cho lời kể

**Câu hỏi review chéo:** "Feature bạn chọn áp dụng: checkpoint đầu tiên là gì, test nào phải xanh?"

**Bài tập sau khóa:** `course/bai-tap-ve-nha/buoi-10-nang-cap-va-capstone.html` (khoảng 30 phút, trong 1 tuần)
