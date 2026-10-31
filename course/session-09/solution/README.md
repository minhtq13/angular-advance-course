# Đáp án lab buổi 9

## Áp đáp án vào code

Trong thư mục gốc repo, từ `session09-start`:

```bash
git apply course/session-09/solution/bai1-build-tai-lap.patch
git apply course/session-09/solution/bai2-budget-va-lint.patch
git apply course/session-09/solution/bai3-docker-nginx.patch
git apply course/session-09/solution/bai4-runtime-config-va-version.patch
git apply course/session-09/solution/bai5-pipeline-va-rollback.patch
```

Gỡ theo thứ tự ngược lại. Bản đã áp đủ là nhánh `session09-end`. Hai patch trong `../lab/` (icon, v1.1.0) **không** nằm trong chuỗi đáp án:
chúng áp lên để tái hiện lỗi rồi gỡ ra.

Đã kiểm tra: sau **từng** patch, `nx run-many -t lint test build` pass (16 project); áp đủ ra đúng `session09-end`, gỡ ra về đúng
`session09-start`; hai patch lab áp được lên cả `-start` và `-end`. Smoke test chạy với image thật trên nginx, backend riêng (seed 500 phiếu, cổng 8091), Chromium.
Số đo trên máy Apple Silicon; máy học viên sẽ khác, so sánh tương đối mới có ý nghĩa.

**Chưa chạy trên CI thật:** pipeline GitHub Actions và GitLab chưa chạy trên máy chủ CI. Đã chạy lại **từng lệnh** của job `image` trên máy
(project compose riêng, đổi cổng): build web 2 giây (có cache), `up -d --wait` 20 giây, smoke 6/6, image nén 25,8 MB.

---

## Bài 1 — Build tái lập

Patch: `engines` (`>=24.22.0 <25`) trong `package.json` + lockfile, `frontend/.npmrc` với `engine-strict=true`.

| Đo | Kết quả |
|---|---|
| Gate lần 1 (`nx reset`, không cache) | 16 project, 33 task, 21,9 giây |
| Gate lần 2 | 0,71 giây, 33/33 task đọc từ cache |
| Sửa `domain-tickets`, `nx affected` | 6 project, 10,4 giây (không cache) |
| Chỉ sửa `docs/` | 0 project |
| `npm ci` bằng Node 20, chưa có `engine-strict` | exit 0, 87 cảnh báo `EBADENGINE` (Node 20.18.3), cài 801 package (Node 24: 805) |
| Build bằng Node 20 | `require() of ES Module .../listr2/dist/index.mjs not supported`: không nói gì về phiên bản Node |
| `npm ci` bằng Node 20, có `engine-strict` | `npm error notsup Required: {"node":">=24.22.0 <25"}`, exit 1 |

Điểm chấm: có số đo; giải thích vì sao lỗi phải dừng ở `npm ci` (rẻ nhất, thông báo rõ) thay vì ở build.

## Bài 2 — Budget

Patch: siết budget `initial` của portal (warning 1,45 MB, error 1,5 MB; hiện 1,39 MB) + luật `no-restricted-syntax` chặn `import *` từ bộ icon.

| Đo (áp `lab/dang-ky-tat-ca-icon.patch`) | Kết quả |
|---|---|
| Lint, test | Xanh (trước khi có luật) |
| Build | `bundle initial exceeded maximum budget. Budget 2.00 MB was not met by 55.17 kB with a total of 2.06 MB` |
| Transfer ước tính | 254,59 kB → 379,71 kB |
| Theo package (initial) | `@ant-design/icons-angular` 44,2 kB → 766,5 kB (848 icon) |
| Sau Bài 2 | Lint đỏ `9:8 error Chỉ import icon cần dùng...`; build cũng đỏ (ngưỡng 1,5 MB) |

