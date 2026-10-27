# Kết nối cơ sở dữ liệu

## 1. Khởi động (một lệnh)

```bash
docker compose -f infra/docker-compose.yml up -d
```

Lần đầu chạy, Postgres tự restore dữ liệu mẫu từ `infra/db/init/01-care.sql.gz` trong khoảng 5 giây:
**200.000 thuê bao, 50.000 phiếu yêu cầu, 8 gói cước, 3 tài khoản đăng nhập**. Backend (`api`) tự khởi động sau khi DB sẵn sàng.

## 2. Thông tin kết nối

| | |
|---|---|
| Host | `localhost` |
| Port | `5433` |
| Database | `care` |
| User / Password | `care` / `care` |
| JDBC URL | `jdbc:postgresql://localhost:5433/care` |

## 3. Xem dữ liệu — chọn 1 cách

**a) Adminer trên trình duyệt (không cần cài gì):**
mở http://localhost:8088/?pgsql=postgres&username=care&db=care&ns=public, nhập mật khẩu `care`.

> Trong Adminer, ô Server là `postgres` (tên service trong Docker), **không phải** `localhost:5433`.

**b) DBeaver / IntelliJ / DataGrip:** New Connection → PostgreSQL → điền thông tin ở mục 2.

**c) Dòng lệnh (không cần cài psql):**

```bash
docker compose -f infra/docker-compose.yml exec postgres psql -U care -d care
```

```sql
\dt                                   -- liệt kê bảng
SELECT * FROM subscriber LIMIT 10;
SELECT status, count(*) FROM ticket GROUP BY status;
```

## 4. Các bảng chính

```
service_plan (code PK, name, type, monthly_fee, data_gb, active)
      ▲ plan_code
subscriber   (id PK, msisdn UNIQUE, full_name, id_number, date_of_birth, province,
              type, status, plan_code, activated_at, created_at, updated_at, version)
      ▲ subscriber_id
ticket       (id PK, code UNIQUE, subscriber_id, category, priority, status, title,
              description, assignee, created_by, created_at, updated_at, version)

app_user     (username PK, password_hash, full_name, email, roles, enabled)
```

Mật khẩu trong `app_user` được băm bằng bcrypt, không lưu dạng rõ.

Cột `version` dùng cho optimistic locking. Bảng `flyway_schema_history` do Flyway quản lý, không sửa tay.

## 5. Đưa dữ liệu về ban đầu

Làm hỏng dữ liệu khi làm lab? Xóa volume rồi chạy lại, dump sẽ được restore lại từ đầu:

```bash
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d
```

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| `port 5433 is already allocated` | Máy đã có dịch vụ khác dùng port 5433. Đổi `"5433:5432"` trong `infra/docker-compose.yml` và `DB_PORT` khi chạy backend |
| Bảng rỗng hoặc không có bảng | Volume cũ được tạo trước khi có dump. Chạy lệnh ở mục 5 |
| Backend báo `Validate failed: Migration checksum mismatch` | Đã sửa file migration cũ. Không sửa migration đã chạy; tạo file `V4__...sql` mới |

---

### Dành cho người soạn bài

Sau khi thêm hoặc sửa migration: build lại API để Flyway cập nhật DB, rồi tạo lại dump và commit:

```bash
docker compose -f infra/docker-compose.yml up -d --build api
cd infra && ./db/make-dump.sh
```
