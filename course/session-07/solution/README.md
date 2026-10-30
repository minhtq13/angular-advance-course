# Đáp án lab buổi 7

## Áp đáp án vào code

Trong thư mục gốc repo, từ `session07-start`:

```bash
git apply course/session-07/solution/bai1-access-token-cho-api.patch
git apply course/session-07/solution/bai2-dang-xuat-sso-va-checklist.patch
git apply course/session-07/solution/bai3-quy-tac-va-integration.patch
git apply course/session-07/solution/bai4-5-hanh-trinh-quyen-va-bao-cao.patch
```

Gỡ theo thứ tự ngược lại. Bản đã áp đủ là nhánh `session07-end`. Patch cuối có sửa backend: `docker compose -f infra/docker-compose.yml up -d --build api`.

Đã kiểm tra: sau **từng** patch, `nx run-many -t lint test build` pass (16 project); áp đủ ra đúng `session07-end`, gỡ ra về đúng
`session07-start`. Backend 28 test pass (`SsoTokenTests` 4, `TicketApiTests` 5). Mỗi test trong Bài 1, 2, 4 được viết trước và **đỏ**
trên code chưa sửa; Bài 3 đỏ dưới các chỗ phá M1–M4. E2E chạy với Keycloak 26.8.1 thật và backend riêng.

---

## Tái hiện lỗi (điểm bắt đầu, chế độ OIDC)

Playwright ghi lại mọi request, đăng nhập `agent1` qua Keycloak:

```
KC  GET  .../openid-connect/auth?...&code_challenge=1YMSBN4T...&code_challenge_method=S256  -> 200
KC  POST .../login-actions/authenticate -> 302
KC  POST .../openid-connect/token -> 200
GET /api/subscribers -> 401 [ID aud="care-portal"] Bearer error="invalid_token",
    error_description="An error occurred while attempting to decode the Jwt: The aud claim is not valid"
KC  POST .../openid-connect/token -> 200            (interceptor refresh)
GET /api/subscribers -> 401 [ID aud="care-portal"]  (gửi lại vẫn ID token)
```

Màn hình: "Không tải được danh sách thuê bao. Kiểm tra kết nối rồi thử lại." Sau đó Đăng xuất rồi bấm "Đăng nhập bằng SSO":

```
KC  GET  .../openid-connect/auth -> 302      (không có form, Keycloak còn phiên)
KC  POST .../openid-connect/token -> 200
URL: http://localhost:4210/subscribers       (vào lại agent1, không hỏi mật khẩu)
```

Hai token của cùng một lần đăng nhập (giải mã thật, rút gọn):

| Claim | ID token | Access token |
|---|---|---|
| `typ` | `ID` | `Bearer` |
| `aud` | `care-portal` (client) | `care-api` (mapper audience) |
| Có riêng | `nonce`, `at_hash` | `scope`, `realm_access`, `allowed-origins` |
| Thời hạn | 300 giây | 300 giây (refresh token 1800 giây) |

---

## Bài 1 — Access token cho API

```ts
// oidc-auth.service.ts
private apply(result: LoginResponse): void {
  ...
  // Access token cho API (aud = care-api). ID token chỉ để app biết ai đăng nhập (aud = care-portal),
  // gửi ID token tới API -> 401 "The aud claim is not valid".
  this.token = result.accessToken;
  this.user.set(userFromClaims(decodeJwtPayload<UserClaims>(result.idToken)));
}
```

Test (`oidc-auth.service.spec.ts`, có `withInterceptors([authInterceptor])`): "request tới API mang access token", "access token hết hạn →
refresh qua thư viện, gửi lại bằng access token mới". Trên điểm bắt đầu cả hai đỏ: `expected 'Bearer eyJ…' to be 'Bearer eyJ…'`, phần khác nhau
là `SUQ...` (`"ID"`) so với `QmVhcmVy` (`"Bearer"`).

E2E `sso.spec.ts` "đăng nhập qua Keycloak": query `/auth` có `response_type=code`, `code_challenge_method=S256`, `code_challenge` 43 ký tự, `state`,
`nonce`; quay về đúng `/tickets?status=RESOLVED`; header của `GET /api/tickets` có `typ: Bearer`, `aud` chứa `care-api`.

## Bài 2 — Đăng xuất máy dùng chung, checklist

