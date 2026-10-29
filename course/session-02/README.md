# Buổi 02 — Component dùng lại và màn hình nghiệp vụ phức tạp

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Điểm bắt đầu:** `git checkout session02-start` · **Đáp án:** 3 patch trong `solution/`

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

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Trích `ticket-row` sang lib `portal-ui-tickets` (`type:ui`), test hợp đồng | 30 |
| 2 | Trang tạo phiếu: typed form, validator `notBlank`, test tiêu đề chỉ khoảng trắng | 35 |
| 3 | Trạng thái gửi, giữ form khi lỗi, lỗi server theo trường, focus và `aria-live` | 25 |
| 4 | Manager duyệt phiếu, xử lý 409, tái hiện bằng hai trình duyệt; agent gọi API nhận 403 | 20 |
| 5 | Chống nhấp lặp và `Idempotency-Key`: giữ key khi gửi lại | 10 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Màn hình danh sách phiếu (container) | `frontend/libs/portal/feature-tickets/src/lib/ticket-list/` |
| Port, lỗi nghiệp vụ, fake adapter | `frontend/libs/portal/domain-tickets/` |
| Adapter HTTP chuyển 409/400 | `frontend/libs/portal/data-access-tickets/src/lib/http-ticket.adapter.ts` |
| Endpoint duyệt, idempotency | `backend/.../ticket/TicketController.java`, `common/IdempotencyStore.java` |
| API phiếu | `frontend/libs/shared/data-access-api/src/lib/ticket-api.ts` |
| Kiểm tra version, ném 409 | `backend/.../ticket/TicketService.java` (`ConflictException("error.staleData")`) |
| Định dạng lỗi chuẩn RFC 9457 | `backend/.../common/GlobalExceptionHandler.java` |

## Đã chuẩn bị ở `session02-start`

- Backend: `POST /api/tickets/{id}/approve` (chỉ `SUPERVISOR`, `RESOLVED` → `CLOSED`, version cũ hoặc sai trạng thái → 409);
  header `Idempotency-Key` cho `POST /api/tickets` (lưu trong bộ nhớ, trả `Idempotent-Replayed`); `@NotBlank` title đã chặn khoảng trắng.
  Test: `backend/src/test/java/com/careportal/api/TicketApiTests.java`.
- Frontend: `TicketPort.create/approve`, `TicketConflictError`, `TicketValidationError`, adapter HTTP chuyển 409/400 sang lỗi nghiệp vụ,
  fake adapter mô phỏng version và idempotency, key i18n vi/en.

## Tài liệu

| | |
|---|---|
| Slide | [slides/slides.md](slides/slides.md) (nguồn Marp) · `buoi-02-component-va-form.pptx` · `buoi-02-component-va-form.pdf` |
| Lab | [lab/README.md](lab/README.md) |
| Đáp án | [solution/README.md](solution/README.md) + 3 file `.patch` |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) · [note-cho-giang-vien.md](note-cho-giang-vien.md) |
| Bài tập về nhà | [../bai-tap-ve-nha/buoi-02-hop-dong-component-va-form.html](../bai-tap-ve-nha/buoi-02-hop-dong-component-va-form.html) |

## Sửa slide

```bash
cd course/session-02/slides
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-02-component-va-form.pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-02-component-va-form.pdf
```
