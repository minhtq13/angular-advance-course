# Buổi 09 — Ghi chú giảng viên

## Trước buổi học

**Vài ngày trước:**
- **Hỏi VNPT:** GitLab CI hay hệ thống khác; runner có Docker không; registry image nội bộ (Harbor, Nexus); proxy cho `npm ci` và `docker pull`.
  Lab chạy được không cần CI thật (mọi bước chạy trên máy), nhưng Bài 5 nên viết YAML cho hệ thống đơn vị dùng.
- Nhắc học viên tải trước image (mạng lớp hay chậm): `docker pull node:24.22.0-alpine nginx:1.31.8-alpine nginx:alpine node:20-alpine`.
- Cổng **8090** cho portal trong nginx (8080 hay bị Jenkins/Tomcat chiếm). Máy nào bận 8090: đổi cổng và thêm origin vào `CORS_ORIGINS`.
- Thu `docs/ai-review-pr-bo-loc-loai-yeu-cau.md`, `docs/bao-cao-nang-suat-ai.md` của buổi 8.

**Ngày học:**
- [ ] `git checkout session09-start`
- [ ] `docker compose -f infra/docker-compose.yml up -d` (api được tạo lại vì thêm origin 8090)
- [ ] `cd frontend && npm ci && npx nx build portal && docker compose -f ../infra/docker-compose.yml --profile web up -d --build web`
- [ ] `curl -sI localhost:8090/tickets | head -1` → `HTTP/1.1 404 Not Found` (bản đầu); `curl -sI localhost:8090/ | grep -i cache` → `max-age=31536000`
- [ ] Image cho demo bước 2 (hai bản khác hash, cùng "bản đầu"): `git checkout session08-start && (cd frontend && npx nx build portal)`;
      `git checkout session09-start` (giữ nguyên `dist`), `docker build -t care-portal-web:demo-a frontend`;
      `(cd frontend && npx nx build portal)`, `docker build -t care-portal-web:demo-b frontend`
- [ ] Nhánh đáp án dựng sẵn image `1.0.0` và `1.1.0` cho demo bước 5 (lệnh ở kịch bản demo); kiểm `docker image ls care-portal-web`
- [ ] Chrome: DevTools Network (tắt "Disable cache" để thấy cache thật), Console

## Timeline (4 giờ)

| Thời gian | Nội dung | Slide | Ghi chú |
|---|---|---|---|
| 0:00–0:20 | Review buổi 8, use case | 1–5 | Slide 5: hỏi lớp "Đã bao giờ F5 ra 404 trên server thật?" trước khi chiếu bảng |
| 0:20–1:00 | Khái niệm | 6–19 | Build tái lập, gate, budget (6–8) · Docker, fallback, cache, header, CSP (9–13) · runtime config, version, smoke, pipeline, 1.1.0, rollback (14–19) |
| 1:00–1:30 | Live demo | 20 | 5 bước |
| 1:30–1:40 | **Nghỉ** | | |
| 1:40–3:40 | **Lab** 5 bài | 21 | Mốc nhắc: 2:00 sang Bài 2, 2:15 sang Bài 3, 2:50 sang Bài 4, 3:15 sang Bài 5 |
| 3:40–4:00 | Review chéo, chốt | 22 | Câu hỏi chốt trên slide 22; giao bài tập về nhà |

## Kịch bản demo

1. **Bản đầu (5 phút).** Trình duyệt `localhost:8090` → đăng nhập → Phiếu yêu cầu: chạy. Copy URL `/tickets?status=NEW`, mở tab mới: 404 nginx.
   `curl -sI localhost:8090/ | grep -iE "cache|expires"`; `curl -sI localhost:8090/ | grep -i content-security` (rỗng).
2. **Kẹt bản cũ (7 phút).** `WEB_VERSION=demo-a docker compose -f infra/docker-compose.yml --profile web up -d --no-build web`, đăng nhập, đóng tab.
   Đổi sang `WEB_VERSION=demo-b` (cùng lệnh). Mở tab mới `localhost:8090`:
   Sources/Network: `main-*.js` vẫn là tên của `demo-a` (cột Size: disk cache). Đăng nhập: console `Failed to fetch dynamically imported module ... 404`.
3. **CSP chặt (5 phút).** Thêm vào `nginx.conf` dòng `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:8081" always;`
   (đặt trong `location /`), build lại. Chế độ tối, mở `/` rồi vào Phiếu yêu cầu (bản đầu chưa có fallback): form, menu mất style; console 2 vi phạm có hash. Elements: `link[rel=stylesheet][media=print]`.
4. **Bản sửa (6 phút).** `git checkout session09-end`, `WEB_VERSION=1.0.0 GIT_COMMIT=$(git rev-parse --short HEAD) docker compose -f infra/docker-compose.yml --profile web build web`,
   `up -d web`. Smoke: `cd frontend && BASE_URL=http://localhost:8090 EXPECTED_VERSION=1.0.0 npx playwright test -c apps/portal-e2e/playwright.smoke.config.mts`.
   Network: `index.html` `no-cache` (304 khi tải lại), `main-*.js` `immutable`.
