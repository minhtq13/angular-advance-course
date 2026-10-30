# Buổi 07 — Ghi chú giảng viên

## Trước buổi học

**Vài ngày trước:**
- Nhắc học viên tải sẵn image Keycloak (~475 MB) và trình duyệt Playwright, mạng lớp có thể chậm:
  `docker pull quay.io/keycloak/keycloak:26.8.1` và `cd frontend && npx playwright install chromium`.
- Nếu mạng công ty chặn `quay.io`: hỏi VNPT có registry nội bộ (Nexus) không, đổi `image:` trong `infra/docker-compose.yml`.
- Thu `docs/ma-tran-bao-mat.md` và `docs/vong-doi-phien.md` của buổi 6.

**Ngày học:**
- [ ] `git checkout session07-start`
- [ ] `docker compose -f infra/docker-compose.yml --profile sso up -d --build` (build lại `api`: có code nhận token Keycloak)
- [ ] Đợi Keycloak: `curl -s localhost:8180/realms/care/.well-known/openid-configuration | jq .issuer` → `"http://localhost:8180/realms/care"`
- [ ] `cd frontend && npm ci && npm start` (cổng **4200**: realm chỉ cho redirect về 4200)
- [ ] Sửa `apps/portal/public/config.json` thêm `"auth": { "mode": "oidc", "authority": "http://localhost:8180/realms/care", "clientId": "care-portal" }`,
      đăng nhập SSO `agent1`: **phải** thấy "Không tải được danh sách thuê bao" (lỗi cần thấy). Trả `config.json` về như cũ
- [ ] Trình duyệt: DevTools → Network bật **Preserve log**; một cửa sổ ẩn danh riêng cho demo máy dùng chung
- [ ] Terminal: biến cho curl ở mục Kịch bản demo
- [ ] Nhánh `session07-end` để chuyển sang ở bước 5 của demo

## Timeline (4 giờ)

| Thời gian | Nội dung | Slide | Ghi chú |
|---|---|---|---|
| 0:00–0:20 | Review buổi 6, use case | 1–5 | Slide 4: để câu hỏi "còn API nào khác đổi trạng thái phiếu?" treo tới slide 23. Slide 5: chỉ nêu triệu chứng, chưa giải thích |
| 0:20–1:00 | Khái niệm | 6–24 | OIDC: bốn vai, Code + PKCE, state/nonce (6–9) · hai loại token, lỗi 1 (10–11) · port/adapter, phía API (12–13) · logout, SPA/BFF (14–15) · tháp kiểm thử, unit, integration (16–19) · assertion yếu, thử phá (20–21) · E2E, quyền ở API, regression (22–24) |
| 1:00–1:30 | Live demo | 25 | 5 bước; cho lớp đoán kết quả trước mỗi bước |
| 1:30–1:40 | **Nghỉ** | | |
| 1:40–3:40 | **Lab** 5 bài | 26 | Mốc nhắc: 2:15 sang Bài 2, 2:35 sang Bài 3, 3:05 sang Bài 4, 3:30 sang Bài 5 |
| 3:40–4:00 | Review chéo, chốt | 27 | Câu hỏi chốt: "Lỗi PATCH có từ buổi 2, vì sao 6 buổi không ai thấy?"; giao bài tập về nhà |

## Kịch bản demo

Chuẩn bị (terminal, trong thư mục repo):
```bash
B=http://localhost:8180/realms/care/protocol/openid-connect
login() { curl -s -XPOST localhost:8081/api/auth/login -H 'Content-Type: application/json' \
  -d "{\"username\":\"$1\",\"password\":\"$1\"}" | jq -r .accessToken; }
A=$(login agent1)
T=$(curl -s "localhost:8081/api/tickets?status=RESOLVED&size=1" -H "Authorization: Bearer $A" | jq '.content[0] | {id, version}'); echo $T
```

