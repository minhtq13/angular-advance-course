# Care Portal — Angular Advanced Course

Dự án mẫu xuyên suốt cho khóa **Angular nâng cao (10 buổi)**: hệ thống chăm sóc khách hàng và quản lý thuê bao
(nghiệp vụ viễn thông). Mỗi buổi học dùng một phần của dự án làm demo và lab.

| Thành phần | Công nghệ |
|---|---|
| Frontend | Angular 22, Nx 24, ng-zorro-antd 22, NgRx 22, RxJS 7, Transloco (vi/en), Vitest, Playwright |
| Backend | Spring Boot 3.5, Java 21, Spring Security (JWT), JPA, Flyway, MapStruct, springdoc, Testcontainers |
| Hạ tầng | Docker Compose: PostgreSQL 16, API, Adminer. Tùy chọn: Redis 7 |

## Chạy nhanh

Học viên chỉ cần **Node 24 + Docker**. Xem [course/setup/environment.md](course/setup/environment.md).

```bash
docker compose -f infra/docker-compose.yml up -d    # DB (có sẵn dữ liệu) + API :8081 + Adminer :8088
cd frontend && npm ci && npm start                  # portal http://localhost:4200
```

Đăng nhập: `agent1` / `agent1` (hoặc `supervisor1`, `admin1`; mật khẩu trùng tên đăng nhập).
Giao diện mặc định tiếng Việt và theo chế độ sáng/tối của hệ điều hành. Đổi bằng nút **VI | EN** và **Sáng / Tối / Theo hệ thống**
ở header (điện thoại: trong menu tài khoản) hoặc trang đăng nhập; lựa chọn được ghi nhớ.

| Địa chỉ | Nội dung |
|---|---|
| http://localhost:4200 | Portal CSKH |
| http://localhost:4300 | Admin (`npm run start:admin`, đăng nhập `admin1`) |
| http://localhost:8081/swagger-ui.html | Tài liệu API |
| http://localhost:8088 | Adminer, xem DB ([course/setup/database.md](course/setup/database.md)) |

## Xác thực

Dùng JWT do chính backend phát, không cần máy chủ đăng nhập riêng:

1. Trang `/login` gửi `POST /api/auth/login` → backend kiểm tra mật khẩu (bcrypt) và trả về access token + refresh token (JWT, ký HS256).
2. Frontend gắn `Authorization: Bearer <access token>` vào mọi request tới API (interceptor).
3. Backend kiểm tra signature, hạn dùng và role trong claim `roles` của token; refresh token không dùng để gọi API được.

Hai app `portal` và `admin` đăng nhập riêng (token lưu trong `sessionStorage` của từng app).

Buổi 7 (SSO) bổ sung Keycloak chạy cục bộ dưới Docker profile tùy chọn `sso`; các buổi khác không cần Keycloak.

## Cấu trúc repo

```
frontend/   Nx workspace (xem frontend/README.md)
backend/    Spring Boot API (Dockerfile build sẵn, học viên không cần cài JDK)
infra/      docker-compose, dump dữ liệu mẫu
course/     Tài liệu khóa học: slide, lab, đáp án, ghi chú giảng viên theo từng buổi (xem course/README.md)
docs/adr/   Architecture Decision Records của dự án
```

## Dành cho người phát triển dự án

Phát triển backend ngoài Docker (cần JDK 21):

```bash
docker compose -f infra/docker-compose.yml up -d postgres
cd backend && ./mvnw spring-boot:run
```

> Nếu mở backend bằng VS Code, extension Java tự build vào `target/classes`. `pom.xml` đã bật
> `m2e.apt.activation=jdt_apt` để IDE chạy MapStruct; nếu vẫn gặp lỗi `No qualifying bean of type ...Mapper`,
> chạy `./mvnw clean package` khi đã đóng VS Code.

Sau khi build lại code backend: `docker compose -f infra/docker-compose.yml up -d --build api`.

Tăng lượng dữ liệu (buổi 5): tạm bỏ dump để Flyway tự seed với số lượng lớn hơn.

```bash
docker compose -f infra/docker-compose.yml down -v
mv infra/db/init/01-care.sql.gz /tmp/
docker compose -f infra/docker-compose.yml up -d postgres
cd backend && SEED_SUBSCRIBERS=2000000 SEED_TICKETS=500000 ./mvnw spring-boot:run
mv /tmp/01-care.sql.gz ../infra/db/init/        # trả dump về chỗ cũ
```

Kiểm tra:

```bash
cd backend && ./mvnw test                         # integration test với Testcontainers (cần Docker)
cd frontend && npx nx run-many -t lint test build
cd frontend && npx nx e2e portal-e2e              # cần docker compose đang chạy
```

## Lưu ý về license UI

Các bản PrimeNG mới (đã kiểm tra 19.1.4 đến 22.x) dùng license thương mại PrimeUI. Tổ chức lớn như VNPT
phải mua license theo số dev. Dự án dùng **ng-zorro-antd (MIT)**.
