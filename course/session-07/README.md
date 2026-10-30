# Buổi 07 — SSO và chiến lược kiểm thử hệ thống

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Điểm bắt đầu:** `git checkout session07-start` · **Đáp án:** 4 patch trong `solution/`, bản đầy đủ ở nhánh `session07-end`

## Theo đề cương

| | |
|---|---|
| Nội dung chính | OIDC Authorization Code với PKCE, callback, logout, ID token và access token; so sánh SPA với BFF. Unit test quy tắc, integration test HTTP và state, E2E hành trình nghiệp vụ, chất lượng assertion. |
| Use case và lab | Đăng nhập qua Keycloak cục bộ bằng thư viện OIDC; chạy TestBed, HTTP testing và Playwright. Xác minh việc từ chối sai quyền ở server. |
| Sản phẩm đầu ra | Checklist SSO, test report và regression test. Tích hợp resource server với JWKS và audience là phần mở rộng. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Giải thích luồng OIDC Authorization Code + PKCE: redirect, callback, đổi code lấy token, `state`/`nonce`, logout (RP-initiated).
2. Phân biệt ID token (cho client biết ai đăng nhập) và access token (cho API); giải thích vì sao API từ chối ID token (`aud`).
3. So sánh SPA giữ token với BFF (token ở server, trình duyệt chỉ có cookie phiên); chọn theo rủi ro và hạ tầng.
4. Xây tháp kiểm thử: unit test quy tắc, integration test HTTP + state (TestBed, `HttpTestingController`), E2E hành trình (Playwright).
5. Viết assertion có giá trị và tự kiểm chứng bằng **thử phá** (mutation bằng tay); viết regression test cho lỗi đã sửa.

## Use case trên Care Portal

VNPT muốn nhân viên CSKH đăng nhập bằng tài khoản chung của hệ thống định danh (SSO). Portal ở điểm bắt đầu đã có chế độ
`auth.mode = "oidc"` dùng `angular-auth-oidc-client` với Keycloak cục bộ (profile docker `sso`). Ba lỗi thật, tái hiện được (đã đo):

| # | Lỗi | Bằng chứng |
|---|---|---|
| 1 | Đăng nhập Keycloak thành công nhưng **mọi API 401**, màn hình "Không tải được danh sách thuê bao" | Header `Authorization` mang token `typ: ID`, `aud: care-portal`; API trả `invalid_token ... The aud claim is not valid`. App refresh rồi gửi lại, vẫn 401 |
| 2 | **Quầy dùng máy chung:** ca sáng bấm Đăng xuất, ca chiều bấm "Đăng nhập bằng SSO" → vào thẳng tài khoản ca sáng, không hỏi mật khẩu | Network: `GET .../openid-connect/auth` → **302** ngay về callback; app chỉ xóa token trong tab, cookie phiên Keycloak còn nguyên |
| 3 | **Agent đóng được phiếu, bỏ qua Manager duyệt**: `PATCH /api/tickets/{id}` với `status: CLOSED` | Mong 403, nhận **200**. Lỗi có từ buổi 2; giao diện không có nút đóng nên mọi test qua UI đều xanh |

