# Buổi 07 — SSO và chiến lược kiểm thử hệ thống

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Trạng thái tài liệu:** đã có khung theo đề cương; chưa soạn slide, lab chi tiết, đáp án.

## Theo đề cương

| | |
|---|---|
| Nội dung chính | OIDC Authorization Code với PKCE, callback, logout, ID token và access token; so sánh SPA với BFF. Unit test quy tắc, integration test HTTP và state, E2E hành trình nghiệp vụ, chất lượng assertion. |
| Use case và lab | Đăng nhập qua Keycloak cục bộ bằng thư viện OIDC; chạy TestBed, HTTP testing và Playwright. Xác minh việc từ chối sai quyền ở server. |
| Sản phẩm đầu ra | Checklist SSO, test report và regression test. Tích hợp resource server với JWKS và audience là phần mở rộng. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Giải thích luồng OIDC Authorization Code + PKCE: redirect, callback, đổi code lấy token, logout (RP-initiated).
2. Phân biệt ID token (cho client biết ai đăng nhập) và access token (cho API); không gửi ID token tới API.
3. So sánh SPA giữ token với BFF (token ở server, browser chỉ có cookie phiên); chọn theo rủi ro và hạ tầng.
4. Xây tháp kiểm thử: unit test quy tắc, integration test HTTP + state (TestBed, `HttpTestingController`), E2E hành trình (Playwright).
5. Viết assertion có giá trị: kiểm tra hành vi và dữ liệu nghiệp vụ, không chỉ "không lỗi"; regression test cho lỗi đã sửa.

## Use case trên Care Portal

- Chạy Keycloak cục bộ bằng **profile tùy chọn** `sso`: `docker compose -f infra/docker-compose.yml --profile sso up -d`
  (realm `care` import sẵn, user `agent1`/`supervisor1`, client public `care-portal` bật PKCE). Các buổi khác **không** cần Keycloak.
- Portal có thêm chế độ đăng nhập OIDC (cấu hình trong `config.json`, ví dụ `"auth": { "mode": "oidc", ... }`), dùng thư viện
  `angular-auth-oidc-client` hoặc `angular-oauth2-oidc`. Chế độ mặc định vẫn là JWT do backend phát.
- Hành trình E2E: Agent tạo phiếu → Manager duyệt → Agent thấy trạng thái mới. Playwright gọi thẳng API bằng token Agent
  để duyệt → phải nhận **403** (xác minh từ chối ở server, không dựa vào UI).
- Mở rộng: backend làm resource server nhận token Keycloak (JWKS, `iss`, `aud`).

## Dự kiến lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Đăng nhập Keycloak qua thư viện OIDC: login, callback, logout; xem ID token và access token | 35 |
| 2 | Checklist SSO: redirect URI, PKCE, state/nonce, nơi lưu token, logout, hết hạn phiên | 15 |
| 3 | Unit test quy tắc + integration test HTTP và store (TestBed, `HttpTestingController`) | 30 |
| 4 | Playwright: hành trình Agent tạo → Manager duyệt; test API từ chối sai quyền (403) | 30 |
| 5 | Test report, viết regression test cho một lỗi đã gặp trong khóa | 10 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Chế độ xác thực trong cấu hình runtime | `frontend/libs/shared/util-config/src/lib/app-config.ts` (`auth.mode`) |
| E2E hiện có | `frontend/apps/portal-e2e/src/` (`login.spec.ts`, `i18n.spec.ts`, `theme.spec.ts`) |
| Unit test auth hiện có | `frontend/libs/shared/data-access-auth/src/lib/*.spec.ts` |
| Integration test backend (Testcontainers) | `backend/src/test/` |

## Cần chuẩn bị trước khi soạn chi tiết

- [ ] Thêm service `keycloak` vào `infra/docker-compose.yml` dưới `profiles: [sso]`, kèm file realm export (`infra/keycloak/care-realm.json`). Kiểm tra image chạy được khi mạng có proxy.
- [ ] Chọn và khóa phiên bản thư viện OIDC tương thích Angular 22.
- [ ] Lib `shared-data-access-auth` hỗ trợ hai chế độ (local JWT, OIDC) sau một port chung, cùng ý tưởng port/adapter của buổi 1.
- [ ] Playwright cài trình duyệt trước (`npx playwright install chromium`) vì tải trong lớp có thể chậm.
- [ ] Mẫu test report và checklist SSO trong `solution/`.

## Tài liệu

| | |
|---|---|
| Slide | `slides/` (chưa soạn) |
| Lab | `lab/` (chưa soạn) |
| Đáp án | `solution/` (chưa soạn) |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) |
| Bài tập về nhà | `../bai-tap-ve-nha/buoi-07-<chu-de>.html` (chưa soạn) |
