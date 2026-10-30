# Lab buổi 7 — SSO và chiến lược kiểm thử hệ thống

**Thời gian:** 120 phút · **Điểm xuất phát:** `git checkout session07-start`

**Use case.** VNPT muốn nhân viên CSKH đăng nhập bằng SSO. Portal đã có chế độ OIDC (Keycloak cục bộ, `angular-auth-oidc-client`),
nhưng: đăng nhập xong mọi API 401; quầy dùng máy chung thì người sau vào thẳng tài khoản người trước. Song song, đội QA nghi bộ test
"toàn xanh" không bảo vệ được luồng duyệt phiếu. Lab này sửa SSO bằng test, rồi dựng tháp kiểm thử cho luồng duyệt phiếu và tìm lỗi
quyền ở server.

**Sản phẩm nộp cuối buổi:** `docs/checklist-sso.md` · `docs/bao-cao-kiem-thu.md` · test mới (`oidc-auth.service.spec.ts`,
`ticket.rules.spec.ts`, `ticket-approval.spec.ts`, `sso.spec.ts`, `ticket-approval.journey.spec.ts`, `role-denial.spec.ts`) ·
regression test cho lỗi quyền.

Trước khi bắt đầu:
```bash
git checkout session07-start
# Build lại api (nhận thêm token Keycloak) và bật Keycloak (profile sso, lần đầu tải image ~475 MB)
docker compose -f infra/docker-compose.yml --profile sso up -d --build
cd frontend && npm ci && npx playwright install chromium
npm start
```

Đợi Keycloak sẵn sàng (khoảng 20–40 giây): `curl -s localhost:8180/realms/care/.well-known/openid-configuration` trả JSON.
Admin console: <http://localhost:8180/admin> (`admin`/`admin`), realm **care**, client **care-portal**.

> Mặc định portal vẫn đăng nhập bằng form (JWT do backend phát). Chuyển sang SSO bằng cách sửa `apps/portal/public/config.json`
> (không cần build lại, tải lại trang là được):
> ```json
> {
>   "environmentName": "DEV",
>   "apiUrl": "http://localhost:8081",
>   "auth": { "mode": "oidc", "authority": "http://localhost:8180/realms/care", "clientId": "care-portal" }
> }
> ```
> **Không commit** thay đổi này. Realm chỉ cho redirect về `http://localhost:4200`: chạy portal đúng cổng 4200.

---

## Bài 1 — Đăng nhập Keycloak, ID token và access token (35 phút)

1. Đọc `libs/shared/data-access-auth/src/lib/auth.service.ts` (port), `oidc-auth.service.ts`, `provide-auth.ts`. Trả lời: ai chọn adapter? Feature
   nào phải sửa khi đổi từ local sang OIDC? (Gợi ý: so với `TicketPort` ở buổi 1.)
2. Đổi `config.json` sang OIDC, mở DevTools → Network (bật **Preserve log**). Vào <http://localhost:4200/tickets?status=RESOLVED> → trang đăng nhập
   → **Đăng nhập bằng SSO** → đăng nhập `agent1` trên trang Keycloak. Ghi lại:
   - Request `.../openid-connect/auth?...`: `response_type`, `code_challenge`, `code_challenge_method`, `state`, `nonce`, `redirect_uri`.
   - Callback `/auth/callback?code=...&state=...`, rồi `POST .../token` (body có `code_verifier`; response có `id_token`, `access_token`, `refresh_token`).
   - Có quay về đúng `/tickets?status=RESOLVED` không?
3. Màn hình báo lỗi. Tìm request `GET /api/tickets` bị 401, đọc header response `WWW-Authenticate`. Copy giá trị `Authorization`,
   giải mã phần giữa (`atob` trong Console, hoặc `echo <payload> | base64 -d`). So sánh với `id_token` và `access_token` trong response `/token`:

   | Claim | ID token | Access token |
   |---|---|---|
   | `typ` | | |
   | `aud` | | |
   | `azp`, `nonce`, `at_hash` | | |
   | `roles`, `scope` | | |

   Token nào app đang gửi? Vì sao API từ chối?
4. **Test đỏ** (`oidc-auth.service.spec.ts`, thêm `withInterceptors([authInterceptor])` vào `setup`): sau `init()` với `loggedIn`,
   `HttpClient.get('http://api/api/subscribers')` → header `Authorization` phải là `Bearer ${ACCESS_TOKEN}`. Chạy
   `npx nx test shared-data-access-auth`: đỏ, hai chuỗi base64 khác nhau ở đoạn `typ` (`SUQ...` = `"ID"`).
