---
paths:
  - "backend/**"
  - "infra/**"
---
# Backend (Spring Boot 3.5, Java 21) và hạ tầng

## Quy ước

- Controller mỏng, logic ở service; DTO là `record`; ánh xạ bằng MapStruct. Lỗi trả theo RFC 9457 (`ProblemDetail`) qua `GlobalExceptionHandler`,
  `detail` dịch theo `Accept-Language` (mặc định tiếng Việt).
- **Thêm key lỗi/thông báo vào cả `messages.properties` (vi) và `messages_en.properties`** với cùng bộ key.
- Phân quyền ở server: `@PreAuthorize` trên API cần role, `/api/admin/**` cần `ADMIN` (`SecurityConfig`). Mỗi quy tắc có test (401 / 403 / 409).
- Dữ liệu ghi: optimistic locking (`version`, lỗi 409); lệnh tạo hỗ trợ `Idempotency-Key`.

## Xác thực (JWT do backend phát)

- HS256, claim `roles`, `token_use` (`access` / `refresh`), `aud`, `iss`; clock skew 10 giây. Refresh token rotation có trạng thái (bảng `refresh_token`):
  mỗi token dùng một lần, dùng lại thì revoke cả family. Đánh dấu đã dùng bằng **một câu `UPDATE` có điều kiện**, không "đọc rồi ghi".
- Không có secret thật trong repo. `JWT_SECRET` mặc định chỉ cho máy học viên; production truyền qua biến môi trường.

## Flyway

- **Không sửa migration đã áp (V1–V4, và file đã commit), kể cả comment**: checksum lệch làm DB hiện có báo lỗi khi khởi động. Cần đổi thì thêm migration mới.
- Dump `infra/db/init/01-care.sql.gz` chứa lịch sử Flyway; thêm/sửa migration thì chạy `infra/db/make-dump.sh` và commit dump mới.
- Dữ liệu seed lớn (buổi 5) tạm bỏ dump rồi seed bằng `SEED_SUBSCRIBERS`, `SEED_TICKETS` (xem `README.md`).

## Biến môi trường demo (tắt/mặc định khi không truyền)

`DEMO_SLOW_SHORT_QUERY` (buổi 3), `MAX_PAGE_SIZE` (buổi 5), `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL` (buổi 6). Không bật mặc định ở compose.

## Test

- Testcontainers (Docker). VS Code (extension Java) ghi đè `backend/target/classes` không có bean MapStruct, làm `./mvnw test` lỗi `No qualifying bean ...Mapper`.
  Chạy trong bản sao: `rsync -a --exclude target backend/ <scratch>/be && cd <scratch>/be && ./mvnw -q test`.
- Đổi code backend thì build lại container: `docker compose -f infra/docker-compose.yml up -d --build api`.
