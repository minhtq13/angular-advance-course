# Buổi 10 — Ghi chú giảng viên

## Trước buổi học

**Vài ngày trước:**
- **Hỏi VNPT** phiên bản Angular các dự án đang dùng và registry npm (proxy, Nexus): fixture cần tải Angular 21 và 22 (`node_modules` khoảng 320 MB).
  Không có mạng ra npm thì chuẩn bị cache npm hoặc mirror nội bộ, chạy thử `npm ci` và `ng update` trên một máy của đơn vị.
- Nhắc học viên chuẩn bị capstone: chạy lại các test, E2E, smoke của các buổi trước trên máy mình; chọn **một feature thật** cho kế hoạch áp dụng.
- In hoặc gửi `lab/phieu-cham.md`; thu sản phẩm buổi 9 (pipeline YAML, release checklist, quy trình rollback).

**Ngày học:**
- [ ] `git checkout session10-start`
- [ ] `cd fixtures/legacy-a21 && nvm use && npm ci && npx ng test --watch=false` → 7 test xanh
- [ ] Bản sao cho demo "nâng thẳng" (git riêng để `ng update` không than thư mục bẩn):
      `cp -R fixtures/legacy-a21 /tmp/demo-a21 && cd /tmp/demo-a21 && git init -q && git add -A && git commit -qm a21`
- [ ] `docker compose -f infra/docker-compose.yml up -d` (capstone: kiểm tra 401/403)
- [ ] Mở sẵn `node_modules/@angular/core/types/_debug_node-chunk.d.ts` của bản 22 (tìm `OnPush is enabled by default`) cho demo bước 3

## Timeline (4 giờ)

| Thời gian | Nội dung | Slide | Ghi chú |
|---|---|---|---|
| 0:00–0:20 | Review buổi 9, use case | 1–5 | Slide 5: hỏi lớp "dự án của anh chị đang ở Angular mấy, thư viện nào chưa có bản mới?" |
| 0:20–1:00 | Khái niệm | 6–19 | Inventory, `--force`, thứ tự (6–8) · migration standalone và phần bỏ sót (9–10) · Angular 22, OnPush, NgModule, zoneless, thử phá (11–15) · strangler, capstone, kế hoạch áp dụng (16–19) |
| 1:00–1:30 | Live demo | 20 | 5 bước |
| 1:30–1:40 | **Nghỉ** | | |
| 1:40–3:40 | **Lab** 5 bài | 21 | Mốc nhắc: 2:00 sang Bài 2, 2:35 sang Bài 3, 2:55 sang Bài 4, 3:15 sang Bài 5 (capstone) |
| 3:40–4:00 | Demo nhóm, review chéo, chốt khóa | 22 | Mỗi nhóm 8 phút nếu lớp nhỏ; lớp lớn: chọn 2 nhóm demo, còn lại chấm chéo theo cặp |

Bài 5 dồn nhiều việc: nếu lớp chậm ở Bài 2, cho Bài 4 làm ở nhà (ADR) và giữ đủ 25 phút cho capstone.

## Kịch bản demo

Trên bản sao `/tmp/demo-a21`:

1. **Nâng thẳng (6 phút).** `npx ng update` (liệt kê), rồi `npx ng update @angular/core@22 @angular/cli@22`: đọc dòng `ngx-toastr ... requires "^21.0.0"`.
   `npm view ngx-toastr time.modified`. Chạy lại với `--force` (khoảng 28 giây), đọc danh sách migration. `rm -rf node_modules && npm ci`: `ERESOLVE`.
2. **Test không biên dịch (5 phút).** `npm ci --legacy-peer-deps` (chỉ để demo), `npx ng build` (xanh), `npx ng test --watch=false`: NG8001, NG8004.
   Thêm `import './app-module';` đầu `src/app/app.spec.ts`: 7/7. Giải thích: builder test chỉ biên dịch những gì spec import tới.
3. **OnPush mặc định (5 phút).** Xóa các dòng `changeDetection: ChangeDetectionStrategy.Eager`, chạy test: "tự ẩn dòng Đã duyệt" đỏ. Mở file kiểu ở trên.
4. **Theo checkpoint (7 phút).** Trên `fixtures/legacy-a21` (nhánh demo): `npx ng g @angular/core:standalone --mode=convert-to-standalone --path=./`, test: 3 đỏ
   `Unexpected "_TicketListComponent" found in the "declarations" array`. Sửa một spec trước lớp (`imports: [TicketListComponent]`). Phần còn lại cho lab.
