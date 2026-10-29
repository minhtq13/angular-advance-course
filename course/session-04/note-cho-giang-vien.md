# Buổi 4 — Ghi chú đọc tài liệu (dành cho giảng viên)

**Buổi 4:** State Management và lựa chọn NgRx · 4 giờ

Toàn bộ tài liệu nằm trong `course/session-04/`.

## 1. Thứ tự nên đọc

| # | File | Nội dung | Thời gian |
|---|---|---|---|
| 1 | `README.md` | Nội dung theo đề cương, use case, những gì đã chuẩn bị | 3 phút |
| 2 | `slides/buoi-04-state-va-ngrx.pdf` (hoặc `.pptx`) | 21 slide: loại state, ma trận, SignalStore, URL state, làm mới sau ghi, session, Global Store | 20 phút |
| 3 | `lab/README.md` | Đề lab 5 bài, 120 phút | 120 phút |
| 4 | `solution/README.md` | Đáp án, hai chi tiết test Router hay vướng, điểm chấm | 15 phút |
| 5 | `instructor-notes.md` | Timeline, kịch bản demo 4 bước, câu hỏi hay gặp, lỗi thường gặp | 15 phút |

**Bài tập về nhà:** `course/bai-tap-ve-nha/buoi-04-state-va-ngrx.html` (khoảng 30 phút, nộp trước buổi 5).

## 2. Cách chạy

```bash
git checkout session04-start
docker compose -f infra/docker-compose.yml up -d
cd frontend && nvm use && npm ci && npm start
```

Bản đã làm xong: `git checkout session04-end`.

## 3. Cần lưu ý

- **Demo đổi phiên phải điều hướng trong app** (menu, nút), không F5 hay gõ URL: tải lại trang làm mất state trong bộ nhớ, lỗi sẽ không hiện.
- Buổi này không cần thay đổi backend. Nếu buổi 3 còn bật `DEMO_SLOW_SHORT_QUERY`, tắt đi trước khi demo.
- Ma trận state và ADR-0003 là sản phẩm nộp; review chéo nên tập trung vào phương án bị loại và lý do.
