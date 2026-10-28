# Buổi 09 — Build và CI CD triển khai ứng dụng

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Trạng thái tài liệu:** đã có khung theo đề cương; chưa soạn slide, lab chi tiết, đáp án.

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Build tái lập với version và lockfile; budget, quality gate và artifact; pipeline tự động, Docker, Nginx, SPA fallback, cache, header bảo mật và quan sát lỗi theo release. |
| Use case và lab | Chạy gate như trên CI, cố ý làm budget fail, triển khai cục bộ qua Docker, kiểm tra deep link và cache, diễn tập rollback về artifact có version. |
| Sản phẩm đầu ra | Pipeline YAML, release checklist, bằng chứng smoke test và quy trình rollback. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Build tái lập: khóa phiên bản Node (`.nvmrc`), `npm ci` với lockfile, version artifact theo commit/tag.
2. Đặt quality gate: lint (gồm luật import buổi 1), test, build, budget; dùng `nx affected` để rút ngắn pipeline.
3. Đóng gói Docker multi-stage + Nginx: SPA fallback, cache (asset có hash: lâu dài; `index.html`, `config.json`: không cache), header bảo mật (CSP, `X-Content-Type-Options`, `frame-ancestors`).
4. Build một lần, triển khai nhiều môi trường bằng runtime config (`config.json`).
5. Quan sát lỗi theo release (gắn version vào log/lỗi), smoke test sau triển khai, rollback về artifact có version.

## Use case trên Care Portal

- Mở rộng job `architecture` của buổi 1 (`.github/workflows/ci.yml`) thành pipeline đầy đủ: lint → test → build → budget → image.
- Thêm một thư viện lớn vào bundle ban đầu để **budget fail**; đọc báo cáo, sửa bằng lazy/defer.
- Image `care-portal-web:<version>` chạy Nginx; mở trực tiếp `http://localhost:8080/tickets?status=NEW` (deep link) phải ra đúng trang.
- Triển khai bản lỗi `v1.1.0`, smoke test phát hiện, rollback về `v1.0.0` trong vài phút.

## Dự kiến lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Chạy gate như CI ở máy (`npm ci`, lint, test, build), đọc thời gian và cache | 20 |
| 2 | Cố ý làm budget fail, đọc báo cáo, sửa | 15 |
| 3 | Dockerfile multi-stage + `nginx.conf`: SPA fallback, cache, header bảo mật | 35 |
| 4 | Triển khai cục bộ, kiểm tra deep link, cache (tab Network), `config.json` theo môi trường | 25 |
| 5 | Pipeline YAML, release checklist, diễn tập rollback về artifact có version | 25 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Job CI từ buổi 1 | `.github/workflows/ci.yml` (trong `session-01/solution/bai3-5-ticket-port.patch`) |
| Budget | `frontend/apps/portal/project.json` |
| Runtime config | `frontend/apps/portal/src/main.ts`, `apps/portal/public/config.json`, `session-01/solution/mo-rong-runtime-config.patch` |
| Docker hiện có | `infra/docker-compose.yml`, `backend/Dockerfile` |

## Cần chuẩn bị trước khi soạn chi tiết

- [ ] Hỏi VNPT: GitLab CI hay hệ thống khác, có registry image nội bộ không. Chuẩn bị pipeline cả GitHub Actions và GitLab CI.
- [ ] `frontend/Dockerfile` + `frontend/nginx.conf` mẫu (chưa có trong repo).
- [ ] Hai tag/version để diễn tập rollback.
- [ ] Mẫu release checklist: `course/_templates/release-checklist.md`.

## Tài liệu

| | |
|---|---|
| Slide | `slides/` (chưa soạn) |
| Lab | `lab/` (chưa soạn) |
| Đáp án | `solution/` (chưa soạn) |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) |
| Bài tập về nhà | `../bai-tap-ve-nha/buoi-09-<chu-de>.html` (chưa soạn) |
