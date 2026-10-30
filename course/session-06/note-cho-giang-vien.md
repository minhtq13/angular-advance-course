# Buổi 6 — Ghi chú đọc tài liệu (dành cho giảng viên)

**Buổi 6:** Authentication và bảo mật giao tiếp API · 4 giờ

Toàn bộ tài liệu nằm trong `course/session-06/`.

## 1. Thứ tự nên đọc

| # | File | Nội dung | Thời gian |
|---|---|---|---|
| 1 | `README.md` | Nội dung theo đề cương, use case, phần đã chuẩn bị | 3 phút |
| 2 | `slides/buoi-06-xac-thuc-va-bao-mat-api.pdf` (hoặc `.pptx`) | 24 slide: ranh giới tin cậy, 401/403/409, JWT và claim, rotation, refresh dùng chung, Bearer đúng phạm vi, nơi lưu token, XSS, CSRF, CORS, ma trận | 20 phút |
| 3 | `lab/README.md` | Đề lab 5 bài, 120 phút | 120 phút |
| 4 | `solution/README.md` | Đáp án, kết quả kiểm tra trên trình duyệt, bảng "thử phá", điểm chấm | 15 phút |
| 5 | `instructor-notes.md` | Timeline, kịch bản demo 5 bước (lệnh curl sẵn), câu hỏi hay gặp, lỗi thường gặp | 15 phút |
| 6 | `docs/vong-doi-phien.md`, `docs/ma-tran-bao-mat.md` (nhánh `session06-end`) | Bản mẫu sản phẩm đầu ra | 10 phút |

**Bài tập về nhà:** `course/bai-tap-ve-nha/buoi-06-xac-thuc-va-bao-mat-api.html` (khoảng 30 phút, nộp trước buổi 7).

## 2. Cách chạy

```bash
git checkout session06-start
ACCESS_TOKEN_TTL=30s docker compose -f infra/docker-compose.yml up -d --build api
cd frontend && nvm use && npm ci && npm start
```

Chạy ma trận bảo mật (sau khi `git checkout session06-end`, chỉ cần backend):

```bash
cd frontend
npx playwright test -c apps/portal-e2e/playwright.config.mts security --project=chromium
```

## 3. Cần lưu ý

- **Phải build lại `api`** (`--build`): có migration mới `V5__refresh_token.sql`. DB dump cũ tự nâng lên, không cần `down -v`.
- **Chờ 45 giây**, không phải 30: server cho clock skew 10 giây.
- Lỗi "bị đá ra" ở điểm bắt đầu là **cố ý**; nếu thử trước buổi mà không bị đá ra thì `api` chưa chạy bản mới hoặc TTL chưa là 30 giây.
- Sau buổi học trả `api` về TTL mặc định (bỏ biến `ACCESS_TOKEN_TTL`).