5. **Test đỏ:** API trả 401 → `forceRefreshSession` trả access token mới → request được gửi lại **bằng access token mới**, refresh đúng một lần.
6. Sửa `OidcAuthService.apply()`: gửi `accessToken` cho API; tên và vai trò vẫn đọc từ ID token. Test xanh, trình duyệt hiện danh sách.
7. (Nếu còn thời gian) `apps/portal-e2e/src/sso/sso.spec.ts`: đăng nhập qua Keycloak, kiểm tra query `/auth` (S256, `state`, `nonce`), quay về đúng URL,
   header của `GET /api/tickets` có `typ: Bearer`, `aud` chứa `care-api`. Chạy:
   `SSO=1 npx playwright test -c apps/portal-e2e/playwright.config.mts sso --project=chromium`.

---

## Bài 2 — Đăng xuất trên máy dùng chung và checklist SSO (20 phút)

1. **Tái hiện:** đăng nhập SSO `agent1` → menu tài khoản → Đăng xuất → bấm **Đăng nhập bằng SSO**. Bạn vào đâu? Trong Network,
   `GET .../openid-connect/auth` trả mã gì? DevTools → Application → Cookies → `localhost:8180`: còn cookie nào?
2. **Test đỏ** (`oidc-auth.service.spec.ts`): `logout()` → không còn user, không còn token, `logoffAndRevokeTokens` được gọi một lần.
3. Sửa `OidcAuthService.logout()`: gọi `logoffAndRevokeTokens()` (revoke token rồi chuyển tới `end_session_endpoint` với `id_token_hint`,
   `post_logout_redirect_uri`). Không tới được Keycloak thì vẫn xóa phiên trong tab.
4. Thử lại bước 1: phải thấy form Keycloak. Network có `POST /revoke` và `GET .../logout?id_token_hint=...`.
5. Viết `docs/checklist-sso.md` theo mẫu: mỗi dòng có **cách kiểm tra** và **kết quả thật**. Ít nhất các mục sau, kiểm tra bằng curl
   (`B=http://localhost:8180/realms/care/protocol/openid-connect`) hoặc E2E:

   | Mục | Gợi ý kiểm tra |
   |---|---|
   | Không có client secret ở frontend | Đọc `config.json`, `provide-auth.ts` |
   | Implicit tắt | `curl -sI "$B/auth?client_id=care-portal&response_type=token&scope=openid&redirect_uri=http://localhost:4200/auth/callback&state=s&nonce=n"` |
   | PKCE bắt buộc, chỉ S256 | Như trên với `response_type=code`, bỏ `code_challenge`; rồi `code_challenge=abc&code_challenge_method=plain` |
   | Password grant tắt | `curl -s -X POST $B/token -d grant_type=password -d client_id=care-portal -d username=agent1 -d password=agent1` |
   | Redirect URI chính xác | `redirect_uri=http://evil.example/cb`, và `http://localhost:4200/auth/callback/../evil` |
   | `state` được kiểm tra | Mở `http://localhost:4200/auth/callback?code=abc&state=gia` |
   | Logout đúng | `post_logout_redirect_uri=http://evil.example/` |
   | Thời hạn, rotation | Giải mã token (`exp - iat`); refresh bằng refresh token cũ hai lần |
   | Nơi lưu token, rủi ro còn lại | DevTools → Session Storage; liên hệ buổi 6 |

---

## Bài 3 — Unit test quy tắc, integration test HTTP và state (30 phút)

File: `apps/portal/src/app/ticket-approval.spec.ts` (integration: route thật + trang + store + adapter HTTP thật + `HttpTestingController`),
`libs/portal/feature-tickets/src/lib/ticket-list/ticket-list.page.{ts,html}`.

1. Chạy `npx nx run-many -t test -p portal portal-feature-tickets`: xanh. Đọc 3 test trong `ticket-approval.spec.ts`. Mỗi test **chứng minh** điều gì?
2. **Thử phá** (sửa tạm, chạy test, rồi hoàn lại). Ghi bảng: test nào đỏ?

   | # | Phá | File |
   |---|---|---|
   | M1 | `.approve(ticket.id, ticket.version)` → `.approve(ticket.id, 0)` | `ticket-list.page.ts` |
   | M2 | Bỏ `this.store.reload();` trong nhánh `next` của `approve` | `ticket-list.page.ts` |
   | M3 | Nhánh `error`: luôn `{ key: 'common.genericError' }` (bỏ lý do từ server) | `ticket-list.page.ts` |
   | M4 | `[canApprove]="isManager() && t.status === 'RESOLVED'"` → `[canApprove]="t.status === 'RESOLVED'"` | `ticket-list.page.html` |

3. **Unit test quy tắc:** tách `canApprove(ticket, roles)` thành hàm thuần trong `libs/portal/domain-tickets/src/lib/ticket.rules.ts`
   (export ở `index.ts`). Test bảng bằng `it.each`: 4 trạng thái × vai trò (có/không `SUPERVISOR`, rỗng, tên gần giống `supervisor`, `SUPERVISOR_X`).
   Trang gọi `canApprove(t, this.auth.roles())`; sửa mock `AuthService` trong các spec của trang (thêm `roles`).