Bẫy: build vượt budget thì **không** sinh `browser-stats.json`. Phát hiện thêm: `angular-auth-oidc-client` chiếm 136,3 kB trong bundle ban đầu
ngay cả ở chế độ đăng nhập local (dùng ở bài tập về nhà).

## Bài 3 — Docker multi-stage + nginx

| File | Thay đổi |
|---|---|
| `Dockerfile` | Stage `node:24.22.0-alpine` (`npm ci` có cache BuildKit, `nx build portal`) → stage `nginx:1.31.8-alpine` chỉ chứa `dist` |
| `.dockerignore` | `node_modules`, `dist`, `.nx`, `.angular`, output test |
| `nginx/default.conf.template` | Ba location: file có hash (1 năm `immutable`, 404 nếu thiếu), file không hash (`no-cache`, 404 nếu thiếu), còn lại → `index.html` |
| `nginx/security-headers.inc.template` | CSP (`script-src 'self'`, `connect-src 'self' ${API_ORIGIN}`, `frame-ancestors 'none'`...), `nosniff`, `Referrer-Policy` |
| `apps/portal/public/theme-init.js`, `index.html` | Script đặt theme ra file, không còn script inline |
| `apps/portal/project.json` | `optimization.styles.inlineCritical: false` (beasties không chèn script inline) |
| `apps/portal-e2e/src/smoke/deploy.smoke.ts`, `playwright.smoke.config.mts` | Smoke test chạy trên bản đã triển khai |

| Đo | Kết quả |
|---|---|
| Smoke trên "bản đầu" | 4/5 đỏ (deep link 404, cache 1 năm, không header, đăng nhập không tới được); test "file thiếu trả 404" xanh |
| Smoke trên bản mới | 5/5 xanh |
| Build image | 26 giây (`npm ci` 15 giây, 804 package; `nx build` 6,7 giây); image 65,3 MB, không có Node |
| Context | 1,09 MB; không `.dockerignore`: 494,79 MB, gửi 7,4 giây |
| CSP chặt trên build cũ | 2 vi phạm, `styles-*.css` kẹt `media=print` |
| CSP chặt trên bản mới, chế độ tối | 0 lỗi console, style đủ |

**Thử phá, đã chạy thật** (mount template sửa đè vào container):

| Phá | Smoke đỏ |
|---|---|
| M1 `location /` bỏ fallback (`=404`) | 4: deep link, cache (`/` cũng 404), header, đăng nhập |
| M2 file không hash thiếu thì trả `index.html` | 1: "file tĩnh không tồn tại trả 404" |
| M3 bỏ `include` header ở location file không hash | 1: "co header bao mat" |
| M4 cache 1 năm ở location file không hash | 1: "khong cache" |
| M5 trả lại script inline vào `index.html` | 1: đăng nhập, không lỗi console |
| M6 không truyền `API_ORIGIN` (API ở cổng khác) | 1: đăng nhập (CSP chặn `connect-src`) |

**Bài học từ bản cấu hình đầu tiên:** M3 và M4 ban đầu **không** test nào bắt. Lý do: `try_files ... /index.html` chuyển **nội bộ** sang
`/index.html`, nginx chọn lại location (khớp location file không hash); mọi `add_header` trong `location /` không bao giờ được dùng. Test không yếu,
cấu hình có phần chết. Bản đáp án bỏ `add_header` khỏi `location /` và ghi rõ trong comment.

**Giới hạn còn lại** (ghi trong `docs/quy-trinh-rollback.md`): tab mở **trước** khi đổi version vẫn xin chunk cũ → 404 (đo: `Failed to fetch
dynamically imported module` ở tab cũ; tab mới nhận ngay `main-*.js` mới). Cache đúng không chữa được trường hợp này.

## Bài 4 — Một image, nhiều môi trường

