# Chuẩn bị môi trường (làm TRƯỚC buổi 1)

Khóa học tập trung vào **Angular**. Backend và cơ sở dữ liệu đã đóng gói sẵn trong Docker, bạn không cần cài Java hay biết Spring.

Mất khoảng 15–20 phút, chủ yếu là thời gian tải. Hãy làm trước buổi học, vì mạng lớp học không đủ để 30 người cùng tải.

## 1. Cài 3 thứ

| Công cụ | Phiên bản | Kiểm tra |
|---|---|---|
| Git | bất kỳ | `git --version` |
| Docker Desktop (Windows: bật WSL 2) | 4.x trở lên | `docker compose version` |
| Node.js | **24.x** (tối thiểu 22.22) | `node -v` |

Thêm **VS Code** với các extension: Angular Language Service, Nx Console, ESLint, Prettier.

> Nên cài Node qua `nvm` (macOS/Linux) hoặc `nvm-windows` / `fnm` (Windows). Repo có `frontend/.nvmrc`, chạy `nvm use` là đúng phiên bản.

## 2. Chạy dự án — 2 lệnh

```bash
git clone <URL repo do giảng viên cung cấp> angular-advance-course
cd angular-advance-course

# Backend + cơ sở dữ liệu (lần đầu mất 3–5 phút để build, những lần sau khoảng 10 giây)
docker compose -f infra/docker-compose.yml up -d

# Frontend
cd frontend
nvm use
npm ci
npm start
```

Mở http://localhost:4200 và đăng nhập `agent1` / `agent1`.

## 3. Kiểm tra (đủ 3 ô là sẵn sàng)

- [ ] http://localhost:4200: đăng nhập `agent1`/`agent1`, thấy danh sách thuê bao (200.000 kết quả)
- [ ] http://localhost:8081/swagger-ui.html hiện danh sách API
- [ ] Trong `frontend/`, chạy `npx nx run-many -t lint test` báo **Successfully**

Chụp màn hình 3 ô trên gửi giảng viên trước buổi học.

## Tài khoản mẫu

| User / mật khẩu | Vai trò |
|---|---|
| `agent1` / `agent1` | Nhân viên CSKH |
| `supervisor1` / `supervisor1` | + Khóa/mở khóa thuê bao |
| `admin1` / `admin1` | + App quản trị http://localhost:4300 (`npm run start:admin`) |

## Lệnh Docker hay dùng

```bash
docker compose -f infra/docker-compose.yml ps          # xem trạng thái
docker compose -f infra/docker-compose.yml logs api    # xem log backend
docker compose -f infra/docker-compose.yml down        # tắt (giữ dữ liệu)
docker compose -f infra/docker-compose.yml down -v     # tắt + xóa dữ liệu, lần sau up sẽ về dữ liệu gốc
```

## Mạng công ty có proxy

```bash
npm config set proxy http://proxy.cong-ty:8080
npm config set https-proxy http://proxy.cong-ty:8080
# hoặc dùng registry nội bộ (Nexus/Artifactory) nếu có
npm config set registry https://nexus.cong-ty/repository/npm/
```

Docker Desktop: Settings → Resources → Proxies.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| `The Angular CLI requires a minimum Node.js version` | Đang dùng Node cũ. Chạy `nvm use` trong `frontend/` |
| `port is already allocated` (5433, 8081, 8088) | Có dịch vụ khác đang chiếm port. Tắt dịch vụ đó hoặc đổi port trong `infra/docker-compose.yml` |
| Đăng nhập báo "Không đăng nhập được" | Backend chưa sẵn sàng. Chạy `docker compose -f infra/docker-compose.yml ps`, đợi `api` báo `healthy` |
| Lần đầu `up` rất lâu hoặc lỗi tải Maven | Đang build backend, cần internet. Nếu có proxy, cấu hình proxy cho Docker như trên |
| Không cài được Docker trên máy công ty | Báo giảng viên: lớp sẽ có một máy chủ chung chạy backend. Bạn chỉ cần sửa `apiUrl` trong `frontend/apps/portal/public/config.json` |

Chi tiết về cơ sở dữ liệu: [database.md](database.md).

## Chuẩn bị thêm cho các buổi sau

- **Buổi 7 (SSO):** cần thêm Keycloak chạy trong Docker (profile `sso`, không cài gì thêm vào máy). Giảng viên sẽ gửi lệnh tải image trước buổi 7, để không phải tải trong lớp.
- **Buổi 7 (E2E):** tải trình duyệt cho Playwright: `cd frontend && npx playwright install chromium`.