```ts
logout(): void {
  this.user.set(null);
  this.token = null;
  this.oidc.logoffAndRevokeTokens().subscribe({
    // Không tới được Keycloak: ít nhất xóa phiên trong tab.
    error: () => { this.oidc.logoffLocal(); this.router.navigate(['/login']); },
  });
}
```

Thứ tự request thật khi bấm Đăng xuất: `POST /revoke` (refresh token), `POST /revoke` (access token), `GET .../logout?id_token_hint=...&post_logout_redirect_uri=.../login`.

E2E "máy dùng chung": trên điểm bắt đầu đỏ ở `waitForRequest(/openid-connect\/logout\?/)` (timeout 30 giây: app không hề gọi Keycloak);
sau khi sửa, bấm SSO thấy `#username` của Keycloak, đăng nhập `supervisor1` được.

`docs/checklist-sso.md`: 17 dòng có cách kiểm tra và kết quả thật. Kết quả curl để đối chiếu:

| Thử | Keycloak trả |
|---|---|
| `response_type=token` | `unauthorized_client`: Implicit flow is disabled for the client |
| Thiếu `code_challenge` | `Missing parameter: code_challenge_method` |
| `code_challenge_method=plain` | `code challenge method is not matching the configured one` |
| `grant_type=password` | `unauthorized_client`: Client not allowed for direct access grants |
| `redirect_uri=http://evil.example/cb`, `.../auth/callback/../evil` | HTTP 400 "Tham số không hợp lệ: redirect_uri" |
| `post_logout_redirect_uri=http://evil.example/` | HTTP 400 |
| Refresh R1 → R2; R1 lần nữa; R2 | 200; 400 `Maximum allowed refresh token reuse exceeded`; 400 (phiên đã bị hủy) |

Thêm 2 test: "callback giả (`state` không do app tạo) → không gọi `/token`, về `/login`" (E2E) và "refresh thất bại → **một** lần về
`/login?reason=expired`" (unit, dùng `Subject` để hai request cùng chờ).

**Thử phá:**

| Thay đổi | Test đỏ | Ghi chú |
|---|---|---|
| Quay lại `result.idToken` | 2 test Bài 1 | |
| `logout()` chỉ `logoffLocal()` | Unit "đăng xuất", E2E "máy dùng chung" | |
| `logoffAndRevokeTokens()` → `logoff()` | Unit "đăng xuất"; E2E "máy dùng chung" đỏ ở `waitForRequest(/openid-connect\/revoke/)` | `logoff()` vẫn kết thúc phiên Keycloak (người sau phải nhập mật khẩu) nhưng **không revoke** token: refresh token đã lộ còn dùng được tới khi hết hạn. E2E bắt được vì có assert request `/revoke`; bỏ dòng đó thì chỉ unit test bắt |

## Bài 3 — Unit quy tắc và integration

```ts
// libs/portal/domain-tickets/src/lib/ticket.rules.ts
export function canApprove(ticket: Pick<TicketSummary, 'status'>, roles: readonly string[]): boolean {
  return roles.includes('SUPERVISOR') && ticket.status === 'RESOLVED';
}
```

`ticket.rules.spec.ts`: `it.each` 8 dòng (trạng thái × vai trò) + tên vai trò gần giống. `ticket-approval.spec.ts` viết lại (xem patch):
URL + body `{ version: 3 }`, request tải lại đúng bộ lọc, chữ "Đã duyệt phiếu TK-000042"; 409 có lý do từ server, `expectNone` rồi bấm
"Tải lại danh sách"; Agent: danh sách đã hiện 1 dòng rồi mới đếm nút; `afterEach(() => http.verify())`.

**Thử phá, đã chạy thật** (`portal`, `portal-domain-tickets`, `portal-feature-tickets`):

| Phá | Trước: `feature-tickets` (39) | Trước: app (3 test yếu) | Sau: app (3) | Sau: quy tắc (9) |
|---|---|---|---|---|
| M1 `version: 0` | 2 đỏ | xanh | 1 đỏ | xanh |
| M2 bỏ `store.reload()` | 1 đỏ | xanh | 1 đỏ | xanh |
| M3 409 → lỗi chung | **xanh** | xanh | 1 đỏ | xanh |
| M4 mọi vai trò thấy nút | **xanh** | xanh | 1 đỏ | 3 đỏ |