| File | Thay đổi |
|---|---|
| `libs/shared/util-config/src/lib/app-release.ts` (+ spec) | `loadAppRelease()` đọc `/version.json` (404 hoặc `index.html` → `dev`); `provideAppRelease()`: `ErrorHandler` ghi `[care-portal <version> <commit>]` |
| `apps/portal/src/main.ts`, `app.config.ts` | Đọc config và release song song; đăng ký `provideAppRelease` |
| `Dockerfile` | `ARG APP_VERSION`, `ARG GIT_COMMIT` sau bước build → `version.json`, label OCI |
| `infra/docker-compose.yml`, `infra/web/config.json` | `web`: build args, `API_ORIGIN`, mount `config.json` |
| Smoke | `version.json` `no-cache`, đúng `EXPECTED_VERSION`, commit là hash |

Test viết trước, đỏ: `Failed to resolve import "./app-release"`. Đo:
- Đổi `APP_VERSION`, giữ code: bước `nx build` và `COPY dist` **CACHED**, chỉ chạy lại bước ghi `version.json` (0,1 giây).
- Cùng image (`sha256:692389d3…`), mount config "STAGING": header hiện `STAGING`.

| Phá | Kết quả |
|---|---|
| Bỏ `try/catch` trong `loadAppRelease` | Unit đỏ: "dev server khong co version.json (tra index.html)" |
| Build quên `GIT_COMMIT` | Smoke đỏ: "version.json dung ban vua trien khai" |
| `EXPECTED_VERSION` khác image đang chạy (triển khai nhầm) | Smoke đỏ, cùng test |
| Bỏ `provideAppRelease(release)` trong `app.config.ts` | **Không test nào đỏ** (gate xanh, kể cả lint). Chỉ diễn tập Bài 5 thấy: log lỗi không có version |

## Bài 5 — Pipeline, checklist, rollback

Bản mẫu: `.github/workflows/ci.yml`, `.gitlab-ci.yml` (job image cần runner có Docker + Node, tag `docker-host`), `docs/release-checklist-1.1.0.md`,
`docs/quy-trinh-rollback.md`.

| Đo (diễn tập `lab/v1.1.0-tong-dai-ho-tro.patch`) | Kết quả |
|---|---|
| Gate với 1.1.0 | Xanh 16 project |
| Triển khai 1.1.0, giữ `config.json` của môi trường | Đăng nhập xong trang trắng; `[care-portal 1.1.0 ab11baa] TypeError: Cannot read properties of undefined (reading 'hotline')` |
| Smoke 1.1.0 | 5 xanh, 1 đỏ ("dang nhap, thay danh sach phieu") |
| Rollback `WEB_VERSION=1.0.0 ... up -d --no-build web` | Phục vụ `version.json` 1.0.0 sau 0,4 giây |
| Smoke 1.0.0 sau rollback | 6/6 xanh, 2 giây |

Điểm chấm: pipeline chỉ đẩy image **đã qua smoke**; smoke chạy trên chính image sẽ phát hành, có `EXPECTED_VERSION`; checklist chỉ ra mục
"cấu hình môi trường chưa duyệt"; rollback không build lại; có đề xuất sửa tiến (cấu hình tương thích ngược hoặc trường tùy chọn).

---

## Phần chuẩn bị ở `session09-start` (để giảng viên biết)

| Phần | Thay đổi |
|---|---|
| `frontend/Dockerfile`, `frontend/nginx.conf` | "Bản đầu": `FROM nginx:alpine`, chép `dist` build trên máy; nginx `expires 1y` cho mọi file, không `try_files`, không header bảo mật |
| `infra/docker-compose.yml` | Service `web` (profile `web`, cổng 8090), `CORS_ORIGINS` của `api` thêm `http://localhost:8090` |
| `.github/workflows/ci.yml` | Comment có dấu (khớp `main`) |
| Patch lab | `lab/dang-ky-tat-ca-icon.patch` (1 file), `lab/v1.1.0-tong-dai-ho-tro.patch` (10 file, qua gate) |
