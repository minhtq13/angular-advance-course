# Buổi 02 — Ghi chú giảng viên

## Trước buổi học

**Vài ngày trước:**
- Thu bài tập về nhà buổi 1 và ADR-0002 của các nhóm. Chọn 2 câu trả lời khác nhau cho phần 4 (`ThemeService` trong lib ui) để mở đầu.
- Nhắc học viên: buổi này backend có endpoint mới, phải build lại container `api` (lệnh ở dưới). Lần build đầu mất vài phút.

**Ngày học:**
- [ ] `git checkout session02-start`
- [ ] `docker compose -f infra/docker-compose.yml up -d --build api`, đợi `api` báo `healthy`
- [ ] `cd frontend && npm ci && npm start`
- [ ] Kiểm tra nhanh: đăng nhập `supervisor1`, lọc **Đã xử lý**, có dữ liệu
- [ ] Hai cửa sổ ẩn danh (hoặc Chrome + Firefox) cho demo 409, DevTools mở sẵn tab Network
- [ ] Nhánh dự phòng đã áp 3 patch đáp án để chuyển sang nếu demo hỏng
- [ ] Dữ liệu demo bị thay đổi sau mỗi lần duyệt. Muốn về dữ liệu gốc: `docker compose -f infra/docker-compose.yml down -v && docker compose -f infra/docker-compose.yml up -d`

## Timeline (4 giờ)

| Thời gian | Nội dung | Slide | Ghi chú |
|---|---|---|---|
| 0:00–0:20 | Review buổi 1, phân tích use case | 1–5 | 2 nhóm đọc ADR-0002 trong 2 phút mỗi nhóm; thảo luận `ThemeService`. Chiếu slide 5, hỏi lớp đã gặp tình huống nào trong dự án thật |
| 0:20–1:00 | Khái niệm | 6–21 | Hợp đồng component (6–10), typed forms và validator (11–12), trạng thái gửi, lỗi API, a11y (13–16), 409 (17–18), idempotency (19–21) |
| 1:00–1:30 | Live demo | 22 | **Demo 1** (409) và **Demo 2** (double-click và Replay) |
| 1:30–1:40 | **Nghỉ** | | |
| 1:40–3:40 | **Lab** 5 bài | 23–25 | Mốc nhắc: 2:10 sang Bài 2, 2:45 sang Bài 3, 3:10 sang Bài 4, 3:30 sang Bài 5 |
| 3:40–4:00 | Review chéo | 26 | Mỗi nhóm 5 phút theo 3 câu trong lab; giao bài tập về nhà |

## Kịch bản demo

Chạy demo trên nhánh đã áp đủ 3 patch.

### Demo 1 — Hai Manager duyệt cùng một phiếu (khoảng 12 phút)

1. Cửa sổ A và B cùng đăng nhập `supervisor1`, cùng lọc **Đã xử lý**. Chỉ cho lớp thấy dòng đầu giống nhau.
2. **Hỏi lớp:** "Cả hai bấm Duyệt. Chuyện gì xảy ra nếu backend không kiểm tra version?" Cho lớp trả lời trước.
3. A bấm Duyệt → "Đã duyệt phiếu …". B bấm Duyệt cùng dòng → alert lỗi.
4. Tab Network của B: body request `{"version":0}`, response 409 kèm `detail` tiếng Việt. Đổi sang **EN**, làm lại với dòng khác:
   `detail` thành tiếng Anh (backend dịch theo `Accept-Language`).
5. Mở `TicketService.approve`: hai dòng `ConflictException`. Nhấn mạnh: client gửi version nó **đang nhìn thấy**.

### Demo 2 — Chống nhấp lặp và idempotency (khoảng 15 phút)

1. Network → **Slow 3G**. Mở trang Tạo phiếu, bấm "Tạo phiếu" 3 lần thật nhanh: chỉ 1 request (nút bị vô hiệu, `submitting()`).
2. Chuột phải request POST → **Replay XHR**: response header `Idempotent-Replayed: true`, cùng mã phiếu. Danh sách không có phiếu trùng.
3. **Hỏi lớp:** "Nếu tôi sinh key mới mỗi lần bấm thì sao?" Sửa `this.idempotencyKey` thành `crypto.randomUUID()` ngay trong lời gọi
   `create(...)`, tạo phiếu, Replay → mã phiếu **mới**. Đây là tình huống "timeout rồi bấm gửi lại".
4. Trả code về như cũ.
5. (Tùy thời gian) `curl` cùng key nhưng đổi tiêu đề → 409 `idempotencyKeyReused`.

## Điểm cần nhấn mạnh

