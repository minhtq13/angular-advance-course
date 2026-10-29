# Buổi 5 — Ghi chú đọc tài liệu (dành cho giảng viên)

**Buổi 5:** Hiệu năng và quản lý bộ nhớ · 4 giờ

Toàn bộ tài liệu nằm trong `course/session-05/`.

## 1. Thứ tự nên đọc

| # | File | Nội dung | Thời gian |
|---|---|---|---|
| 1 | `README.md` | Nội dung theo đề cương, use case, số đo tóm tắt | 3 phút |
| 2 | `slides/buoi-05-hieu-nang-va-bo-nho.pdf` (hoặc `.pptx`) | 22 slide: quy trình đo, công cụ, change detection, DOM lớn, virtual scroll, `@defer`, heap snapshot, bảng số đo, kết luận | 20 phút |
| 3 | `lab/README.md` | Đề lab 5 bài, 120 phút | 120 phút |
| 4 | `solution/README.md` | Đáp án, số đo thật, dòng đối chứng, điểm chấm | 15 phút |
| 5 | `instructor-notes.md` | Timeline, kịch bản demo 5 bước, câu hỏi hay gặp, lỗi thường gặp | 15 phút |

**Bài tập về nhà:** `course/bai-tap-ve-nha/buoi-05-hieu-nang-va-bo-nho.html` (khoảng 30 phút, nộp trước buổi 6).

## 2. Cách chạy

```bash
git checkout session05-start
MAX_PAGE_SIZE=10000 docker compose -f infra/docker-compose.yml up -d --build api
cd frontend && nvm use && npm ci && npm start
```

Đo lại số liệu trên máy giảng viên (sau khi `git checkout session05-end`):

```bash
cd frontend
PERF=1 THROTTLE=4 npx playwright test -c apps/portal-e2e/playwright.config.mts report.perf --project=chromium
```

## 3. Cần lưu ý

- **Số đo trong slide là của máy giảng viên** (Apple M4, dev build). Trên máy lớp học số sẽ khác; xu hướng giữ nguyên. Nên chạy kịch bản đo trên máy chiếu trước buổi học và cập nhật slide 17 nếu cần.
- Sau buổi học nhớ trả `api` về giới hạn 200 dòng.
- Học viên cần cài Angular DevTools trước buổi.