Trước khi sửa, M3 và M4 lọt qua toàn bộ unit/integration test; M4 chỉ E2E buổi 2 (`ticket-flow.spec`) bắt được, chậm và cần backend.
Sau khi tách quy tắc, M4 đỏ ở tầng rẻ nhất.

## Bài 4 — Hành trình E2E và test quyền ở server

- `journeys/ticket-approval.journey.spec.ts`: 1 test, 2 context, 2,4 giây. Bẫy: `await created.json()` sau khi trang đã chuyển →
  `Protocol error (Network.getResponseBody): No data found for resource`. Đọc body ngay trong `.then` của `waitForResponse`.
- `security/role-denial.spec.ts`: trên backend điểm bắt đầu cả 2 test đỏ: `Expected: 403, Received: 200`. **Agent đóng được phiếu.**
- `sso.spec.ts` (mở rộng): token Keycloak của `agent1` (`roles: ["AGENT"]`) gọi `/approve` → 403, phiếu không đổi.

## Bài 5 — Sửa và regression

```java
@PatchMapping("/{id}")
@PreAuthorize("#request.status() != T(com.careportal.api.ticket.TicketStatus).CLOSED")
public TicketDto update(@PathVariable long id, @Valid @RequestBody UpdateTicketRequest request) { ... }
```

`TicketApiTests.nobodyClosesTicketByPatch` (đỏ trước khi sửa: `Status expected:<403> but was:<200>`): agent và manager đều 403, phiếu vẫn
RESOLVED cùng `version`; đổi `priority` vẫn 200. Sau khi sửa: E2E local **30 pass, 5 skip** (SSO, perf), 1 fail `i18n.spec` do backend riêng chỉ seed
2.000 thuê bao ("Total: 2,000"), không phải hồi quy; E2E SSO 4 pass.

Bản mẫu báo cáo: `docs/bao-cao-kiem-thu.md`.

Điểm chấm:
- Checklist có **bằng chứng** (lệnh, mã HTTP, thông báo) cho từng dòng, không chỉ "đã cấu hình".
- Bảng thử phá có cột trước/sau; giải thích vì sao test agent cũ xanh (danh sách chưa từng được trả về).
- Test quyền gọi thẳng API **và** kiểm tra dữ liệu không đổi.
- Báo cáo nêu lỗi PATCH tồn tại từ buổi 2 và vì sao test qua UI không thấy.

---

## Phần chuẩn bị ở `session07-start` (để giảng viên biết)

| Phần | Thay đổi |
|---|---|
| Hạ tầng | Service `keycloak` (26.8.1, `start-dev`, cổng 8180, `KC_HOSTNAME=http://localhost:8180`) dưới profile `sso`; realm `infra/keycloak/care-realm.json`: client public `care-portal`, chỉ Authorization Code, PKCE S256 bắt buộc, password grant tắt, redirect URI `http://localhost:4200/auth/callback`, post logout `http://localhost:4200/login`, mapper `roles` (ID + access token) và audience `care-api` (chỉ access token), refresh token rotation |
| Backend | `SsoProperties` (`SSO_ISSUER_URI`, `SSO_JWK_SET_URI`); `JwtIssuerAuthenticationManagerResolver` chọn decoder theo `iss`; decoder Keycloak kiểm tra JWKS, hạn (10 giây lệch), `iss`, `aud`; `SsoTokenTests` 4 test (JWKS chạy bằng `HttpServer` trong test). Đã thử trong docker compose: token Keycloak 200, ID token 401 `aud`, agent duyệt 403 |
| Frontend | `AuthService` → port; `LocalAuthService` (code buổi 6), `OidcAuthService` (lỗi 1, 2 cố ý); `provideAuth(config.auth)`; `triggerAuthorizationResultEvent: true` để thư viện không tự về `/`; callback lỗi → chưa đăng nhập (không trắng trang); nút SSO trên trang đăng nhập; `angular-auth-oidc-client` 22.0.1 |
| Test | `oidc-auth.service.spec.ts` 4 test (fake thư viện); `login.page.spec.ts` chế độ OIDC + chặn open redirect; `ticket-approval.spec.ts` 3 test yếu cố ý |
