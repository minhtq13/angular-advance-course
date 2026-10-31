# Buổi 8 — Ghi chú đọc tài liệu (dành cho giảng viên)

**Buổi 8:** Ứng dụng AI và Copilot trong phát triển Angular · 4 giờ

Toàn bộ tài liệu nằm trong `course/session-08/`.

## 1. Thứ tự nên đọc

| # | File | Nội dung | Thời gian |
|---|---|---|---|
| 1 | `README.md` | Nội dung theo đề cương, use case "CI xanh nhưng lọc không chạy", số đo thật, phần đã chuẩn bị | 3 phút |
| 2 | `slides/buoi-08-ai-va-copilot.pdf` (hoặc `.pptx`) | 22 slide: prompt theo AC, AGENTS.md, Angular MCP, chính sách dữ liệu, checklist review, tham số API sai, lỗi chồng lỗi, xác minh finding, thử phá, negative test, năng suất | 20 phút |
| 3 | `lab/README.md` + `lab/pr-bo-loc-loai-yeu-cau.patch` | Đề lab 5 bài, 120 phút; PR mô phỏng AI có lỗi cài sẵn | 120 phút |
| 4 | `solution/README.md` | Đáp án, bảng thử phá M1–M5 đã chạy, bảng finding đã xác minh, điểm chấm | 15 phút |
| 5 | `instructor-notes.md` | Timeline, kịch bản demo 5 bước, câu hỏi hay gặp, lỗi thường gặp | 15 phút |
| 6 | `AGENTS.md`, `docs/ai-review-pr-bo-loc-loai-yeu-cau.md`, `docs/bao-cao-nang-suat-ai.md` (nhánh `session08-end`) | Bản mẫu sản phẩm đầu ra | 10 phút |

**Bài tập về nhà:** `course/bai-tap-ve-nha/buoi-08-ai-va-copilot.html` (khoảng 30 phút, nộp trước buổi 9).

## 2. Cách chạy

```bash
git checkout session08-start
docker compose -f infra/docker-compose.yml up -d --build api
cd frontend && nvm use && npm ci && npm start
```

Xem PR mô phỏng (nhánh riêng, không merge):

```bash
git switch -c demo-pr session08-start
git show main:course/session-08/lab/pr-bo-loc-loai-yeu-cau.patch | git apply
```

Chạy test của đáp án (`git checkout session08-end`, cần backend):

```bash
cd frontend
npx playwright test -c apps/portal-e2e/playwright.config.mts ticket-filter --project=chromium
```

## 3. Cần lưu ý

- **Phải build lại `api`**: backend mới có tham số `category`. Không có migration mới.
- **PR là mô phỏng**, lỗi cài có chủ đích, không phải output nguyên văn của một công cụ AI. Nói rõ với lớp. Kết quả AI thật trong demo/lab mỗi lần mỗi khác.
- **Chính sách AI của VNPT** quyết định công cụ dùng trong lab: hỏi trước buổi học (README buổi 8, mục cần chuẩn bị).
- `AGENTS.md` và `.github/copilot-instructions.md` là **đáp án Bài 1**: không có trên `session08-start`.
- Thời gian trong báo cáo năng suất là số đo của học viên; đáp án không có số thời gian của người.
