# Ma trận kiểm thử: <tính năng>

- **Phiên bản / commit:** ...
- **Môi trường:** máy, trình duyệt, dữ liệu
- **Người thực hiện / ngày:** ...

| # | Tình huống | Vai trò | Đầu vào / thao tác | Kỳ vọng (HTTP, UI) | Tầng test (unit / integration / E2E / thủ công) | Kết quả | Bằng chứng (test, ảnh, log) |
|---|---|---|---|---|---|---|---|
| 1 | Chưa đăng nhập gọi API | — | `GET /api/tickets` không token | 401 | integration | | |
| 2 | Sai quyền | AGENT | duyệt phiếu | 403, dữ liệu không đổi | E2E (API) | | |
| 3 | Xung đột cập nhật | SUPERVISOR | duyệt bằng `version` cũ | 409, UI cho tải lại | integration + E2E | | |
| 4 | | | | | | | |

**Chưa kiểm được / rủi ro còn lại:** ...
