# Release checklist: care-portal-web 1.1.0

Buổi 9, diễn tập phát hành. Bản 1.1.0 thêm "Tổng đài hỗ trợ" trên header (`course/session-09/lab/v1.1.0-tong-dai-ho-tro.patch`).
Kết quả: **không đạt smoke test, đã rollback về 1.0.0**. Hash commit và số đo là của lần diễn tập khi soạn bài; mỗi nhóm ghi số của mình.

## Trước khi phát hành

- [x] Artifact build từ commit `ab11baa`, version trong image: `/version.json` = `{"version":"1.1.0","commit":"ab11baa"}`,
      label `org.opencontainers.image.version=1.1.0`
- [x] Gate xanh: `nx run-many -t lint test build`, 16 project (budget nằm trong build)
- [x] `npm ci` với lockfile; Node 24.22.0 (`node:24.22.0-alpine` trong Dockerfile, `engine-strict`)
- [ ] **Cấu hình môi trường (`config.json`) đã duyệt: KHÔNG.** 1.1.0 cần trường mới `support.hotline`;
      `infra/web/config.json` của môi trường chưa có. PR chỉ sửa `apps/portal/public/config.json` (file dev) nên test và dev server đều xanh.
- [x] Không có secretKey trong client
- [x] Migration dữ liệu: không có
- [x] Version trước đó (`care-portal-web:1.0.0`) còn trên máy chủ: `docker image ls care-portal-web`

## Smoke test sau triển khai

`BASE_URL=http://localhost:8090 EXPECTED_VERSION=1.1.0 npx playwright test -c apps/portal-e2e/playwright.smoke.config.mts`

| Kiểm tra | Kết quả |
|---|---|
| Deep link `/tickets?status=NEW` trả `index.html` | Đạt |
| File tĩnh không tồn tại trả 404 | Đạt |
| `index.html`, `config.json`, i18n `no-cache`; file có hash `max-age=31536000, immutable` | Đạt |
| `version.json` = 1.1.0, có commit | Đạt |
| Header bảo mật (CSP, `nosniff`, `frame-ancestors 'none'`) | Đạt |
| Mở deep link, đăng nhập, thấy danh sách phiếu, không lỗi console | **Không đạt**: sau đăng nhập trang trắng, không có dòng nào |

Lỗi trên console (đã gắn version nhờ `provideAppRelease`):

```
[care-portal 1.1.0 ab11baa] TypeError: Cannot read properties of undefined (reading 'hotline')
```

## Rollback

- **Điều kiện kích hoạt:** smoke test đỏ ở bất kỳ mục nào, hoặc lỗi mới trên kênh quan sát lỗi lọc theo version vừa phát hành.
- **Lệnh:** `WEB_VERSION=1.0.0 docker compose -f infra/docker-compose.yml --profile web up -d --no-build web`
  rồi chạy lại smoke với `EXPECTED_VERSION=1.0.0`. Chi tiết: [quy-trinh-rollback.md](quy-trinh-rollback.md).
- **Người quyết định:** trưởng nhóm phát hành (trong lớp: nhóm trưởng).
- **Đã diễn tập ngày:** 2026-10-31. Đổi image đến khi phục vụ lại `/version.json` = 1.0.0: **0,4 giây**; smoke 1.0.0: **6/6 đạt, 2 giây**.

## Sửa tiến (sau rollback)

Không phát hành lại 1.1.0. Bản 1.1.1 cần một trong hai:
1. Cập nhật `config.json` của **mọi** môi trường trước khi triển khai image mới (cấu hình đi trước code), và ghi trường mới vào checklist; hoặc
2. Code chịu được cấu hình cũ: `support` là tùy chọn (`config.support?.hotline`), không có thì không hiện tổng đài.

Cách 2 an toàn hơn: image mới chạy được với cấu hình cũ, rollback không phụ thuộc thứ tự đổi cấu hình.
