# Buổi 3 — Ghi chú đọc tài liệu (dành cho giảng viên)

**Buổi 3:** Signals và RxJS cho luồng dữ liệu · 4 giờ

Toàn bộ tài liệu nằm trong `course/session-03/`.

## 1. Thứ tự nên đọc

| # | File | Nội dung | Thời gian |
|---|---|---|---|
| 1 | `README.md` | Nội dung theo đề cương, 4 vấn đề cố ý ở điểm bắt đầu, những gì đã chuẩn bị | 3 phút |
| 2 | `slides/buoi-03-signals-va-rxjs.pdf` (hoặc `.pptx`) | 26 slide: signals, effect, interop, marble, 4 operator làm phẳng, lỗi, teardown, cache | 20 phút |
| 3 | `lab/README.md` | Đề lab 5 bài, 120 phút. Nên tự làm thử, nhất là phần tính chuỗi marble | 120 phút |
| 4 | `solution/README.md` | Đáp án, cách tính marble, điểm chấm | 15 phút |
| 5 | `instructor-notes.md` | Timeline, 3 kịch bản demo, câu hỏi hay gặp, lỗi thường gặp | 15 phút |

**Bài tập về nhà:** `course/bai-tap-ve-nha/buoi-03-signals-va-rxjs.html` (khoảng 30 phút, nộp trước buổi 4).

## 2. Cách chạy

```bash
git checkout session03-start
DEMO_SLOW_SHORT_QUERY=true docker compose -f infra/docker-compose.yml up -d --build api
cd frontend && nvm use && npm ci && npm start
```

Đăng nhập `agent1`, mở **Phiếu yêu cầu → Tạo phiếu**, gõ vào ô **Thuê bao**. Bản đã làm xong: `git checkout session03-end`.

## 3. Cần lưu ý

- **Chế độ demo làm chậm mọi tìm kiếm thuê bao ngắn**, kể cả trang Thuê bao. Tắt sau buổi học:
  `docker compose -f infra/docker-compose.yml up -d api`.
- **Marble test là phần học viên thấy khó nhất.** Slide 17 tính từng mốc thời gian; nên làm cùng lớp ở Demo 2 trước khi để học viên tự làm Bài 2.
- Spec E2E `ticket-flow` vẫn chạy được ở buổi này (đã cập nhật cho ô chọn thuê bao).