1. **Đăng nhập SSO, 401 (8 phút).** Đổi `config.json` sang OIDC, tải lại. Vào `/tickets?status=RESOLVED` → Đăng nhập bằng SSO. Trên Network
   chỉ lần lượt: `/auth?...code_challenge=...&code_challenge_method=S256&state=...&nonce=...` → form Keycloak → `/auth/callback?code=...` →
   `POST /token` (body có `code_verifier`). Rồi `GET /api/tickets` 401: đọc `WWW-Authenticate` (`The aud claim is not valid`). Console:
   `JSON.parse(atob('<phần giữa của token>'.replace(/-/g,'+').replace(/_/g,'/')))` cho token trong header, so với `id_token` và `access_token`
   trong response `/token`. Hỏi: "Token nào app đang gửi? API sai hay app sai?" Mở slide 10–11.
2. **Máy dùng chung (5 phút).** Menu tài khoản → Đăng xuất → Đăng nhập bằng SSO: vào thẳng, không hỏi mật khẩu. Network: `/auth` → **302**.
   Application → Cookies → `localhost:8180`, path `/realms/care/`: `KEYCLOAK_IDENTITY` (HttpOnly) và `KEYCLOAK_SESSION` vẫn còn. Hỏi lớp: "Nếu đây là quầy giao dịch, chuyện gì xảy ra lúc đổi ca?"
