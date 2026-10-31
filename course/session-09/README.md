# Buổi 09 — Build và CI/CD triển khai ứng dụng

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Điểm bắt đầu:** `git checkout session09-start` · **Đáp án:** 5 patch trong `solution/`, bản đầy đủ ở nhánh `session09-end`

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Build tái lập với version và lockfile; budget, quality gate và artifact; pipeline tự động, Docker, Nginx, SPA fallback, cache, header bảo mật và quan sát lỗi theo release. |
| Use case và lab | Chạy gate như trên CI, cố ý làm budget fail, triển khai cục bộ qua Docker, kiểm tra deep link và cache, diễn tập rollback về artifact có version. |
| Sản phẩm đầu ra | Pipeline YAML, release checklist, bằng chứng smoke test và quy trình rollback. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Build tái lập: khóa phiên bản Node (`.nvmrc`, `engines` + `engine-strict`), `npm ci` theo lockfile, build trong container.
2. Đặt quality gate: lint (gồm luật import), test, build, budget; dùng `nx affected` để rút ngắn pipeline của PR.
3. Đóng gói Docker multi-stage + Nginx: SPA fallback, cache đúng loại file, header bảo mật (CSP, `nosniff`, `frame-ancestors`).
4. Build một lần, triển khai nhiều môi trường: `config.json` mount lúc chạy, version nằm trong image.
5. Quan sát lỗi theo release (log có version + commit), smoke test sau triển khai, rollback về image có version.

## Use case trên Care Portal

Portal chạy tốt với `npm start`. Đồng nghiệp viết "bản đầu" để đưa lên máy chủ (có sẵn ở `session09-start`): build trên máy mình, chép `dist`
vào `nginx:alpine`, cấu hình cache 1 năm "cho nhanh". Đo trên image đó (`http://localhost:8090`, backend thật):

| Hiện tượng | Đo được |
|---|---|
| Gửi link `/tickets?status=NEW` cho đồng nghiệp, hoặc F5 ở trang phiếu | **404** của nginx (`/` thì vẫn mở được) |
| Cache | `/`, `index.html`, `config.json` đều `Cache-Control: max-age=31536000` |
| Phát hành bản mới, người dùng mở tab mới | Vẫn chạy `main-LEVGUPEU.js` của bản cũ (máy chủ đã là `main-H62PDXC7.js`). Đăng nhập xong: `chunk-D2HgOIw5.js` **404**, `Failed to fetch dynamically imported module`, đứng ở trang đăng nhập |
| Header bảo mật | Không có CSP, `X-Content-Type-Options`, `frame-ancestors` |
| Thêm CSP chặt (`script-src 'self'`) cho "an toàn" | 2 vi phạm CSP (script inline đặt theme, script của beasties) → `styles-*.css` kẹt `media=print`: form lọc, menu mất style |

Thêm hai tình huống dùng trong lab:
- **Budget:** "đăng ký hết icon cho tiện" ([lab/dang-ky-tat-ca-icon.patch](lab/dang-ky-tat-ca-icon.patch)): lint, test xanh; build đỏ vì
  bundle ban đầu 1,39 MB → 2,06 MB (`@ant-design/icons-angular` 44,2 kB → 766,5 kB, 848 icon).
- **Bản phát hành lỗi** ([lab/v1.1.0-tong-dai-ho-tro.patch](lab/v1.1.0-tong-dai-ho-tro.patch)): thêm tổng đài trên header, cần trường mới
  `support.hotline` trong `config.json`. Gate xanh 16 project. Triển khai lên môi trường chưa có trường đó: đăng nhập xong **trang trắng**,
  console `[care-portal 1.1.0 ab11baa] TypeError: Cannot read properties of undefined (reading 'hotline')`. Smoke đỏ → rollback về 1.0.0 trong **0,4 giây**.

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Chạy gate như CI (`npm ci`, lint, test, build), đọc thời gian, cache, `nx affected`; khóa phiên bản Node | 20 |
| 2 | Cố ý làm budget fail, đọc báo cáo, tìm package gây phình; thêm hàng rào ở lint, siết budget | 15 |
| 3 | Dockerfile multi-stage + nginx: SPA fallback, cache, header bảo mật, CSP không vỡ trang; smoke test đỏ → xanh | 35 |
| 4 | Một image nhiều môi trường (`config.json` mount, `API_ORIGIN`), `version.json` trong image, log lỗi kèm version | 25 |
| 5 | Pipeline YAML (GitHub Actions + GitLab CI), release checklist, diễn tập rollback 1.1.0 → 1.0.0 | 25 |

## Liên kết code

| Khái niệm | File |
|---|---|
| "Bản đầu" cần sửa | `frontend/Dockerfile`, `frontend/nginx.conf`, service `web` trong `infra/docker-compose.yml` (cổng 8090) |
| Budget | `frontend/apps/portal/project.json` (`configurations.production.budgets`) |
| Runtime config | `frontend/apps/portal/src/main.ts`, `libs/shared/util-config/src/lib/app-config.ts`, `apps/portal/public/config.json` |
| Script inline trong `index.html` | `frontend/apps/portal/src/index.html` (đặt theme trước khi Angular chạy) |
| Pipeline từ buổi 1 | `.github/workflows/ci.yml` |
| Mẫu release checklist | `course/_templates/release-checklist.md` |
| Đáp án | `frontend/Dockerfile`, `frontend/.dockerignore`, `frontend/nginx/*.template`, `apps/portal-e2e/src/smoke/deploy.smoke.ts`, `libs/shared/util-config/src/lib/app-release.ts`, `.github/workflows/ci.yml`, `.gitlab-ci.yml`, `docs/release-checklist-1.1.0.md`, `docs/quy-trinh-rollback.md` |

## Đã chuẩn bị ở `session09-start`

- Đáp án buổi 8 đã áp (`session08-end`).
- `frontend/Dockerfile` + `frontend/nginx.conf` "bản đầu" (lỗi cố ý: build ngoài container, không SPA fallback, cache 1 năm mọi file, không header bảo mật).
- `infra/docker-compose.yml`: service `web` (profile `web`, cổng **8090** vì 8080 hay bị Jenkins/Tomcat chiếm, image `care-portal-web:${WEB_VERSION}`);
  `api` nhận thêm origin `http://localhost:8090` (`CORS_ORIGINS`).
- `.github/workflows/ci.yml`: comment tiếng Việt có dấu (khớp `main`).
- Không đổi backend, không migration mới. Không có smoke test (học viên viết ở Bài 3).

## Tài liệu

| | |
|---|---|
| Slide | [slides/slides.md](slides/slides.md) (nguồn Marp) · `buoi-09-build-va-cicd.pptx` · `buoi-09-build-va-cicd.pdf` |
| Lab | [lab/README.md](lab/README.md) · [lab/dang-ky-tat-ca-icon.patch](lab/dang-ky-tat-ca-icon.patch) · [lab/v1.1.0-tong-dai-ho-tro.patch](lab/v1.1.0-tong-dai-ho-tro.patch) |
| Đáp án | [solution/README.md](solution/README.md) + 5 file `.patch` |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) · [note-cho-giang-vien.md](note-cho-giang-vien.md) |
| Bài tập về nhà | [../bai-tap-ve-nha/buoi-09-build-va-cicd.html](../bai-tap-ve-nha/buoi-09-build-va-cicd.html) |

## Sửa slide

```bash
cd course/session-09/slides
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-09-build-va-cicd.pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-09-build-va-cicd.pdf
```
