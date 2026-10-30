# Buổi 7 — Ghi chú đọc tài liệu (dành cho giảng viên)

**Buổi 7:** SSO và chiến lược kiểm thử hệ thống · 4 giờ

Toàn bộ tài liệu nằm trong `course/session-07/`.

## 1. Thứ tự nên đọc

| # | File | Nội dung | Thời gian |
|---|---|---|---|
| 1 | `README.md` | Nội dung theo đề cương, 3 lỗi thật của use case, phần đã chuẩn bị | 3 phút |
| 2 | `slides/buoi-07-sso-va-kiem-thu.pdf` (hoặc `.pptx`) | 27 slide: bốn vai OIDC, Code + PKCE, state/nonce, ID token và access token, port/adapter, logout, SPA/BFF, tháp kiểm thử, assertion yếu, thử phá, E2E, quyền ở API | 20 phút |
| 3 | `lab/README.md` | Đề lab 5 bài, 120 phút | 120 phút |
| 4 | `solution/README.md` | Đáp án, log tái hiện lỗi, kết quả curl, bảng "thử phá", điểm chấm | 15 phút |
| 5 | `instructor-notes.md` | Timeline, kịch bản demo 5 bước (lệnh sẵn), câu hỏi hay gặp, lỗi thường gặp | 15 phút |
| 6 | `docs/checklist-sso.md`, `docs/bao-cao-kiem-thu.md` (nhánh `session07-end`) | Bản mẫu sản phẩm đầu ra | 10 phút |

**Bài tập về nhà:** `course/bai-tap-ve-nha/buoi-07-sso-va-kiem-thu.html` (khoảng 30 phút, nộp trước buổi 8).

## 2. Cách chạy

```bash
git checkout session07-start
docker compose -f infra/docker-compose.yml --profile sso up -d --build
cd frontend && nvm use && npm ci && npm start
```

Chuyển portal sang SSO: thêm vào `frontend/apps/portal/public/config.json`
`"auth": { "mode": "oidc", "authority": "http://localhost:8180/realms/care", "clientId": "care-portal" }`, tải lại trang.
Keycloak admin: <http://localhost:8180/admin> (`admin`/`admin`).

Chạy test của đáp án (sau khi `git checkout session07-end` và `--build api`):

```bash
cd frontend
npx playwright test -c apps/portal-e2e/playwright.config.mts journeys security --project=chromium   # portal chế độ local
SSO=1 npx playwright test -c apps/portal-e2e/playwright.config.mts sso --project=chromium           # portal chế độ OIDC
```

## 3. Cần lưu ý

- **Phải build lại `api`** (`--build`): backend mới nhận token Keycloak; buổi 7 không có migration mới.
- **Portal phải chạy cổng 4200**: realm chỉ đăng ký redirect URI `http://localhost:4200/auth/callback` (cố ý chính xác, là một dòng của checklist).
- Keycloak dùng `start-dev`, **không có volume**: mỗi lần tạo lại container, realm import lại từ `infra/keycloak/care-realm.json`.
- Image Keycloak ~475 MB: tải trước buổi học. Các buổi khác không cần Keycloak (không bật profile `sso`).
- Lỗi 1 (401) và lỗi 2 (máy dùng chung) ở điểm bắt đầu là **cố ý**. Lỗi 3 (`PATCH` đóng phiếu) là lỗi **thật** có từ buổi 2, được sửa ở Bài 5.
- Demo bước 5 và test hành trình đóng thật phiếu trong DB; `docker compose -f infra/docker-compose.yml down -v` để về dữ liệu gốc.
