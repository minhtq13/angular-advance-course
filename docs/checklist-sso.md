# Checklist SSO: Care Portal đăng nhập qua Keycloak

Phạm vi: portal ở chế độ `auth.mode = "oidc"`, realm `care` (`infra/keycloak/care-realm.json`), client public `care-portal`,
thư viện `angular-auth-oidc-client` 22.0.1. Mỗi dòng ghi **cách kiểm tra** và **kết quả thật**, không ghi "đã cấu hình" suông.

`B = http://localhost:8180/realms/care/protocol/openid-connect`

## 1. Luồng đăng nhập

| # | Mục | Cách kiểm tra | Kết quả | |
|---|---|---|---|---|
| 1 | Client public, không có client secret ở frontend | Đọc `config.json`, `provide-auth.ts`: chỉ có `authority`, `clientId` | Không có secret | ✅ |
| 2 | Authorization Code (không Implicit) | `curl "$B/auth?...&response_type=token..."` | `unauthorized_client: Implicit flow is disabled for the client` | ✅ |
| 3 | PKCE bắt buộc, chỉ S256 | Bỏ `code_challenge`; rồi dùng `code_challenge_method=plain` | `Missing parameter: code_challenge_method`; `code challenge method is not matching the configured one` | ✅ |
| 4 | Password grant tắt (app không được nhận mật khẩu SSO) | `curl -X POST $B/token -d grant_type=password ...` | `unauthorized_client: Client not allowed for direct access grants` | ✅ |
| 5 | Redirect URI khớp chính xác, không wildcard | `redirect_uri=http://evil.example/cb`; `.../auth/callback/../evil` | Cả hai: HTTP 400 "Tham số không hợp lệ: redirect_uri" | ✅ |
| 6 | `state` và `nonce` có trong request, được kiểm tra khi quay về | E2E `sso.spec.ts`: đọc query của `/auth`; mở `/auth/callback?code=abc&state=khong-phai-cua-app` | Có `state`, `nonce`, `code_challenge` (43 ký tự); callback giả: không gọi `/token`, về `/login` | ✅ |
| 7 | Quay về đúng trang định vào, không open redirect | `login.page.spec.ts`: `returnUrl=//evil.com` | `loginWithSso('/')` | ✅ |

## 2. Token

| # | Mục | Cách kiểm tra | Kết quả | |
|---|---|---|---|---|
| 8 | API nhận **access token**, không nhận ID token | E2E: giải mã header `Authorization`; backend `SsoTokenTests` | `typ: Bearer`, `aud` có `care-api`. Gửi ID token: 401 `The aud claim is not valid` | ✅ (sau Bài 1) |
| 9 | API kiểm tra signature (JWKS), `iss`, `aud`, hạn | `SsoTokenTests`: token ký bằng key khác, `iss` lạ | 401 cả hai | ✅ |
| 10 | Vai trò lấy từ token, server quyết định | `SsoTokenTests`: token Keycloak có `roles: [AGENT]` gọi `/approve` | 403 | ✅ |
| 11 | Nơi lưu token | DevTools → Session Storage: key `care-portal` của thư viện | Theo tab, mất khi đóng tab. XSS đọc được (như buổi 6) | ⚠️ chấp nhận, xem rủi ro |
| 12 | Thời hạn ngắn | Giải mã token trả về từ `/token` (`exp - iat`) | Access token 300 giây, refresh token 1800 giây (= phiên SSO rảnh 30 phút). App gia hạn bằng refresh token 30 giây trước khi hết hạn | ✅ |
| 13 | Refresh token rotation, dùng lại thì hủy phiên | Refresh bằng R1 → R2; refresh lại R1; rồi refresh R2 | 200; 400 `Maximum allowed refresh token reuse exceeded`; 400 (phiên đã bị hủy, giống revoke cả family ở buổi 6) | ✅ |

## 3. Đăng xuất và hết phiên

| # | Mục | Cách kiểm tra | Kết quả | |
|---|---|---|---|---|
| 14 | Đăng xuất kết thúc **cả phiên SSO** (RP-initiated logout) | E2E "máy dùng chung": đăng xuất, bấm SSO | Trước khi sửa: Keycloak trả 302 ngay, vào lại tài khoản cũ. Sau khi sửa: hiện form Keycloak | ✅ (sau Bài 2) |
| 15 | Logout gửi `id_token_hint`, `post_logout_redirect_uri` đã đăng ký | E2E đọc query của `/logout`; thử `post_logout_redirect_uri=http://evil.example/` | Có đủ hai tham số; URI lạ: HTTP 400 | ✅ |
| 16 | Token bị revoke khi đăng xuất | Ghi request tới Keycloak lúc bấm Đăng xuất | `POST /revoke` (refresh token), `POST /revoke` (access token), rồi `GET /logout` | ✅ |
| 17 | Hết phiên thì báo rõ | `oidc-auth.service.spec.ts`: refresh trả `isAuthenticated: false` | Một lần điều hướng `/login?returnUrl=...&reason=expired` | ✅ |

## 4. Rủi ro còn lại

- Token trong `sessionStorage`: script độc chạy trong trang đọc được token. Giảm bằng CSP, không chèn HTML thô, access token ngắn (5 phút).
  Muốn token không bao giờ tới trình duyệt: **BFF** (xem slide so sánh SPA và BFF).
- Đăng xuất ở app khác cùng realm không làm portal đăng xuất ngay (chưa bật front-channel/back-channel logout cho SPA):
  portal chỉ biết khi refresh thất bại (tối đa 5 phút).
- `start-dev` của Keycloak chạy HTTP, không dùng cho production (cần HTTPS, `sslRequired: external`, DB riêng).