- **Component hiển thị không biết ai đang đăng nhập.** `canApprove` do container tính. Nếu học viên inject `AuthService` vào `TicketRow`, hỏi: "Component này còn dùng được ở app admin không?"
- **Sửa luật là quyết định kiến trúc**, không phải cách "cho lint im lặng". Bắt học viên viết chú thích lý do cạnh luật.
- **Validation client để trải nghiệm, validation server để đúng.** Backend đã có `@NotBlank`; demo bằng `curl` gửi `"title":"   "` → 400.
- **Không reset form khi lỗi.** Mất dữ liệu người dùng đã nhập là lỗi nghiêm trọng nhất của form nghiệp vụ.
- **409 là ca nghiệp vụ, không phải lỗi hệ thống.** Thiết kế UI cho nó như một luồng bình thường.
- **Chống nhấp lặp ≠ idempotency.** Câu nói nên lặp lại: "Timeout không có nghĩa là thất bại."
- **Ẩn nút không phải phân quyền.** Bài 4 bước 4 (curl bằng token agent) là cầu nối sang buổi 6.

## Câu hỏi học viên hay hỏi

| Câu hỏi | Gợi ý trả lời |
|---|---|
| Sao không dùng `@Input()`/`@Output()` như dự án cũ? | Vẫn chạy được. `input()` là signal, dùng thẳng trong `computed`, có `input.required` kiểm tra lúc biên dịch, `transform` chuẩn hóa đầu vào. Buổi 10 có migration tự động. |
| Template-driven form có được không? | Được với form đơn giản. Form nghiệp vụ cần validator tùy biến, lỗi server, test không cần DOM: Reactive Forms dễ kiểm soát hơn. Angular 21+ có Signal Forms (thử nghiệm), chưa dùng cho dự án production. |
| `nzErrorTip` có sẵn, sao không dùng? | Màu chữ mặc định `#ff4d4f` chỉ ~3,3:1 (không đạt WCAG AA) và không có `id` để nối `aria-describedby`. |
| Sao không dùng `exhaustMap` cho nút gửi? | Dùng được khi luồng gửi là Observable (buổi 3). Ở đây `submitting()` + disable đủ cho click; cả hai đều chỉ là chống nhấp lặp phía client. |
| Idempotency-Key do client sinh có an toàn không? | Key không phải bí mật, chỉ chống trùng. Server gắn key với người dùng (scope theo username) để người khác không "đụng" key. Key phải đủ ngẫu nhiên (UUID v4). |
| Sao không tự động tải lại khi gặp 409? | Có thể, nhưng người dùng cần biết dữ liệu đã đổi. Tự tải lại mà không báo thì người dùng tưởng thao tác của mình đã thành công. |
| ETag / `If-Match` thì sao? | Cùng ý tưởng optimistic locking theo chuẩn HTTP (412 Precondition Failed). Repo dùng `version` trong body cho dễ đọc. |

## Lỗi thường gặp khi làm lab

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Trang Phiếu báo 404 ở `POST /approve` | Container `api` chưa build lại | `docker compose -f infra/docker-compose.yml up -d --build api` |
| Bảng mất định dạng, thừa ô | Dùng selector element `care-ticket-row` trong `tbody` | Đổi sang `tr[care-ticket-row]` |
| Lint báo `selector should start with one of these prefixes: "care"` | Luật chỉ cho selector dạng element | `type: ['element', 'attribute']` trong `eslint.config.mjs` của lib ui |
| Lint `type:ui` không được phụ thuộc `type:domain` | Chưa mở luật | Thêm `type:domain` vào luật của `type:ui` ở `eslint.config.mjs` gốc |
| Test `TicketRow` lỗi `NG0201 No provider for ActivatedRoute` | Row dùng `routerLink` | `provideRouter([])` trong test |
| Test đếm 10 ô thay vì 9 | Đếm cả hàng đo của nz-table | Đếm `td` trong host component riêng (không có nz-table) hoặc lọc ô rỗng |
| `/tickets/new` mở ra trang danh sách | Route `new` đặt sau route rỗng | Đặt `new` trước |
| `subscriberId` luôn `undefined` | Quên `transform`, giá trị query param là chuỗi | `input<number \| undefined, unknown>(undefined, { transform: toId })` |
| Lỗi `server` không mất khi sửa | Lưu lỗi ở signal riêng | Dùng `control.setErrors(...)`; validator chạy lại khi giá trị đổi |
| Focus không chuyển tới ô lỗi | Gọi `focus()` trước khi Angular vẽ `aria-invalid` | Bọc trong `afterNextRender(..., { injector })` |
| Test lỗi `NG04002 Cannot match any routes` | Test chạy `router.navigate` thật | `vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true)` |
| Test cũ của danh sách lỗi `hasAnyRole is not a function` | AuthService giả thiếu method mới | Thêm `hasAnyRole: () => false` |
| Theme tối: chữ lỗi khó đọc | Viết màu cứng | Dùng `var(--care-danger)` (đã có giá trị cho cả hai theme) |

## Sau buổi học

- Giao bài tập về nhà: [../bai-tap-ve-nha/buoi-02-hop-dong-component-va-form.html](../bai-tap-ve-nha/buoi-02-hop-dong-component-va-form.html) (khoảng 30 phút, nộp trước buổi 3).
- Thu ảnh tab Network 409 và câu trả lời thảo luận Bài 5 của các nhóm.
- Buổi 3 bắt đầu từ `session03-start` = đáp án buổi 2.
