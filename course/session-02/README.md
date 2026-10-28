# Buổi 02 — Component dùng lại và màn hình nghiệp vụ phức tạp

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Trạng thái tài liệu:** đã có khung theo đề cương; chưa soạn slide, lab chi tiết, đáp án.

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Hợp đồng input và output; phân tách container với component hiển thị; typed Reactive Forms, validation, trạng thái gửi, lỗi API và accessibility. Phân biệt chống nhấp lặp với idempotency phía server. |
| Use case và lab | Trích `ticket-row` dùng lại, xử lý tiêu đề chỉ có khoảng trắng, giữ nội dung form khi lỗi và tái hiện hai người duyệt cùng một version. |
| Sản phẩm đầu ra | Component có hợp đồng rõ, form có kiểm thử và xử lý HTTP 409. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Thiết kế hợp đồng component bằng `input()`, `input.required()`, `output()`, `model()`; tách container (feature) với component hiển thị (lib `type:ui`).
2. Xây form tạo phiếu bằng typed Reactive Forms (`FormGroup<{...}>`, `nonNullable`), validator đồng bộ và bất đồng bộ.
3. Quản lý trạng thái gửi (idle, submitting, lỗi, thành công), giữ dữ liệu form khi API lỗi, ánh xạ `ProblemDetail.errors` vào từng field.
4. Đảm bảo accessibility: nhãn, `aria-invalid`, `aria-describedby`, đưa focus tới lỗi đầu tiên, thông báo bằng `role="alert"`.
5. Phân biệt chống nhấp lặp phía client (disable, `exhaustMap`) với idempotency phía server (`Idempotency-Key`), và xử lý xung đột cập nhật HTTP 409.

## Use case trên Care Portal

- **Danh sách phiếu** (`TicketListPage`) đang render từng dòng trực tiếp trong template của feature. Trích thành `ticket-row`
  trong lib mới `libs/portal/ui-tickets` (`scope:portal,type:ui`): nhận `ticket = input.required<TicketSummary>()`, phát
  `select`, `approve`; không inject service nào.
- **Form tạo phiếu**: subscriber, category, priority, title, description. Tiêu đề `"   "` phải bị chặn ở client (validator
  `notBlank`) **và** ở server (Bean Validation `@NotBlank` đã trim). API lỗi thì form giữ nguyên dữ liệu.
- **Phê duyệt** (Manager = `supervisor1`): hai Manager mở cùng một phiếu `version = 3`; người thứ hai gửi sau nhận **409**
  `error.staleData`. Màn hình hiển thị dữ liệu mới nhất, cho người dùng chọn tải lại hoặc giữ lựa chọn của mình.

## Dự kiến lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Trích `ticket-row` sang lib `ui-tickets`, viết test hợp đồng input/output | 30 |
| 2 | Form tạo phiếu typed, validator `notBlank`, test tiêu đề chỉ khoảng trắng | 35 |
| 3 | Trạng thái gửi, giữ form khi lỗi 400/500, map lỗi field, focus lỗi đầu tiên | 25 |
| 4 | Tái hiện hai người duyệt cùng version (2 trình duyệt), xử lý 409 | 20 |
| 5 | Chống nhấp lặp: `exhaustMap` so với `Idempotency-Key`, chứng minh bằng tab Network | 10 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Màn hình danh sách phiếu (container) | `frontend/libs/portal/feature-tickets/src/lib/ticket-list/` |
| Port từ buổi 1 (mở rộng `create`, `approve`) | `libs/portal/domain-tickets` (sau `bai3-5-ticket-port.patch`) |
| API phiếu | `frontend/libs/shared/data-access-api/src/lib/ticket-api.ts` |
| Kiểm tra version, ném 409 | `backend/.../ticket/TicketService.java` (`ConflictException("error.staleData")`) |
| Định dạng lỗi chuẩn RFC 9457 | `backend/.../common/GlobalExceptionHandler.java` |

## Cần chuẩn bị trước khi soạn chi tiết

- [ ] Backend: endpoint phê duyệt (ví dụ `POST /api/tickets/{id}/approve` có `version`), chỉ `SUPERVISOR` được gọi; cân nhắc thêm trạng thái `PENDING_APPROVAL`/`APPROVED` hoặc ánh xạ "duyệt" vào chuyển `RESOLVED → CLOSED`.
- [ ] Backend: hỗ trợ header `Idempotency-Key` cho `POST /api/tickets` (lưu key + kết quả trong một bảng, trả lại kết quả cũ khi gửi trùng).
- [ ] Backend: kiểm tra `@NotBlank` trên `title` có trim (`"   "` phải trả 400 có `errors.title`).
- [ ] Frontend: mở rộng `TicketPort` + `HttpTicketAdapter` + `InMemoryTicketAdapter` với `create`, `approve` (nối tiếp câu hỏi thảo luận Bài 5 buổi 1).

## Tài liệu

| | |
|---|---|
| Slide | `slides/` (chưa soạn) |
| Lab | `lab/` (chưa soạn) |
| Đáp án | `solution/` (chưa soạn) |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) |
| Bài tập về nhà | `../bai-tap-ve-nha/buoi-02-<chu-de>.html` (chưa soạn) |
