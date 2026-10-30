# Ma trận kiểm thử bảo mật: xác thực và giao tiếp API

- **Phiên bản / commit:** nhánh `session06-end`
- **Môi trường:** backend Docker (`docker compose -f infra/docker-compose.yml up -d`), dữ liệu dump gốc; unit test chạy jsdom (Vitest)
- **Người thực hiện / ngày:** bản mẫu của giảng viên

Chạy lại toàn bộ:

```bash
cd frontend
npx playwright test -c apps/portal-e2e/playwright.config.mts security --project=chromium   # dòng 1–18 (API)
npx nx test shared-data-access-auth                                                         # dòng 19–25 (interceptor)
```

## API (Playwright, `apps/portal-e2e/src/security/api-matrix.spec.ts`)

Số `#` trùng với tên test.

| # | Tình huống | Vai trò | Đầu vào / thao tác | Kỳ vọng | Tầng | Kết quả |
|---|---|---|---|---|---|---|
| 1 | Chưa đăng nhập | — | `GET /api/tickets` không có `Authorization` | 401 | E2E (API) | Đạt |
| 2 | Token rác | — | `Bearer abc.def.ghi` | 401 | E2E (API) | Đạt |
| 3 | Tự nâng quyền | AGENT | Sửa payload thành `roles: ["ADMIN"]`, giữ signature cũ, gọi `/api/admin/stats` | 401 (signature không khớp) | E2E (API) | Đạt |
| 4 | Bỏ signature | — | Header `alg: none`, phần signature rỗng | 401 | E2E (API) | Đạt |
| 5 | Ký bằng key khác | — | HS256 với key của kẻ tấn công | 401 | E2E (API) | Đạt |
| 6 | Token hết hạn | AGENT | Ký đúng key, `exp` = 15 giây trước (quá 10 giây clock skew); đối chứng: còn hạn → 200 | 401 | E2E (API) | Đạt |
| 7 | Sai người nhận / người phát | AGENT | Ký đúng key, `aud: billing-api` hoặc `iss: evil` | 401 | E2E (API) | Đạt |
| 8 | Nhầm loại token | AGENT | Gửi refresh token làm Bearer | 401 (`token_use` sai) | E2E (API) | Đạt |
| 9 | Ẩn nút không phải phân quyền | AGENT | `POST /api/tickets/{id}/approve` với `version` đúng | 403; phiếu vẫn `RESOLVED`, `version` không đổi | E2E (API) | Đạt |
| 10 | Sai quyền khu quản trị | AGENT | `GET /api/admin/stats` | 403 | E2E (API) | Đạt |
| 11 | Xung đột cập nhật | SUPERVISOR | Duyệt với `version` cũ | 409 có `detail`; phiếu không đổi | E2E (API) | Đạt |
| 12 | Refresh rotation, phát hiện reuse | AGENT | Refresh R1 → R2; refresh R1 lần nữa; refresh R2 | 200; 401; 401 (cả family bị revoke) | E2E (API) | Đạt |
| 13 | Refresh đồng thời | AGENT | 3 request refresh cùng R1 song song | Đúng một 200, hai 401 | E2E (API) | Đạt |
| 14 | Đăng xuất revoke ở server | AGENT | `POST /api/auth/logout`, rồi refresh bằng token đó | 204; 401 | E2E (API) | Đạt |
| 15 | Giới hạn của JWT stateless | AGENT | Sau đăng xuất, dùng access token cũ | 200 tới khi hết hạn (rủi ro còn lại, xem dưới) | E2E (API) | Đạt (ghi nhận) |
| 16 | CORS: origin của app | — | Preflight `Origin: http://localhost:4200` | 200, `Access-Control-Allow-Origin` = origin | E2E (API) | Đạt |
| 17 | CORS: origin lạ | — | Preflight `Origin: https://evil.example` | 403, không có `Access-Control-Allow-Origin` | E2E (API) | Đạt |
| 18 | CORS không phải phân quyền | AGENT | Request thật có Origin lạ; cùng request không có Origin (curl) | 403; **200** | E2E (API) | Đạt (ghi nhận) |

## Frontend (Vitest, `libs/shared/data-access-auth`)

| # | Tình huống | Đầu vào / thao tác | Kỳ vọng | Tầng | Kết quả |
|---|---|---|---|---|---|
| 19 | Bearer ngoài phạm vi | Request tới `http://api.evil.com`, `http://api@evil.com`, `http://api:8443`, `http://apix`, CDN | Không có header `Authorization` | unit | Đạt |
| 20 | `apiUrl` rỗng (cùng origin, sau reverse proxy) | `/api/me` và CDN | Chỉ `/api/me` có Bearer | unit | Đạt |
| 21 | Không gửi token cho `/api/auth/*` | Gọi `/api/auth/login` khi đang có token | Không có `Authorization` | unit | Đạt |
| 22 | 3 request cùng nhận 401 | 3 GET song song, cùng 401 | Đúng **một** `POST /api/auth/refresh`; 3 request gửi lại bằng token mới | unit | Đạt |
| 23 | 401 về muộn | Request B nhận 401 sau khi request A đã refresh xong | Không refresh lại; gửi lại bằng token hiện tại | unit | Đạt |
| 24 | Refresh bị từ chối | 3 request chờ, refresh trả 401 | Điều hướng `/login` **một lần**, có `returnUrl` và `reason=expired`; sessionStorage trống | unit + E2E thủ công | Đạt |
| 25 | Refresh lỗi mạng | Refresh trả status 0 | Không đăng xuất; request báo lỗi, lần sau thử lại | unit | Đạt |

## Rủi ro còn lại

- **Access token vẫn dùng được tới khi hết hạn** sau khi đăng xuất hoặc bị revoke refresh token family (dòng 15). Giới hạn bằng TTL ngắn
  (mặc định 15 phút). Cần revoke tức thì thì phải có danh sách revoke hoặc introspection (đổi lại: mỗi request hỏi server).
- **Token trong sessionStorage đọc được bằng JavaScript.** Một lỗi XSS đọc được cả refresh token. Giảm rủi ro: CSP, không dùng
  `innerHTML`/`bypassSecurityTrust*` với dữ liệu người dùng, phát hiện reuse (dòng 12). Phương án mạnh hơn: refresh token trong cookie
  `HttpOnly` (xem `docs/vong-doi-phien.md`).
- **Phát hiện reuse cũng đăng xuất người dùng thật.** Chấp nhận được: người dùng đăng nhập lại; kẻ tấn công mất quyền.
- **Chưa kiểm được ở lớp này:** HTTPS và HSTS (môi trường dev chạy HTTP, buổi 9 cấu hình nginx), giới hạn số lần đăng nhập sai
  (chưa có rate limit), quyền theo dữ liệu (agent chỉ xem thuê bao thuộc đơn vị mình: chưa có yêu cầu nghiệp vụ).