Thêm một phát hiện về chất lượng test: cố ý phá 4 chỗ trong luồng duyệt phiếu, bộ test hiện có (39 test của `portal-feature-tickets`
và 3 integration test ở app) **để lọt 2 chỗ**: thông báo 409 bị thay bằng lỗi chung, và Agent thấy nút Duyệt.

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Đăng nhập Keycloak: quan sát Authorization Code + PKCE, giải mã ID token và access token; test đỏ "API nhận access token", sửa adapter | 35 |
| 2 | Đăng xuất máy dùng chung (RP-initiated logout) + `docs/checklist-sso.md` kiểm tra bằng curl và E2E | 20 |
| 3 | Unit test quy tắc `canApprove` (bảng) + làm chặt integration test duyệt phiếu; thử phá 4 chỗ | 30 |
| 4 | Playwright: hành trình Agent tạo → Manager duyệt → Agent thấy "Đã đóng"; test API gọi thẳng → phát hiện lỗi 3 | 25 |
| 5 | Sửa lỗi 3 ở backend (một dòng `@PreAuthorize`), regression test, `docs/bao-cao-kiem-thu.md` | 10 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Port xác thực và hai adapter | `frontend/libs/shared/data-access-auth/src/lib/auth.service.ts` (port), `local-auth.service.ts`, `oidc-auth.service.ts` |
| Chọn adapter theo `config.json`, cấu hình thư viện OIDC | `.../data-access-auth/src/lib/provide-auth.ts`, `frontend/libs/shared/util-config/src/lib/app-config.ts` (`AuthConfig`) |
| Nút "Đăng nhập bằng SSO" | `frontend/libs/shared/feature-auth/src/lib/login.page.*` |
| Realm Keycloak (client public, PKCE S256, redirect URI chính xác, mapper `roles` và audience) | `infra/keycloak/care-realm.json`, service `keycloak` trong `infra/docker-compose.yml` |
| API nhận token Keycloak (JWKS, `iss`, `aud`) | `backend/.../auth/JwtConfig.java` (`jwtAuthenticationManagerResolver`, `ssoDecoder`), `SsoProperties.java`, `SsoTokenTests.java` |
| Integration test duyệt phiếu (test yếu ở điểm bắt đầu) | `frontend/apps/portal/src/app/ticket-approval.spec.ts` |
| Quy tắc hiện nút Duyệt (đáp án) | `frontend/libs/portal/domain-tickets/src/lib/ticket.rules.ts` |
| E2E (đáp án) | `frontend/apps/portal-e2e/src/sso/sso.spec.ts`, `journeys/ticket-approval.journey.spec.ts`, `security/role-denial.spec.ts` |

## Đã chuẩn bị ở `session07-start`

- Đáp án buổi 6 đã áp (`session06-end`).
- Hạ tầng: service `keycloak` (26.8.1, `start-dev`, cổng 8180) dưới `profiles: [sso]`, realm `care` import từ `infra/keycloak/care-realm.json`
  (user `agent1`/`supervisor1`/`admin1` cùng vai trò như DB). Các buổi khác **không** cần Keycloak.
- Backend: ngoài token tự phát, nhận access token Keycloak khi đặt `SSO_ISSUER_URI` + `SSO_JWK_SET_URI` (compose đặt sẵn); chọn decoder theo `iss`;
  kiểm tra signature qua JWKS, hạn (clock skew 10 giây), `iss`, `aud` có `care-api`. 4 test `SsoTokenTests` (máy chủ JWKS nhỏ trong test).
- Frontend: `AuthService` thành port (abstract class); `LocalAuthService` (code buổi 6) và `OidcAuthService` (mới, có **lỗi 1 và 2 cố ý**);
  `provideAuth(config.auth)`; trang đăng nhập có nút SSO ở chế độ OIDC; callback `/auth/callback` giữ `returnUrl`, callback lỗi không làm trắng app.
  `angular-auth-oidc-client` 22.0.1. Key i18n `auth.ssoSubmit`, `auth.ssoHint` (vi/en).
- Test: `oidc-auth.service.spec.ts` (fake thư viện OIDC, 4 test), `login.page.spec.ts` thêm chế độ OIDC,
  `apps/portal/src/app/ticket-approval.spec.ts` (3 integration test **cố ý yếu** cho Bài 3).

## Tài liệu

| | |
|---|---|
| Slide | [slides/slides.md](slides/slides.md) (nguồn Marp) · `buoi-07-sso-va-kiem-thu.pptx` · `buoi-07-sso-va-kiem-thu.pdf` |
| Lab | [lab/README.md](lab/README.md) |
| Đáp án | [solution/README.md](solution/README.md) + 4 file `.patch` |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) · [note-cho-giang-vien.md](note-cho-giang-vien.md) |
| Bài tập về nhà | [../bai-tap-ve-nha/buoi-07-sso-va-kiem-thu.html](../bai-tap-ve-nha/buoi-07-sso-va-kiem-thu.html) |

## Sửa slide

```bash
cd course/session-07/slides
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-07-sso-va-kiem-thu.pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-07-sso-va-kiem-thu.pdf
```
