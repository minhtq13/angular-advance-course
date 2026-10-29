# Buổi 2 — Ghi chú đọc tài liệu (dành cho giảng viên)

**Buổi 2:** Component dùng lại và màn hình nghiệp vụ phức tạp · 4 giờ

Toàn bộ tài liệu nằm trong `course/session-02/`.

## 1. Thứ tự nên đọc

| # | File | Nội dung | Thời gian |
|---|---|---|---|
| 1 | `README.md` | Nội dung theo đề cương, mục tiêu, những gì đã chuẩn bị sẵn ở `session02-start` | 3 phút |
| 2 | `slides/buoi-02-component-va-form.pdf` (hoặc `.pptx`) | 26 slide: container/component hiển thị, hợp đồng input/output, typed forms, lỗi API, a11y, 409, idempotency | 20 phút |
| 3 | `lab/README.md` | Đề lab 5 bài, 120 phút, kèm review chéo. Nên tự làm thử | 120 phút |
| 4 | `solution/README.md` | Đáp án, bằng chứng 409, câu trả lời thảo luận, điểm chấm | 15 phút |
| 5 | `instructor-notes.md` | Timeline, kịch bản 2 demo, câu hỏi hay gặp, lỗi thường gặp | 15 phút |

**Bài tập về nhà:** `course/bai-tap-ve-nha/buoi-02-hop-dong-component-va-form.html` (khoảng 30 phút, nộp trước buổi 3).

## 2. Nội dung 5 bài lab

| Bài | Nội dung | Thời gian |
|---|---|---|
| 1 | Trích dòng bảng phiếu thành `TicketRow` trong lib `type:ui`; quyết định mở luật `ui → domain` | 30 phút |
| 2 | Form tạo phiếu typed, validator `notBlank` | 35 phút |
| 3 | Trạng thái gửi, giữ form khi lỗi, lỗi server theo trường, focus, `aria-live` | 25 phút |
| 4 | Manager duyệt phiếu, xử lý 409, tái hiện bằng hai trình duyệt | 20 phút |
| 5 | `Idempotency-Key`: lỗi sinh key mỗi lần bấm, sửa và chứng minh | 10 phút |

## 3. Cách chạy

```bash
git checkout session02-start
docker compose -f infra/docker-compose.yml up -d --build api   # bắt buộc build lại: có endpoint mới
cd frontend && nvm use && npm ci && npm start
```

Tài khoản: `agent1` (Agent), `supervisor1` (Manager). Xem bản đã làm xong: áp 3 patch theo thứ tự trong `solution/README.md`.

## 4. Cần lưu ý

- **Dữ liệu thay đổi khi demo:** mỗi lần duyệt sẽ đóng một phiếu. Muốn về dữ liệu gốc: `docker compose -f infra/docker-compose.yml down -v` rồi `up -d`.
- **Idempotency lưu trong bộ nhớ** của container `api`: khởi động lại container là mất. Đây là chủ ý để code dễ đọc; slide 21 nói rõ production phải lưu DB/Redis.
- **Bài tập về nhà phần 4** dùng nợ kỹ thuật cố ý để lại trong Bài 1 (nhãn trạng thái phiếu bị lặp ở `ui-tickets` và `shared-data-access-api`).
- Đáp án có spec E2E `ticket-flow.spec.ts`; buổi 7 sẽ dạy E2E kỹ hơn. Giảng viên có thể chạy để kiểm tra nhanh môi trường demo.