3. **Keycloak từ chối gì (5 phút).** Cho lớp đoán trước từng lệnh:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" "$B/auth?client_id=care-portal&response_type=code&scope=openid&redirect_uri=http://evil.example/cb&code_challenge=x&code_challenge_method=S256&state=s"   # 400
   curl -s -o /dev/null -w "%{redirect_url}\n" "$B/auth?client_id=care-portal&response_type=code&scope=openid&redirect_uri=http://localhost:4200/auth/callback&state=s"   # ...error_description=Missing+parameter:+code_challenge_method
   curl -s -X POST $B/token -d grant_type=password -d client_id=care-portal -d username=agent1 -d password=agent1   # unauthorized_client
   ```
4. **Test xanh mà vô dụng (7 phút).** `cd frontend && npx nx test portal`: 4 test xanh. Mở `apps/portal/src/app/ticket-approval.spec.ts`, đọc to 3 assertion.
   Sửa `ticket-list.page.ts`: nhánh `error` luôn trả `{ key: 'common.genericError' }` (M3). Chạy lại: **vẫn xanh**, kể cả 39 test của
   `npx nx test portal-feature-tickets`. Hoàn lại. Sửa `ticket-list.page.html`: `[canApprove]="t.status === 'RESOLVED'"` (M4): vẫn xanh. Hoàn lại.
5. **Lỗi quyền (5 phút).** Câu hỏi treo từ slide 4:
   ```bash
   curl -s -XPATCH localhost:8081/api/tickets/$(echo $T | jq .id) -H "Authorization: Bearer $A" -H 'Content-Type: application/json' \
     -d "{\"status\":\"CLOSED\",\"version\":$(echo $T | jq .version)}" | jq '{code, status}'     # 200, status CLOSED
   ```
   Agent vừa đóng phiếu mà không cần Manager. (Lệnh này đóng thật một phiếu của dữ liệu mẫu.) Nếu còn thời gian: `git checkout session07-end`,
   `docker compose -f infra/docker-compose.yml up -d --build api`, chạy lại với phiếu RESOLVED khác → 403.

## Điểm cần nhấn mạnh

- **PKCE bắt buộc cho SPA:** client public không giữ được secret; `code` lộ được nhưng vô dụng nếu thiếu `code_verifier`.
- **ID token cho app, access token cho API.** API kiểm `aud` thì gửi nhầm lộ ra ngay; API không kiểm `aud` thì nhận cả token phát cho app khác.
- **Đăng xuất SSO phải kết thúc phiên ở máy chủ định danh.** Phiên SSO sống lâu hơn token của app.
- **BFF an toàn hơn về token** nhưng cần thêm server và chống CSRF; chọn theo rủi ro, ghi ADR.
- **E2E đắt:** chỉ cho hành trình quan trọng. Quy tắc nghiệp vụ test ở tầng unit (M4 trước đây chỉ E2E bắt được).
- **Test quyền phải đi thẳng vào API.** Giao diện không có nút đóng phiếu nên 5 buổi test qua UI không thấy lỗi PATCH.
- **Test chỉ đáng tin khi đã thấy nó đỏ.** Thử phá là cách rẻ nhất để đo chất lượng assertion.

## Câu hỏi học viên hay hỏi

| Câu hỏi | Gợi ý trả lời |
|---|---|
| Sao không dùng Implicit flow cho SPA như tài liệu cũ? | Implicit trả token thẳng trên URL (lộ qua lịch sử, Referer), không có refresh token; OAuth 2.0 Security BCP khuyến nghị bỏ. Realm đã tắt: `Implicit flow is disabled` |
| App đọc vai trò từ ID token, kẻ gian sửa token trong sessionStorage thì sao? | Chỉ đổi được giao diện của chính họ (hiện nút). API đọc vai trò từ **access token** đã ký, sửa là sai signature → 401. Ranh giới tin cậy của buổi 6 |
| Tại sao không lấy vai trò từ access token cho tiện? | Access token dành cho API, định dạng có thể đổi (vd opaque token). App chỉ nên dựa vào ID token hoặc `/userinfo` |
| `state` và PKCE trùng nhau? | Khác: PKCE chống người khác đổi `code` **của bạn**; `state` chống bạn bị nhét `code` **của người khác** (login CSRF). Keycloak còn kiểm `nonce` trong ID token |
| Keycloak ở production cấu hình gì khác? | HTTPS (`sslRequired: external`), DB riêng (không `start-dev`), không bật admin mặc định, redirect URI theo domain thật, token TTL theo chính sách |
| Có cần backend xử lý logout không? | Access token Keycloak stateless (5 phút) như buổi 6. Logout revoke refresh token và kết thúc phiên SSO; access token đã phát còn dùng được tới hết hạn: ghi vào rủi ro còn lại |
| Stryker có dùng được với Angular/Vitest không? | Có (Stryker Mutator hỗ trợ Vitest). Chạy chậm với codebase lớn; bắt đầu bằng một lib quan trọng |
| Vì sao integration test đặt ở `apps/portal` mà không ở `feature-tickets`? | Lib feature bị luật Nx cấm import `@angular/common/http` (buổi 1). App là composition root, nơi nối adapter HTTP thật |

## Lỗi thường gặp khi làm lab

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Keycloak: "Invalid parameter: redirect_uri" khi bấm SSO | Portal chạy cổng khác 4200 | Chạy `npm start` (4200), hoặc thêm URI trong admin console (chỉ máy mình) |
| Bấm SSO không có gì, Console lỗi CORS ở `.well-known` | Keycloak chưa sẵn sàng, hoặc portal không ở 4200 (`webOrigins`) | Đợi `curl .well-known` trả JSON; kiểm tra cổng |
| Sửa `config.json` không có tác dụng | Trình duyệt cache | Tải lại cứng; `loadAppConfig` đã dùng `cache: 'no-cache'`, kiểm tra đúng file `apps/portal/public/config.json` |
| Token Keycloak gọi API vẫn 401 dù đã sửa Bài 1 | `api` chưa build lại (code buổi 6 không biết Keycloak) | `docker compose -f infra/docker-compose.yml up -d --build api` |
| Keycloak mất dữ liệu sau khi restart | Không có volume: cố ý, mỗi lần tạo container import lại realm | Bình thường. Muốn reset: `docker compose ... --profile sso up -d --force-recreate keycloak` |
| E2E SSO bị skip | Thiếu `SSO=1` | `SSO=1 npx playwright test ... sso` |
| `response.json: No data found for resource` | Đọc body sau khi trang đã chuyển | Đọc trong `.then` của `waitForResponse` (xem đáp án Bài 4) |
| Test agent "không thấy nút" xanh cả khi phá M4 | Danh sách chưa được `flush` | Flush danh sách và kiểm 1 dòng hiện ra trước khi đếm nút |
| `this.auth.roles is not a function` sau khi tách `canApprove` | Mock `AuthService` cũ chỉ có `hasAnyRole` | Thêm `roles: signal([...])` vào mock trong `ticket-list.page.spec.ts`, `ticket-list.url.spec.ts` |
| `role-denial.spec.ts` vẫn 200 sau khi sửa Java | Chưa build lại `api` | `--build api`, đợi health UP |