5. **Zoneless (7 phút).** `git checkout session10-end -- fixtures/legacy-a21 && cd fixtures/legacy-a21 && npm ci`. Đổi `lastApproved` về field thường, test đỏ;
   trả lại `signal`, xanh. `npx ng serve --port 4400`: duyệt phiếu, thông báo và dòng "Đã duyệt" tự ẩn sau 3 giây.

## Điểm cần nhấn mạnh

- Nâng từng major, mỗi bước có test xanh và có đường lui; rollback kèm `npm ci`.
- Migration tự động làm phần lớn việc; phần còn lại (spec, input dùng trong `@if`, `importProvidersFrom`) là việc của người và của test.
- `--force` và sửa `package.json` bằng tay chỉ dời lỗi sang CI hoặc sang người dùng.
- Capstone chấm bằng bằng chứng: số đo, test, ADR, log pipeline, không chấm bằng lời kể.
- Mỗi học viên rời khóa với một feature cụ thể và checkpoint đầu tiên.

## Câu hỏi học viên hay hỏi

| Câu hỏi | Gợi ý trả lời |
|---|---|
| Dự án đang ở Angular 15/16, nâng thẳng lên 22 được không? | Không: `ng update` một major mỗi lần (15 → 16 → ... → 22), mỗi major một checkpoint, đọc migration từng bản. Gỡ thư viện chặn của **từng** bước |
| Dùng `overrides` trong `package.json` cho `ngx-toastr` thay vì thay thư viện? | Được nếu đã đọc mã thư viện và chạy test, ghi ADR và ngày xem lại. Khác `--force`: `npm ci` vẫn tái lập được. Rủi ro: thư viện dùng API đã đổi |
| Có cần chuyển hết sang signal trước khi lên 22? | Không bắt buộc: migration thêm `Eager` để giữ hành vi. Chuyển dần từng component, bỏ `Eager` khi test chứng minh `OnPush` đúng |
| Zoneless có bắt buộc không? | Không. Đánh giá bằng test hành vi; thư viện bên thứ ba dựa vào zone (cập nhật trong `setTimeout`, sự kiện ngoài Angular) là rủi ro chính |
| Sao test dùng timer thật, không `fakeAsync`? | Vitest (mặc định từ Angular 21) không có ProxyZone: `Expected to be running in 'ProxyZone'`. Dùng timer thật với thời gian nhỏ, hoặc `vi.useFakeTimers` cho code không dựa vào zone |
| Migration làm hỏng test thì có nên bỏ migration? | Không: đó là tín hiệu checkpoint hoạt động. Sửa test theo kiểu mới (standalone `imports`), commit, đi tiếp |

## Lỗi thường gặp khi làm lab

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `ng update` báo thư mục có thay đổi chưa commit | Chưa commit checkpoint trước | Commit, hoặc `--allow-dirty` khi chắc chắn |
| `npx ng ...` chạy CLI 22 trên fixture 21 | Chạy ở `frontend/` thay vì `fixtures/legacy-a21/` | `cd fixtures/legacy-a21` |
| Test `declarations` đỏ sau `convert-to-standalone` | Migration không sửa spec | `imports: [Component]` |
| `NullInjectorError: No provider for HttpClient` trong test | Bỏ `HttpClientTestingModule` mà chưa thêm provider | `provideHttpClient(), provideHttpClientTesting()` |
| Test "tự ẩn" xanh dù đã bỏ zone | Test còn `provideZoneChangeDetection()` hoặc gọi `detectChanges()` | Bỏ provider; dùng `autoDetectChanges()` |
| Fixture lên 22 nhưng `npm ci` trên máy bạn khác lỗi | Đã dùng `--force`/`--legacy-peer-deps` | Quay về checkpoint 2, gỡ thư viện chặn trước |
| `curl` 403 ở cả `supervisor1` khi PATCH đóng phiếu | Đúng thiết kế (buổi 7): đóng phiếu qua luồng duyệt, PATCH `CLOSED` bị chặn với mọi vai trò | Dùng `agent1` cho bằng chứng 403; `admin1` cho 200 ở `/api/admin/stats` |