4. **Integration test có giá trị:** viết lại 3 test trong `ticket-approval.spec.ts`:
   - Duyệt: URL `.../api/tickets/42/approve`, body `{ version: 3 }`, sau đó **một** request tải lại với `status=RESOLVED`, màn hình có
     "Đã duyệt phiếu TK-000042".
   - 409: alert có "Không duyệt được phiếu" **và** lý do từ server; không tự tải lại (`expectNone`); bấm "Tải lại danh sách" mới tải.
   - Agent: **danh sách đã hiện** phiếu (1 dòng) rồi mới kết luận không có nút Duyệt. (Test cũ xanh vì danh sách chưa từng được trả về.)
   - `afterEach(() => http.verify())`: không còn request nào chưa xử lý.
5. Chạy lại M1–M4: lần này mỗi chỗ phá phải làm ít nhất một test đỏ. Ghi kết quả vào báo cáo (Bài 5).

---

## Bài 4 — Playwright: hành trình nghiệp vụ và từ chối sai quyền ở server (25 phút)

Chạy với portal chế độ **local** (trả `config.json` về như cũ) và backend `docker compose`.

1. `apps/portal-e2e/src/journeys/ticket-approval.journey.spec.ts`, một test, hai `browser.newContext()`:
   - Agent tạo phiếu trên giao diện (tiêu đề duy nhất, vd thêm `Date.now()`), lấy `id`, `code`, `version` từ response `POST /api/tickets`
     (đọc body **ngay khi** response về: trang chuyển tiếp sẽ làm mất body).
   - Arrange qua API: agent `PATCH /api/tickets/{id}` `{ status: 'RESOLVED', version }` (giao diện chưa có nút này).
   - Manager mở `/tickets?status=RESOLVED`, bấm Duyệt **đúng dòng** có `code`, thấy "Đã duyệt phiếu ...", dòng biến mất.
   - Agent mở `/tickets?status=CLOSED`: dòng có `code` hiện "Đã đóng". Cuối cùng `GET /api/tickets/{id}`: `status: CLOSED`, `version + 2`.
2. `apps/portal-e2e/src/security/role-denial.spec.ts`, gọi thẳng API bằng `request` (`test.use({ baseURL: API })`):
   - Agent `PATCH` phiếu RESOLVED sang `CLOSED` → kỳ vọng **403** và phiếu **không đổi** (`status`, `version`).
   - Manager cũng không đóng bằng `PATCH` (403); đóng qua `POST /approve` thì 200.
3. Chạy: `npx playwright test -c apps/portal-e2e/playwright.config.mts journeys security --project=chromium`.
   Test nào đỏ? Thông báo lỗi là gì? Đây là lỗi thật: ghi vào báo cáo, sửa ở Bài 5.
4. (Mở rộng, chế độ OIDC) Trong `sso.spec.ts`: lấy `access_token` của `agent1` từ response `/token`, gọi thẳng `POST /api/tickets/{id}/approve`
   → 403, phiếu không đổi. Server đọc vai trò từ token Keycloak.

---

## Bài 5 — Sửa lỗi quyền, regression test, báo cáo (10 phút)

1. Sửa `backend/src/main/java/com/careportal/api/ticket/TicketController.java`, thêm một dòng trên `update`:
   ```java
   @PreAuthorize("#request.status() != T(com.careportal.api.ticket.TicketStatus).CLOSED")
   ```
   Build lại (không cần cài Java, Docker build): `docker compose -f infra/docker-compose.yml up -d --build api`.
2. Chạy lại `role-denial.spec.ts`: xanh. Hành trình Bài 4 vẫn xanh (đóng phiếu qua `/approve` không bị ảnh hưởng).
3. Viết `docs/bao-cao-kiem-thu.md` (mẫu `course/_templates/test-matrix.md`): phạm vi rủi ro, tháp kiểm thử (tầng, số test, thời gian chạy thật),
   lỗi tìm được (bằng chứng, cách sửa, test chống tái phát), bảng thử phá trước/sau, rủi ro còn lại.

---

## Kiểm tra cuối lab

```bash
npx nx run-many -t lint test build
npx playwright test -c apps/portal-e2e/playwright.config.mts journeys security --project=chromium
# Chế độ OIDC (config.json) + Keycloak:
SSO=1 npx playwright test -c apps/portal-e2e/playwright.config.mts sso --project=chromium
```

## Review chéo (20 phút)

Mỗi nhóm 5 phút: chạy E2E "máy dùng chung" trước lớp; chỉ một dòng checklist có bằng chứng curl; trình bày bảng thử phá trước/sau.
Nhóm khác hỏi: "Lỗi PATCH đóng phiếu có từ buổi 2, vì sao 6 buổi không ai thấy? Test nào lẽ ra phải có từ đầu?"

## Đáp án

Đáp án nằm trong [`../solution/`](../solution/). Chỉ mở sau khi đã tự làm.
