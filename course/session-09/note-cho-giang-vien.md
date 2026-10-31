# Buổi 9 — Ghi chú đọc tài liệu (dành cho giảng viên)

**Buổi 9:** Build và CI/CD triển khai ứng dụng · 4 giờ

Toàn bộ tài liệu nằm trong `course/session-09/`.

## 1. Thứ tự nên đọc

| # | File | Nội dung | Thời gian |
|---|---|---|---|
| 1 | `README.md` | Nội dung theo đề cương, use case "npm start chạy, lên nginx thì hỏng", số đo thật, phần đã chuẩn bị | 3 phút |
| 2 | `slides/buoi-09-build-va-cicd.pdf` (hoặc `.pptx`) | 22 slide: build tái lập, gate, budget, Docker, fallback, cache, header, CSP, runtime config, version, smoke, pipeline, rollback | 20 phút |
| 3 | `lab/README.md` + hai patch trong `lab/` | Đề lab 5 bài, 120 phút; patch icon (budget fail), patch v1.1.0 (bản phát hành lỗi) | 120 phút |
| 4 | `solution/README.md` | Đáp án, số đo, bảng thử phá (smoke và unit), mutant thoát, điểm chấm | 15 phút |
| 5 | `instructor-notes.md` | Chuẩn bị image demo, timeline, kịch bản demo 5 bước, câu hỏi hay gặp, lỗi thường gặp | 15 phút |
| 6 | `frontend/Dockerfile`, `frontend/nginx/*.template`, `deploy.smoke.ts`, `.github/workflows/ci.yml`, `.gitlab-ci.yml`, `docs/release-checklist-1.1.0.md`, `docs/quy-trinh-rollback.md` (nhánh `session09-end`) | Bản mẫu sản phẩm đầu ra | 15 phút |

**Bài tập về nhà:** `course/bai-tap-ve-nha/buoi-09-build-va-cicd.html` (khoảng 30 phút, nộp trước buổi 10).

## 2. Cách chạy

```bash
git checkout session09-start
docker compose -f infra/docker-compose.yml up -d
cd frontend && nvm use && npm ci && npx nx build portal
docker compose -f ../infra/docker-compose.yml --profile web up -d --build web     # http://localhost:8090
```

Đáp án (`git checkout session09-end`): image build trong container, có version.

```bash
WEB_VERSION=1.0.0 GIT_COMMIT=$(git rev-parse --short HEAD) docker compose -f infra/docker-compose.yml --profile web build web
WEB_VERSION=1.0.0 docker compose -f infra/docker-compose.yml --profile web up -d web
cd frontend && BASE_URL=http://localhost:8090 EXPECTED_VERSION=1.0.0 npx playwright test -c apps/portal-e2e/playwright.smoke.config.mts
```

## 3. Cần lưu ý

- **Cổng 8090** (không phải 8080). `api` phải được tạo lại để nhận origin 8090 (`up -d`, không cần `--build`).
- **Pipeline chưa chạy trên CI thật** (GitHub Actions, GitLab). Từng lệnh của job image đã chạy trên máy; nói rõ với lớp.
- **Hỏi VNPT** hệ thống CI, runner có Docker không, registry nội bộ, proxy: quyết định Bài 5 viết YAML cho hệ thống nào.
- Hai patch lab **không** nằm trong chuỗi đáp án. `v1.1.0` qua trọn gate: đó là điểm của bài (lỗi chỉ lộ khi triển khai với cấu hình môi trường).
- Số đo trong tài liệu từ máy Apple Silicon; hash commit trong `docs/release-checklist-1.1.0.md` là của lần diễn tập khi soạn bài.
- App `admin` vẫn có script inline trong `index.html`; bài chỉ triển khai portal.