5. **1.1.0 và rollback (7 phút).** Trên nhánh tạm: `git apply course/session-09/lab/v1.1.0-tong-dai-ho-tro.patch` (lấy file từ `main` nếu cần), commit,
   build `WEB_VERSION=1.1.0`, `up -d web`. Đăng nhập: trang trắng; console `[care-portal 1.1.0 <commit>] TypeError ... 'hotline'`. Smoke: 1 đỏ.
   Rollback: `WEB_VERSION=1.0.0 docker compose -f infra/docker-compose.yml --profile web up -d --no-build web`, smoke xanh. Bấm giờ trước lớp.

## Điểm cần nhấn mạnh

- Bản đã test phải là bản lên production: **build một lần**, cấu hình theo môi trường lúc chạy, version nằm trong image.
- Budget là gate, không phải cảnh báo để bỏ qua; ngưỡng phải sát mức hiện tại.
- Cache sai còn tệ hơn không cache: `index.html` cache lâu thì người dùng kẹt ở bản cũ; fallback cho file thiếu thì lỗi khó đoán.
- Đọc console sau mỗi thay đổi header: CSP chặn mà trang "trông như chạy" là chuyện thường.
- Rollback phải được diễn tập trước khi cần đến nó; image cũ phải còn đó.

## Câu hỏi học viên hay hỏi

| Câu hỏi | Gợi ý trả lời |
|---|---|
| Sao không để `apiUrl` rỗng và cho nginx proxy `/api` tới backend? | Tốt hơn trong nhiều trường hợp: cùng origin, không CORS, `connect-src 'self'` đủ. Code đã hỗ trợ `apiUrl` rỗng (`api-url.ts`). Lab giữ `apiUrl` tuyệt đối để thấy rõ cấu hình theo môi trường; ghi lựa chọn vào ADR |
| `autoCsp` của Angular có dùng được không? | Có, sinh hash cho script inline trong thẻ meta. Schema Angular 22 ghi còn experimental; thẻ meta không đặt được `frame-ancestors` nên vẫn cần header. Ghép hai CSP thì trình duyệt áp **cả hai** (giao), dễ khó hiểu |
| Bỏ `inlineCritical` có chậm không? | Mất phần CSS quan trọng chèn sẵn trong `index.html`, trang tải `styles-*.css` trước khi vẽ. App nội bộ sau đăng nhập: chấp nhận được; đo bằng Lighthouse nếu cần (buổi 5) |
| `max-age=0` với `no-cache` khác gì? | `no-cache`: được lưu nhưng phải hỏi lại máy chủ (ETag → 304). `no-store`: không lưu. Với `index.html`, `no-cache` là đủ và vẫn tiết kiệm băng thông |
| Tab đang mở lúc phát hành thì sao? | Vẫn có thể 404 chunk cũ. Giữ file của bản trước (CDN, volume chung) hoặc bắt lỗi tải chunk rồi tải lại trang; ghi trong `docs/quy-trinh-rollback.md` |
| Sao không tag image `latest`? | `latest` không cho biết đang chạy bản nào và rollback về đâu. Mỗi image một version, trùng với `version.json` |
| CI của đơn vị không có Docker? | Gate (lint, test, build) chạy được với image Node; build image và smoke cần runner có Docker (hoặc Kaniko/Buildah) |

## Lỗi thường gặp khi làm lab

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `docker build` bản đầu báo `"/dist/apps/portal/browser": not found` | Chưa build trên máy | `npx nx build portal` rồi build lại |
| Portal trong nginx đăng nhập báo lỗi kết nối, console `CORS` | `api` chưa nhận origin 8090 (container cũ) | `docker compose -f infra/docker-compose.yml up -d api` |
| Console `Refused to connect ... connect-src` | `API_ORIGIN` không khớp `apiUrl` trong `config.json` | Sửa biến môi trường của `web` |
| Đổi `nginx/*.template` không có tác dụng | Template nằm trong image | Build lại image, hoặc mount thư mục template khi thử |
| `add_header` trong `location /` không thấy trên response | `try_files ... /index.html` chuyển nội bộ, location khác phục vụ | Đặt header ở location của file `index.html` (đáp án Bài 3) |
| Smoke "version.json" đỏ dù đúng image | Quên `GIT_COMMIT` hoặc `EXPECTED_VERSION` | Truyền đủ khi build và khi chạy smoke |
| Rollback xong vẫn thấy 1.1.0 | `up -d` không có `--no-build` và còn `WEB_VERSION` cũ trong shell | `echo $WEB_VERSION`; dùng đúng lệnh trong `docs/quy-trinh-rollback.md` |
