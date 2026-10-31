# Quy trình rollback: care-portal-web

Buổi 9. Áp dụng cho portal chạy bằng image `care-portal-web:<version>` (nginx), cấu hình môi trường mount lúc chạy.

## Nguyên tắc

- **Rollback = chạy lại image của version trước**, không build lại từ mã nguồn. Build lại có thể ra kết quả khác (dependency, base image) và mất nhiều phút.
- Image của version đang chạy và **ít nhất một version trước** phải còn sẵn (registry hoặc máy chủ). Không `docker image prune -a` trên máy chủ triển khai.
- `config.json` là của môi trường, không theo image: rollback image **không** đổi cấu hình. Nếu bản mới cần cấu hình mới, cấu hình đó phải tương thích với bản cũ (xem `release-checklist-1.1.0.md`).
- Mỗi lần phát hành và rollback đều chạy smoke test với `EXPECTED_VERSION`: smoke xanh mới tính là xong.

## Các bước

```bash
# 1. Xác định version đang chạy và version sẽ quay về
curl -s http://localhost:8090/version.json
docker image ls care-portal-web

# 2. Đổi image (không build)
WEB_VERSION=1.0.0 docker compose -f infra/docker-compose.yml --profile web up -d --no-build web

# 3. Smoke test trên version vừa quay về
cd frontend
BASE_URL=http://localhost:8090 EXPECTED_VERSION=1.0.0 npx playwright test -c apps/portal-e2e/playwright.smoke.config.mts

# 4. Ghi lại: thời điểm, version, lý do, kết quả smoke (release checklist)
```

Image không còn trên máy nhưng có artifact của CI: tải `care-portal-web-<version>.tar.gz` rồi `gunzip -c ... | docker load`.

## Số đo diễn tập (2026-10-31, máy Apple Silicon, backend riêng)

| Bước | Thời gian |
|---|---|
| `up -d --no-build web` đến khi `/version.json` trả 1.0.0 | 0,4 giây |
| Smoke test 1.0.0 (6 test) | 2 giây |

Trong lúc đổi container có vài request bị `ERR_CONNECTION_RESET`: compose dừng container cũ rồi mới chạy container mới.
Môi trường thật cần hai bản chạy song song sau load balancer (blue/green, rolling) để không gián đoạn.

## Giới hạn đã biết

Tab trình duyệt **đang mở từ trước khi đổi version** vẫn giữ `main-*.js` cũ trong bộ nhớ. Khi bấm sang trang chưa tải, nó xin chunk
của bản cũ, máy chủ (bản mới) trả 404: `Failed to fetch dynamically imported module`. Cache đúng (`index.html` `no-cache`) chỉ giúp tab mở **sau**
khi đổi. Cách xử lý: giữ file của bản trước thêm một thời gian, hoặc bắt lỗi tải chunk và tải lại trang.
