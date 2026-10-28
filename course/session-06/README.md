# Buổi 06 — Authentication và bảo mật giao tiếp API

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Trạng thái tài liệu:** đã có khung theo đề cương; chưa soạn slide, lab chi tiết, đáp án.

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Ranh giới browser và server; authentication, authorization, JWT và kiểm tra claim; access token ngắn hạn, refresh rotation, cookie HttpOnly, CSRF, CORS, HTTPS và hạn chế XSS. |
| Use case và lab | Kiểm tra API trả 401, 403, 409; chia sẻ một refresh cho nhiều request 401; xử lý refresh lỗi, token reuse và ngăn gửi Bearer tới URL ngoài phạm vi. |
| Sản phẩm đầu ra | Ma trận kiểm thử bảo mật, test refresh đồng thời và mô tả vòng đời session. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Vẽ ranh giới tin cậy browser/server: client chỉ để trải nghiệm, server mới quyết định quyền.
2. Đọc và kiểm tra JWT: chữ ký, `exp`, `iss`, `aud`, `roles`; phân biệt 401 và 403.
3. Thiết kế vòng đời session: access token ngắn hạn, refresh token xoay vòng (rotation) và phát hiện tái sử dụng.
4. So sánh nơi lưu token (memory, sessionStorage, cookie HttpOnly) cùng rủi ro XSS và CSRF; cấu hình CORS, HTTPS.
5. Viết interceptor dùng chung một refresh cho nhiều request 401 đồng thời, và không gửi Bearer ra ngoài `apiUrl`.

## Use case trên Care Portal

- Mở trang Phiếu khi access token vừa hết hạn: 3 request song song cùng nhận **401**. Hiện tại interceptor chuyển thẳng
  về trang đăng nhập. Mục tiêu: **một** lần gọi `/api/auth/refresh`, 3 request được gửi lại với token mới.
- Refresh lỗi (refresh token hết hạn hoặc đã bị dùng): đăng xuất sạch, giữ `returnUrl`.
- `agent1` gọi API duyệt phiếu (buổi 2) → **403** dù nút đã ẩn trên UI. `supervisor1` duyệt bản cũ → **409**.
- Một request tới `https://cdn.example.com/...` không được mang header `Authorization`.

## Dự kiến lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Ma trận kiểm thử bảo mật: 401, 403, 409, CORS, Bearer ngoài phạm vi (điền bằng curl/Swagger) | 25 |
| 2 | Interceptor refresh dùng chung (một refresh cho N request 401), test đồng thời | 40 |
| 3 | Refresh lỗi và token reuse: đăng xuất, xóa state, giữ `returnUrl` | 25 |
| 4 | Ngăn Bearer tới URL ngoài phạm vi; test interceptor | 15 |
| 5 | Mô tả vòng đời session (sơ đồ trình tự), so sánh với cookie HttpOnly + CSRF token | 15 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Interceptor gắn Bearer, xử lý 401 | `frontend/libs/shared/data-access-auth/src/lib/auth.interceptor.ts` (+ `.spec.ts`) |
| Lưu phiên, giải mã claim | `frontend/libs/shared/data-access-auth/src/lib/auth.service.ts`, `jwt.ts` |
| Guard theo role, chống open redirect | `auth.guard.ts`, `role.guard.ts` (`safeReturnUrl`) |
| Phát và kiểm tra token | `backend/.../auth/TokenService.java`, `AuthController.java` |
| Phân quyền, CORS | `backend/.../config/SecurityConfig.java`, `CorsProperties.java` |

## Cần chuẩn bị trước khi soạn chi tiết

- [ ] Backend: refresh rotation có trạng thái (lưu `jti` refresh token, đánh dấu đã dùng, dùng lại thì thu hồi cả họ token). Hiện refresh token là stateless.
- [ ] Backend: rút ngắn `accessTokenTtl` qua biến môi trường (ví dụ 30 giây) để tái hiện hết hạn trong lớp.
- [ ] Backend: phân quyền phê duyệt phiếu cho `SUPERVISOR` (cùng với buổi 2).
- [ ] Mẫu ma trận kiểm thử: `course/_templates/test-matrix.md`.

## Tài liệu

| | |
|---|---|
| Slide | `slides/` (chưa soạn) |
| Lab | `lab/` (chưa soạn) |
| Đáp án | `solution/` (chưa soạn) |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) |
| Bài tập về nhà | `../bai-tap-ve-nha/buoi-06-<chu-de>.html` (chưa soạn) |
