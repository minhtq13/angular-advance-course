---
marp: true
theme: default
paginate: true
size: 16:9
header: 'Angular nâng cao · Buổi 9 — Build và CI/CD triển khai ứng dụng'
style: |
  section { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 26px; padding: 50px 64px; }
  h1 { color: #0050b3; }
  h2 { color: #0050b3; border-bottom: 3px solid #0050b3; padding-bottom: 6px; }
  header { color: #8c8c8c; font-size: 16px; }
  code { background: #f0f5ff; color: #1d39c4; }
  pre { font-size: 19px; line-height: 1.35; }
  table { font-size: 20px; }
  th { background: #0050b3; color: #fff; }
  .small { font-size: 20px; color: #595959; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .tip { background: #fffbe6; border-left: 6px solid #faad14; padding: 10px 16px; font-size: 22px; }
  .bad { background: #fff1f0; border-left: 6px solid #f5222d; padding: 10px 16px; font-size: 22px; }
  .good { background: #f6ffed; border-left: 6px solid #52c41a; padding: 10px 16px; font-size: 22px; }
  section.lead { background: #0050b3; color: #fff; justify-content: center; }
  section.lead h1, section.lead h2 { color: #fff; border: none; }
  section.lead header { color: #bae0ff; }
---

<!-- _class: lead -->
<!-- _paginate: false -->

# Buổi 9
## Build và CI/CD triển khai ứng dụng

Build tái lập · budget là gate · Docker + nginx · cache · header bảo mật · một image nhiều môi trường · smoke test · rollback

---

## Mục tiêu buổi học

Sau buổi này, học viên có thể:

1. **Build tái lập**: Node theo `.nvmrc`, `npm ci` theo lockfile, build trong container
2. Đặt **quality gate**: lint, test, build, **budget**; `nx affected` cho PR
3. Đóng gói **Docker multi-stage + nginx**: SPA fallback, cache đúng loại file, header bảo mật, CSP không vỡ trang
4. **Build một lần**, triển khai nhiều môi trường: `config.json` mount, version nằm trong image
5. **Smoke test** sau triển khai, log lỗi theo version, **rollback** đã diễn tập

<p class="small">Sản phẩm đầu ra: pipeline YAML · release checklist · bằng chứng smoke test · quy trình rollback</p>

---

## Lịch buổi học (4 giờ)

| Thời gian | Hoạt động |
|---|---|
| 20' | Review buổi 8 (review PR AI, báo cáo năng suất), phân tích use case |
| 40' | Build tái lập, gate, budget, Docker, nginx, cache, CSP, runtime config, version, smoke, pipeline, rollback |
| 30' | Live demo: bản đầu lên nginx; deep link, cache, CSP; phát hành 1.1.0 lỗi và rollback |
| 10' | Nghỉ |
| 120' | Lab 5 bài |
| 20' | Review chéo, chốt release checklist của nhóm |

---

## Review buổi 8

- PR "CI xanh" vẫn sai: **gate chỉ chứng minh những gì nó kiểm**
- Fake adapter phải giống backend; ít nhất một test đi tới **hệ thống thật**
- Thử phá: mutant thoát là dấu hiệu test (hoặc code) có chỗ chết

<div class="tip">Hôm nay: gate xanh trên máy dev vẫn chưa đủ. Bản <b>đã triển khai</b> (nginx, cache, header, cấu hình môi trường) cũng cần test riêng: smoke test.</div>

---

## Use case: "npm start chạy, lên nginx thì hỏng"

"Bản đầu" (`session09-start`): build trên máy, chép `dist` vào `nginx:alpine`, `expires 1y` "cho nhanh". Đo tại `localhost:8090`:

| Thao tác | Kết quả |
|---|---|
| Mở link `/tickets?status=NEW`, hoặc F5 ở trang phiếu | **404** nginx (`/` vẫn mở được) |
| `index.html`, `config.json` | `Cache-Control: max-age=31536000` |
| Phát hành bản mới, người dùng mở tab mới | Vẫn chạy `main-LEVGUPEU.js` cũ; đăng nhập xong `chunk-D2HgOIw5.js` **404**, kẹt ở trang đăng nhập |
| Header bảo mật | Không có CSP, `nosniff`, `frame-ancestors` |
| Thêm CSP `script-src 'self'` | 2 vi phạm, `styles-*.css` kẹt `media=print`: form, menu mất style |

<p class="small">Dev server luôn có fallback, không đặt cache/header: các lỗi này không bao giờ thấy khi <code>npm start</code>.</p>

---

## Build tái lập: cùng mã nguồn, cùng kết quả

| | Không khóa | Khóa |
|---|---|---|
| Node | Máy ai nấy cài | `.nvmrc` (24.22.0), image `node:24.22.0-alpine` |
| Dependency | `npm install` (có thể đổi lockfile) | `npm ci`: đúng lockfile, xóa `node_modules` cũ |
| Sai Node | **Cảnh báo** rồi vẫn cài | `engines` + `.npmrc` `engine-strict=true`: **dừng** |

Đo với Node 20 (Angular 22 cần `^22.22.3 || ^24.15.0 || >=26.0.0`):
- `npm ci`: exit 0, 87 cảnh báo `EBADENGINE`, 801 package (Node 24: 805)
- `nx build`: `require() of ES Module .../listr2/dist/index.mjs not supported` (không nhắc tới Node)
- Có `engine-strict`: `npm error notsup Required: {"node":">=24.22.0 <25"}`

<div class="good">Lỗi dừng ở bước sớm nhất, thông báo rõ nhất.</div>

---

## Quality gate và `nx affected`

```bash
npx nx run-many -t lint test build             # main, tag: chạy đủ
npx nx affected -t lint test build --base=origin/main --head=HEAD   # PR: chỉ project bị ảnh hưởng
```

| Đo (Apple Silicon) | |
|---|---|
| Gate đủ, không cache | 16 project, 33 task, 21,9 giây |
| Lần 2 (cache) | 0,71 giây |
| Sửa `domain-tickets` → affected | 6 project, 10,4 giây |
| Chỉ sửa `docs/` | 0 project |

- `lint` gồm luật import của buổi 1; `build` gồm **budget**: vượt `maximumError` là build đỏ
- `affected` dựa vào đồ thị phụ thuộc: luật lib đúng thì pipeline nhanh

---

## Budget là gate, không phải cảnh báo

"Đăng ký hết icon cho tiện" (`import * as AllIcons`): lint, test **xanh**; build:

```
✘ [ERROR] bundle initial exceeded maximum budget.
  Budget 2.00 MB was not met by 55.17 kB with a total of 2.06 MB.
```

| Bundle ban đầu | Trước | Sau |
|---|---|---|
| Tổng (raw / transfer) | 1,39 MB / 254,59 kB | 2,06 MB / 379,71 kB |
| `@ant-design/icons-angular` | 44,2 kB | 766,5 kB (848 icon) |

- Build đỏ thì **không** có `browser-stats.json`: tạm nâng ngưỡng để phân tích
- Ngưỡng 2 MB cho phép phình thêm hơn 600 kB mà không ai biết → siết sát mức hiện tại
- Bắt sớm hơn: `no-restricted-syntax` chặn `import *` từ bộ icon (lint đỏ đúng dòng)

---

## Docker multi-stage

```dockerfile
FROM node:24.22.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN NX_DAEMON=false npx nx build portal --skip-nx-cache

FROM nginx:1.31.8-alpine
ENV API_ORIGIN=http://localhost:8081
COPY nginx/ /etc/nginx/templates/
COPY --from=build /app/dist/apps/portal/browser /usr/share/nginx/html
```

| Đo | |
|---|---|
| Build lần đầu | 26 giây (`npm ci` 15 giây, `nx build` 6,7 giây); image 65,3 MB, **không có Node** |
| Context | 1,09 MB; **thiếu `.dockerignore`: 494,79 MB**, gửi 7,4 giây |

---

## SPA fallback, nhưng không phải cho mọi thứ

```nginx
location ~* "-[A-Za-z0-9_-]{8}\.(js|css|woff2?)$" {   # có hash
  add_header Cache-Control "public, max-age=31536000, immutable" always;
  try_files $uri =404;
}
location ~ "\.[A-Za-z0-9]+$" {                         # file không hash
  add_header Cache-Control "no-cache" always;
  try_files $uri =404;
}
location / {                                           # đường dẫn của router
  try_files $uri /index.html;
}
```

<div class="bad">Fallback cho cả file thiếu: chunk của bản cũ nhận <code>index.html</code> (200, text/html) → trình duyệt báo lỗi MIME, khó đoán ra nguyên nhân.</div>

---

## Cache theo loại file

| File | Cache | Vì sao |
|---|---|---|
| `main-*.js`, `chunk-*.js`, `styles-*.css`, font trong `media/` | 1 năm, `immutable` | Nội dung đổi thì tên đổi |
| `index.html` | `no-cache` (hỏi lại, ETag) | Danh sách file của bản mới |
| `config.json`, `i18n/*.json`, `themes/*.css`, `theme-init.js` | `no-cache` | Không có hash |

- Sửa xong: tab **mở sau** khi phát hành nhận ngay `main-*.js` mới
- Tab **đang mở** từ trước vẫn xin chunk cũ → 404 (đã đo). Cách xử lý: giữ file bản trước thêm một thời gian, hoặc bắt lỗi tải chunk rồi tải lại trang

<div class="tip">Bẫy: <code>try_files ... /index.html</code> chuyển <b>nội bộ</b> sang <code>/index.html</code>, nginx chọn lại location. <code>add_header</code> đặt trong <code>location /</code> không bao giờ có tác dụng.</div>

---

## Header bảo mật

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self';
  style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;
  connect-src 'self' ${API_ORIGIN}; frame-ancestors 'none'; base-uri 'self';
  form-action 'self'; object-src 'none'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

- `add_header` trong `location` **ghi đè** toàn bộ `add_header` của `server` → để trong file riêng, `include` vào từng location
- `frame-ancestors` (chống nhúng iframe) chỉ có hiệu lực qua **header**, không qua thẻ meta
- `connect-src` phải có API (và máy chủ SSO nếu dùng OIDC): sai là trình duyệt chặn đăng nhập
- `style-src 'unsafe-inline'`: Angular, ng-zorro chèn `<style>` lúc chạy

---

## CSP làm vỡ trang: đọc console

```
Executing inline script violates the following Content Security Policy directive
'script-src 'self''. Either the 'unsafe-inline' keyword, a hash ('sha256-DSlWo+...')
```

| Script inline | Do đâu | Bị chặn thì |
|---|---|---|
| Đặt theme trước khi vẽ | `index.html` | Nháy nền khi mở ở chế độ tối |
| `link[data-beasties-media]` → `media=all` | Build (inline critical CSS) | `styles-*.css` kẹt `media=print`: mất style |

Cách sửa trong đáp án: **không còn script inline**
- Script theme ra `public/theme-init.js`; `optimization.styles.inlineCritical: false`
- Kết quả: 0 lỗi console, đủ style, chế độ tối đúng

<p class="small">Cách khác: <code>security.autoCsp</code> (hash trong thẻ meta), schema Angular 22 ghi còn experimental. Không thêm <code>'unsafe-inline'</code> cho script.</p>

---

## Build một lần, triển khai nhiều môi trường

| | Thuộc về | Cách đưa vào |
|---|---|---|
| `main-*.js`, `version.json` | **Image** (artifact) | Build lúc CI, `ARG APP_VERSION`, `ARG GIT_COMMIT` |
| `config.json` (tên môi trường, `apiUrl`) | **Môi trường** | Mount lúc chạy |
| `API_ORIGIN` (CSP) | **Môi trường** | Biến môi trường, nginx thay vào template |

- Cùng image `sha256:692389d3…`, mount config "STAGING" → header hiện `STAGING`
- `ARG` đặt **sau** bước build: đổi version thì `nx build` **CACHED**, chỉ ghi lại `version.json` (0,1 giây)

<div class="bad">Build lại cho từng môi trường = bản đã test không phải bản lên production.</div>

---

## Quan sát lỗi theo release

```ts
class ReleaseErrorHandler extends ErrorHandler {
  override handleError(error: unknown) {
    console.error(`[care-portal ${this.release.version} ${this.release.commit}]`, error);
  }
}
```

Bản 1.1.0 trên môi trường thật:

```
[care-portal 1.1.0 ab11baa] TypeError: Cannot read properties of undefined (reading 'hotline')
```

- Lọc lỗi theo version: lỗi **mới** sau phát hành hay lỗi cũ?
- Dự án thật gửi lỗi tới hệ thống quan sát (Sentry, Elastic APM...) với trường `release`
- Dev server không có `version.json` (trả `index.html`): đọc lỗi thì về `dev`, không làm hỏng khởi động

---

## Smoke test sau triển khai

`BASE_URL=http://localhost:8090 EXPECTED_VERSION=1.0.0 npx playwright test -c apps/portal-e2e/playwright.smoke.config.mts`

<div class="cols">
<div>

Kiểm (6 test, khoảng 2 giây):
- Deep link trả `index.html`
- File thiếu trả **404**
- Cache theo loại file
- Header bảo mật (cả deep link)
- `version.json` đúng version, có commit
- Đăng nhập, thấy bảng, **0 lỗi console**

</div>
<div>

| Phá | Smoke đỏ |
|---|---|
| Bỏ fallback | 4 |
| File thiếu → `index.html` | 1 |
| Bỏ header ở 1 location | 1 |
| Cache `index.html` 1 năm | 1 |
| Trả script inline | 1 |
| Thiếu `API_ORIGIN` | 1 |
| Quên `GIT_COMMIT` | 1 |

</div>
</div>

---

## Pipeline

```
PR:            npm ci → nx affected -t lint test build
main, tag v*:  npm ci → nx run-many -t lint test build
               → build image (version = tag | 0.0.0-main.<commit>)
               → compose up -d --wait (postgres + api + web)
               → smoke (EXPECTED_VERSION) → lưu / đẩy image ĐÃ QUA smoke
```

- GitHub Actions: `.github/workflows/ci.yml` · GitLab: `.gitlab-ci.yml` (job image trên runner có Docker)
- Smoke chạy trên **chính image** sẽ phát hành, không build lại
- Lưu artifact có version (`docker save`, registry): rollback cần bản cũ **còn đó**

<p class="small">Chạy thử job image trên máy: build web 2 giây (cache), <code>up --wait</code> 20 giây, smoke 6/6. Chưa chạy trên máy chủ CI thật.</p>

---

## Bản 1.1.0: gate xanh, môi trường đỏ

Tính năng: hiện tổng đài trên header, cần trường mới `support.hotline` trong `config.json`.

| | |
|---|---|
| PR | Sửa `apps/portal/public/config.json` (file dev), test thêm `support` → gate **xanh 16 project** |
| Môi trường | `config.json` mount chưa có `support` |
| Kết quả | Đăng nhập xong **trang trắng**; smoke 5 xanh, 1 đỏ |

Release checklist bắt được nếu có dòng: **"Cấu hình môi trường đã duyệt"**.

Sửa tiến (1.1.1): cấu hình đi trước code, **hoặc** code chịu được cấu hình cũ (`config.support?.hotline`), an toàn hơn vì rollback không phụ thuộc thứ tự đổi cấu hình.

---

## Rollback

```bash
WEB_VERSION=1.0.0 docker compose -f infra/docker-compose.yml --profile web up -d --no-build web
BASE_URL=http://localhost:8090 EXPECTED_VERSION=1.0.0 npx playwright test -c apps/portal-e2e/playwright.smoke.config.mts
```

| Đo (diễn tập) | |
|---|---|
| Đổi image đến khi `/version.json` = 1.0.0 | 0,4 giây |
| Smoke 1.0.0 | 6/6, 2 giây |

- Rollback = chạy lại **image cũ**, không build lại từ mã nguồn
- Điều kiện kích hoạt, người quyết định, lệnh: viết **trước**, diễn tập **trước**
- Compose dừng container cũ rồi mới chạy mới: vài request lỗi. Production: blue/green hoặc rolling sau load balancer

---

## Live demo (30 phút)

1. **Bản đầu** lên nginx: deep link 404; `curl -I` xem `Cache-Control`; không header
2. **Phát hành bản mới** với cache 1 năm: tab mới vẫn chạy `main-*.js` cũ, chunk 404
3. **Thêm CSP chặt**: console 2 vi phạm, trang mất style; đọc hash, tìm script inline
4. **Bản sửa**: smoke đỏ → xanh; `index.html` `no-cache`, `main-*.js` `immutable` trong tab Network
5. **1.1.0 lỗi**: gate xanh, triển khai, trang trắng, log có version; rollback, smoke xanh

---

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Gate như CI, số đo cache, `nx affected`; Node sai phiên bản dừng ở `npm ci` | 20 |
| 2 | Budget fail (patch icon), tìm package, lint + siết budget | 15 |
| 3 | Smoke test trước; Dockerfile multi-stage, nginx fallback, cache, header, CSP | 35 |
| 4 | Một image nhiều môi trường, `version.json`, log lỗi kèm version | 25 |
| 5 | Pipeline YAML, release checklist 1.1.0, diễn tập rollback | 25 |

Sản phẩm nộp: pipeline YAML · `docs/release-checklist-1.1.0.md` · bằng chứng smoke test · `docs/quy-trinh-rollback.md`

---

## Chốt buổi

- Gate xanh ≠ triển khai đúng: **smoke test trên bản đã triển khai**
- `index.html` không cache lâu; file có hash cache 1 năm; file thiếu là **404**
- CSP chặt: không script inline; đọc console sau mỗi thay đổi
- **Một image**, cấu hình theo môi trường; version nằm trong image, có trong log lỗi
- Rollback: image cũ còn đó, lệnh viết sẵn, **đã diễn tập**

**Câu hỏi review chéo:** "Lần phát hành tới, bước nào trong pipeline của nhóm sẽ bắt được lỗi giống 1.1.0?"

**Bài tập về nhà:** `course/bai-tap-ve-nha/buoi-09-build-va-cicd.html` (khoảng 30 phút, nộp trước buổi 10)
