# Buổi 10 — Nâng cấp, hiện đại hóa và bảo vệ dự án cuối khóa

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Điểm bắt đầu:** `git checkout session10-start` · **Đáp án:** 5 patch trong `solution/`, bản đầy đủ ở nhánh `session10-end`

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Inventory dependency và compatibility; nâng từng major, CLI migration, standalone và control flow; đánh giá zoneless, regression và chiến lược thay thế dần dự án cũ. |
| Use case và lab | Nâng fixture Angular 21 lên 22 theo checkpoint; hoàn thiện dự án tích lũy, demo các ca thành công và thất bại, review chéo theo rubric. |
| Sản phẩm đầu ra | Migration plan có rollback, capstone có evidence và kế hoạch áp dụng vào một feature thực tế. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Lập inventory dependency: phiên bản, peer dependency với Angular, Node, TypeScript, thư viện bị bỏ rơi; tìm thư viện **chặn** nâng cấp.
2. Lập migration plan theo checkpoint: mỗi bước một commit, test và build xanh, có lệnh rollback.
3. Chạy CLI migration (standalone, control flow, `inject()`, signal input/output), đọc kết quả và sửa phần migration bỏ sót.
4. Nâng major bằng `ng update` (không `--force`), đọc danh sách migration và hiểu thay đổi hành vi (Angular 22: `OnPush` mặc định).
5. Đánh giá zoneless bằng test; bảo vệ capstone bằng bằng chứng, không bằng lời kể.

## Use case: "nâng lên 22 cho kịp"

`fixtures/legacy-a21/` là Care Portal "bản cũ" trên Angular 21: `NgModule`, `*ngIf`, `@Input`, zone.js, `ngx-toastr`, `ngx-pipes`, 7 test.
Đo khi **nâng thẳng** (bản sao, `npx ng update @angular/core@22 @angular/cli@22`):

| Bước | Kết quả đo |
|---|---|
| `ng update` | Dừng: `Package "ngx-toastr" has an incompatible peer dependency to "@angular/common" (requires "^21.0.0", would install "22.2.4")`. `ngx-toastr` 20.0.5 không phát hành từ 2026-02-06 |
| Thêm `--force` | Xong trong 28 giây; migration thêm `ChangeDetectionStrategy.Eager` vào 3 component, tắt 2 extended diagnostics |
| `npm ci` trên máy khác/CI | `ERESOLVE could not resolve ... peer @angular/common@"^21.0.0" from ngx-toastr@20.0.5` |
| `ng build` | Xanh (402,39 kB) |
| `ng test` | **Không biên dịch**: NG8001 `'router-outlet' is not a known element`, NG8002, NG8004 `No pipe found with name 'async'`... cho mọi component trong `NgModule`. Thêm `import './app-module'` vào một spec: 7/7 xanh |
| Sửa `package.json` bằng tay (không có migration `Eager`) | Angular 22: `OnPush` mặc định; dòng "Đã duyệt" không tự ẩn, test đỏ |

Làm theo checkpoint (đáp án): gỡ `ngx-toastr` và chuyển standalone **trên 21**, rồi `ng update` lên 22 trong 27 giây, không `--force`,
`npm ci` sạch, 10/10 test; zoneless làm 1 test đỏ cho tới khi đổi field sang `signal`. Bundle ban đầu: 377,59 kB → 297,44 kB.

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Inventory dependency của fixture, migration plan có checkpoint và rollback | 20 |
| 2 | Checkpoint 1–2 trên Angular 21: thay `ngx-toastr` (test trước), migration standalone, control flow, `inject()`, signal input/output; test sau mỗi lệnh | 35 |
| 3 | Checkpoint 3: `ng update` lên 22, đọc migration, `npm ci` sạch; thử phá (bỏ `Eager`) | 20 |
| 4 | Checkpoint 4: đánh giá zoneless bằng test, sửa, viết ADR | 20 |
| 5 | Capstone: kiểm tra điều kiện bắt buộc, demo ca thành công và thất bại, review chéo theo rubric, kế hoạch áp dụng | 25 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Fixture cần nâng | `fixtures/legacy-a21/` (dự án npm riêng, `npm ci` riêng) |
| Thư viện chặn, thư viện bỏ rơi | `fixtures/legacy-a21/package.json` (`ngx-toastr`, `ngx-pipes`) |
| Code phụ thuộc zone.js | `fixtures/legacy-a21/src/app/tickets/ticket-list.component.ts` (`lastApproved` gán trong `setTimeout`) |
| Rubric, điều kiện bắt buộc | `course/README.md` mục "Đánh giá cuối khóa", `lab/phieu-cham.md` |
| Đáp án | `docs/nang-cap-angular-22.md`, `docs/adr/0004-nang-cap-app-cu-truoc-roi-zoneless.md`, `docs/capstone-bang-chung.md`, fixture đã nâng trên `session10-end` |

## Đã chuẩn bị ở `session10-start`

- Đáp án buổi 9 đã áp (`session09-end`).
- `fixtures/legacy-a21/`: app Angular 21.2 kiểu cũ (tạo bằng `@angular/cli@21 new --standalone=false --zoneless=false`, Vitest), lockfile khóa,
  7 test xanh, `ngx-toastr` 20.0.5, `ngx-pipes` 3.2.2. Dữ liệu `public/tickets.json`, không cần backend.
- Không đổi `frontend/`, `backend/`.

## Tài liệu

| | |
|---|---|
| Slide | [slides/slides.md](slides/slides.md) (nguồn Marp) · `buoi-10-nang-cap-va-capstone.pptx` · `buoi-10-nang-cap-va-capstone.pdf` |
| Lab | [lab/README.md](lab/README.md) · [lab/phieu-cham.md](lab/phieu-cham.md) |
| Đáp án | [solution/README.md](solution/README.md) + 5 file `.patch` |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) · [note-cho-giang-vien.md](note-cho-giang-vien.md) |
| Bài tập về nhà | [../bai-tap-ve-nha/buoi-10-nang-cap-va-capstone.html](../bai-tap-ve-nha/buoi-10-nang-cap-va-capstone.html) |

## Sửa slide

```bash
cd course/session-10/slides
npx @marp-team/marp-cli@4 slides.md --no-stdin --pptx --allow-local-files -o buoi-10-nang-cap-va-capstone.pptx < /dev/null
npx @marp-team/marp-cli@4 slides.md --no-stdin --pdf  --allow-local-files -o buoi-10-nang-cap-va-capstone.pdf < /dev/null
```
