# Lab buổi 9 — Build và CI/CD triển khai ứng dụng

**Thời gian:** 120 phút · **Điểm xuất phát:** `git checkout session09-start`

**Use case.** Portal chạy tốt với `npm start`, nhưng "bản đầu" đưa lên nginx (`frontend/Dockerfile`, `frontend/nginx.conf`) có lỗi:
deep link 404, người dùng kẹt ở bản cũ sau khi phát hành, không có header bảo mật. Lab này: build tái lập, budget là gate, đóng gói đúng,
một image cho nhiều môi trường, smoke test sau triển khai và rollback có diễn tập.

**Sản phẩm nộp cuối buổi:** pipeline YAML (`.github/workflows/ci.yml` hoặc `.gitlab-ci.yml`) · `docs/release-checklist-1.1.0.md` (theo mẫu
`course/_templates/release-checklist.md`) · bằng chứng smoke test (ảnh `frontend/dist/smoke-report` hoặc output) · `docs/quy-trinh-rollback.md`.

Trước khi bắt đầu:
```bash
git checkout session09-start
docker compose -f infra/docker-compose.yml up -d            # api nhận thêm origin http://localhost:8090 (container được tạo lại)
cd frontend && nvm use && npm ci
npx nx build portal
docker compose -f ../infra/docker-compose.yml --profile web up -d --build web    # "bản đầu" ở http://localhost:8090
# Lấy file lab từ main (thư mục course/ trên main):
git show origin/main:course/session-09/lab/dang-ky-tat-ca-icon.patch > ../icon.patch
git show origin/main:course/session-09/lab/v1.1.0-tong-dai-ho-tro.patch > ../v1.1.0.patch
```

Cổng 8090 bận: đổi `"8090:80"` trong `infra/docker-compose.yml` và thêm origin tương ứng vào `CORS_ORIGINS`.

---

## Bài 1 — Chạy gate như CI, khóa phiên bản Node (20 phút)

1. Chạy gate giống CI, ghi thời gian:
   ```bash
   npx nx reset
   time npx nx run-many -t lint test build      # lần 1: không cache
   time npx nx run-many -t lint test build      # lần 2: đọc dòng "Nx read the output from the cache..."
   ```
2. Sửa một dòng trong `libs/portal/domain-tickets/src/index.ts` (thêm comment), chạy `npx nx show projects --affected --base=HEAD`. Bao nhiêu project?
   Sửa một file trong `docs/` thì sao? Hoàn tác thay đổi.
3. **Sai phiên bản Node.** Không cần cài Node khác, chạy trong container (chỉ đọc file, không ghi vào máy):
   ```bash
   docker run --rm -v "$PWD/package.json:/w/package.json:ro" -v "$PWD/package-lock.json:/w/package-lock.json:ro" \
     -w /w node:20-alpine sh -c 'npm ci --ignore-scripts; echo exit=$?'
   ```
   `npm ci` có dừng không? Đếm cảnh báo `EBADENGINE`. Đọc `frontend/.nvmrc` và `engines` của `@angular/core` trong `package-lock.json`.
4. Làm cho sai phiên bản Node **dừng ngay ở `npm ci`**: thêm `engines` vào `package.json` (cập nhật lockfile bằng
   `npm install --package-lock-only`), tạo `frontend/.npmrc` với `engine-strict=true`. Chạy lại lệnh ở bước 3 (thêm mount `.npmrc`).

**Kiểm tra:** bảng số đo (lần 1, lần 2, affected); `npm ci` bằng Node 20 báo `EBADENGINE` và exit khác 0; gate vẫn xanh với Node theo `.nvmrc`.

## Bài 2 — Budget fail (15 phút)

1. `git apply ../icon.patch` ("đăng ký hết icon cho tiện"). Chạy `npx nx lint shared-ui-layout`, `npx nx test portal`: xanh?
2. `npx nx build portal`. Đọc dòng `ERROR` về budget: vượt bao nhiêu? So bảng "Initial chunk files" với trước khi áp patch: chunk nào phình?
3. Tìm package gây phình. Build đỏ thì **không** có `browser-stats.json`: tạm nâng `maximumError` lên `3mb`, build `--stats-json`, rồi cộng
   `bytesInOutput` theo package trong các file initial (hoặc mở `dist/apps/portal/browser-stats.json` bằng esbuild bundle analyzer).
   Khôi phục `maximumError`.
4. Gỡ patch (`git apply -R ../icon.patch`). Thêm hai hàng rào:
   - **Lint** bắt `import * as ... from '@ant-design/icons-angular/icons'` (`no-restricted-syntax`, trong `frontend/eslint.config.mjs`). Áp lại patch: lint phải đỏ, chỉ đúng dòng.
   - **Siết budget** sát mức hiện tại (bundle ban đầu đang 1,39 MB; ngưỡng lỗi 2 MB cho phép phình thêm hơn 600 kB mà không ai biết).

**Kiểm tra:** con số vượt budget; tên package và kích thước trước/sau; lint đỏ với patch icon; gate xanh khi gỡ patch.

## Bài 3 — Docker multi-stage + nginx (35 phút)

1. **Viết smoke test trước** (`apps/portal-e2e/src/smoke/deploy.smoke.ts` + `apps/portal-e2e/playwright.smoke.config.mts`, không bật dev server).
   Chạy trên "bản đầu" (`BASE_URL=http://localhost:8090 npx playwright test -c apps/portal-e2e/playwright.smoke.config.mts`), ghi test nào đỏ:
   - Deep link `/tickets?status=NEW` trả 200 `text/html`.
   - File tĩnh không có (`/chunk-ZZZZZZZZ.js`, `/i18n/khong-co.json`) trả **404**, không trả `index.html`.
   - `/`, `/tickets`, `/config.json`, `/i18n/vi.json`: `Cache-Control: no-cache`; `main-*.js`: `public, max-age=31536000, immutable`.
   - Header: CSP có `script-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`; `X-Content-Type-Options: nosniff`; `Referrer-Policy`.
   - Mở deep link, đăng nhập, thấy bảng phiếu, **không lỗi console**.
2. `Dockerfile` multi-stage: stage `node:<phiên bản trong .nvmrc>-alpine` chạy `npm ci` + `nx build portal`; stage `nginx:<phiên bản cố định>-alpine`
   chỉ chứa `dist`. Thêm `.dockerignore`. Ghi kích thước context (`transferring context`) có và không có `.dockerignore`.
3. Cấu hình nginx (gợi ý: template `/etc/nginx/templates/*.template`, image nginx thay biến môi trường lúc khởi động):
   - SPA fallback cho đường dẫn của router, nhưng file tĩnh thiếu phải 404.
   - Cache theo loại file: có hash trong tên → 1 năm `immutable`; còn lại (`index.html`, `config.json`, `i18n/`, `themes/`) → `no-cache`.
   - Header bảo mật. Bẫy: `add_header` trong `location` **ghi đè** toàn bộ `add_header` của `server`.
4. Thêm CSP `script-src 'self'`, mở trang ở chế độ tối và đọc console. Hai script inline nào bị chặn? Trang trông thế nào? Sửa mà **không** thêm
   `'unsafe-inline'` cho script (gợi ý: script đặt theme ra file trong `public/`; `optimization.styles.inlineCritical` trong `project.json`).
5. Build, chạy (`docker compose ... --profile web up -d --build web`), smoke xanh. Thử phá (bỏ fallback, cache `index.html` 1 năm, bỏ header ở một location,
   trả script inline): test nào đỏ? Có chỗ nào phá mà **không** test nào đỏ? Vì sao?

**Kiểm tra:** smoke đỏ trên bản đầu, xanh trên bản mới; bảng thử phá; ảnh tab Network: `index.html` `no-cache`, `main-*.js` `immutable`.

## Bài 4 — Một image, nhiều môi trường (25 phút)

1. Image build một lần. `config.json` (tên môi trường, `apiUrl`) là của **môi trường**: mount lúc chạy (`infra/web/config.json`).
   Origin của API cho CSP `connect-src` cũng theo môi trường (`API_ORIGIN`). Chạy cùng một image với `environmentName` "STAGING": header hiện gì?
   `docker image inspect` cho cùng digest?
2. Version là của **image**: `ARG APP_VERSION`, `ARG GIT_COMMIT` → `/version.json` + label OCI. Đặt `ARG` **sau** bước build: đổi version có build lại Angular không?
3. App đọc `version.json` lúc khởi động (test trước: version đúng; dev server trả `index.html` hoặc 404 → `dev`, không làm hỏng khởi động) và ghi lỗi
   chưa bắt kèm version: `[care-portal 1.0.0 <commit>]` (một `ErrorHandler`).
4. Smoke: `/version.json` `no-cache`, `version` = `EXPECTED_VERSION`, `commit` là hash. Build image `1.0.0`:
   ```bash
   WEB_VERSION=1.0.0 GIT_COMMIT=$(git rev-parse --short HEAD) docker compose -f ../infra/docker-compose.yml --profile web build web
   WEB_VERSION=1.0.0 docker compose -f ../infra/docker-compose.yml --profile web up -d web
   BASE_URL=http://localhost:8090 EXPECTED_VERSION=1.0.0 npx playwright test -c apps/portal-e2e/playwright.smoke.config.mts
   ```

**Kiểm tra:** cùng digest, hai tên môi trường; smoke có version xanh; build quên `GIT_COMMIT` thì smoke đỏ.

## Bài 5 — Pipeline, release checklist, rollback (25 phút)

1. Mở rộng `.github/workflows/ci.yml`: PR chạy `nx affected`; `main` và tag `v*` chạy gate đủ → build image có version → `up -d --wait` → smoke
   (`EXPECTED_VERSION`) → lưu image làm artifact. Viết `.gitlab-ci.yml` tương đương nếu đơn vị dùng GitLab.
2. **Diễn tập phát hành 1.1.0:** `git apply ../v1.1.0.patch`, gate (xanh?), commit, build image `1.1.0`, triển khai **giữ nguyên** `infra/web/config.json`.
   Chạy smoke với `EXPECTED_VERSION=1.1.0`. Đăng nhập trên trình duyệt: thấy gì? Console ghi gì (có version không)?
3. **Rollback** về `1.0.0` không build lại, bấm giờ từ lúc gõ lệnh đến khi smoke xanh:
   ```bash
   WEB_VERSION=1.0.0 docker compose -f ../infra/docker-compose.yml --profile web up -d --no-build web
   BASE_URL=http://localhost:8090 EXPECTED_VERSION=1.0.0 npx playwright test -c apps/portal-e2e/playwright.smoke.config.mts
   ```
4. Điền `docs/release-checklist-1.1.0.md` (mục nào chưa đạt, bằng chứng, rollback) và `docs/quy-trinh-rollback.md` (điều kiện, lệnh, người quyết định,
   số đo). Đề xuất cách sửa tiến để 1.1.1 không lặp lại lỗi.

**Kiểm tra:** YAML; checklist chỉ ra đúng mục "cấu hình môi trường"; thời gian rollback đo thật; smoke 1.0.0 xanh sau rollback.

---

## Dọn sau buổi học

```bash
docker compose -f infra/docker-compose.yml --profile web down       # chỉ dừng; thêm -v sẽ xóa cả dữ liệu postgres
docker image ls care-portal-web                                      # giữ 1.0.0 nếu muốn làm bài tập về nhà
```
