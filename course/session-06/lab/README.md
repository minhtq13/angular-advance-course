# Lab buổi 6 — Authentication và bảo mật giao tiếp API

**Thời gian:** 120 phút · **Điểm xuất phát:** `git checkout session06-start`

**Use case.** Nhân viên CSKH phàn nàn: "đang làm thì bị đá ra trang đăng nhập". Backend đã có refresh token **rotation**: mỗi refresh
token chỉ đổi được một lần, gửi lại token đã dùng thì server coi là bị lộ và **revoke cả phiên**. Frontend đã có refresh khi gặp 401,
nhưng mỗi request tự refresh riêng. Lab này chứng minh bằng test rằng server chặn đúng, rồi sửa frontend: một refresh dùng chung,
đăng xuất sạch khi refresh bị từ chối, và không gửi Bearer ra ngoài API.

**Sản phẩm nộp cuối buổi:** `docs/ma-tran-bao-mat.md` + `apps/portal-e2e/src/security/api-matrix.spec.ts` (ma trận chạy lại được),
test refresh đồng thời trong `auth.interceptor.spec.ts`, `docs/vong-doi-phien.md` (sơ đồ trình tự, so sánh nơi lưu token).

Trước khi bắt đầu:
```bash
git checkout session06-start
# Build lại api (có bảng refresh_token mới) và rút ngắn access token xuống 30 giây
ACCESS_TOKEN_TTL=30s docker compose -f infra/docker-compose.yml up -d --build api
cd frontend && npm ci && npm start
```

> Server cho clock skew 10 giây: token 30 giây thực tế bị từ chối sau khoảng **40 giây**. Khi thử, chờ 45 giây.
> Sau buổi học: `docker compose -f infra/docker-compose.yml up -d api` để về 15 phút.

**Tái hiện lỗi (5 phút, trước Bài 1).** Đăng nhập `agent1`, mở DevTools → Network, lọc `api`. Ở trang Thuê bao chờ 45 giây, bấm vào
một thuê bao. Ghi lại: các request 401, **hai** lần `POST /api/auth/refresh` (200 rồi 401), trang đăng nhập. Xem log server:
`docker compose -f infra/docker-compose.yml logs api | grep "dung lai"`.

---

## Bài 1 — Ma trận kiểm thử bảo mật (25 phút)

1. Tạo `docs/ma-tran-bao-mat.md` theo mẫu `course/_templates/test-matrix.md`. Mỗi dòng có: tình huống, vai trò, đầu vào, kỳ vọng
   (HTTP), tầng test, kết quả.
2. Tạo `apps/portal-e2e/src/security/api-matrix.spec.ts`, dùng fixture `request` của Playwright gọi thẳng backend
   (`test.use({ baseURL: 'http://localhost:8081' })`). Tối thiểu các dòng:

   | Nhóm | Tình huống | Kỳ vọng |
   |---|---|---|
   | 401 | Không token; token rác; refresh token dùng làm Bearer | 401 |
   | 401 | Sửa payload thành `roles: ["ADMIN"]`, giữ nguyên signature, gọi `/api/admin/stats` | 401 |
   | 403 | `agent1` gọi `POST /api/tickets/{id}/approve` với `version` đúng; kiểm tra phiếu **không đổi** | 403 |
   | 409 | `supervisor1` duyệt bằng `version` sai; phiếu không đổi | 409 |
   | Rotation | Refresh R1 → R2; refresh R1 lần nữa; rồi refresh R2 | 200, 401, 401 |
   | Rotation | 3 refresh **song song** cùng một token (`Promise.all`) | đúng một 200 |
   | Logout | `POST /api/auth/logout {refreshToken}` rồi refresh bằng token đó | 204, 401 |
   | CORS | Preflight `OPTIONS` với `Origin: http://localhost:4200` và `Origin: https://evil.example` | 200 có `Access-Control-Allow-Origin`; 403 không có |

   Gợi ý: lấy phiếu `RESOLVED` bằng `GET /api/tickets?status=RESOLVED&size=1`; sửa payload bằng
   `Buffer.from(JSON.stringify(...)).toString('base64url')`.
3. Chạy: `npx playwright test -c apps/portal-e2e/playwright.config.mts security --project=chromium`.
4. **Mở rộng (nếu còn thời gian):** tự ký token bằng `createHmac('sha256', <key DEV trong application.yml>)` để thử riêng từng claim:
   hết hạn 15 giây, `aud` sai, `iss` sai. Thêm dòng "sau khi đăng xuất, access token cũ còn dùng được không?" và giải thích kết quả.

---

## Bài 2 — Refresh dùng chung (40 phút)

File: `libs/shared/data-access-auth/src/lib/auth.service.ts`, `auth.interceptor.ts`, `auth.interceptor.spec.ts`.

1. Đọc `auth.interceptor.spec.ts` ở điểm bắt đầu: dùng `AuthService` **thật** + `HttpTestingController`, phiên giả có access `A1`,
   refresh `R1`. Chạy `npx nx test shared-data-access-auth`: xanh.
2. **Test đỏ 1:** 3 request (`/api/subscribers/1`, `/api/tickets`, `/api/service-plans`) cùng nhận 401
   → `http.expectOne(REFRESH_URL)` (đúng **một** refresh) → flush token mới `A2`/`R2` → cả 3 request được gửi lại với `Bearer A2` và
   trả kết quả. Chạy: lỗi `Expected one matching request ... found 3 requests`.
3. **Test đỏ 2 (401 về muộn):** gửi 2 request; request A nhận 401, refresh xong, A gửi lại thành công. **Sau đó** request B mới nhận
   401 (nó đã gửi bằng `A1` từ trước) → `http.expectNone(REFRESH_URL)`, B được gửi lại với `A2`.
4. **Test hàng rào:** refresh xong, lần hết hạn sau phải gửi refresh **mới** với `R2` (không dùng lại kết quả cũ, không gửi lại `R1`).
5. Sửa:
   - `AuthService.refresh()`: giữ observable đang chạy trong một field; mọi người gọi trong lúc chờ nhận **cùng** observable
     (`share()`); xong (thành công hay lỗi) thì xóa field (`finalize`) để lần sau tạo request mới.
   - Interceptor: khi 401, nếu `auth.accessToken()` đã khác token request này đã gửi → dùng luôn token hiện tại, không refresh.
   - Gửi lại request bằng `next(...)` (không qua `HttpClient`), **một lần**.
6. Thử phá: bỏ `finalize`, hoặc đổi `share()` thành `shareReplay(1)`. Test nào đỏ? Vì sao? Ghi vào báo cáo.
7. Kiểm tra trên trình duyệt: làm lại bước tái hiện lỗi. Network chỉ còn **một** refresh (200), trang chi tiết hiện đủ dữ liệu.

---

## Bài 3 — Refresh lỗi và token reuse (25 phút)

1. **Test đỏ:** 3 request cùng chờ, refresh trả **401** → cả 3 nhận lỗi; `router.navigate` được gọi **một lần** với
   `['/login'], { queryParams: { returnUrl: <url hiện tại>, reason: 'expired' } }`; `sessionStorage` không còn `care.auth`.
   (Giả lập URL hiện tại: `vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue('/tickets?status=NEW')`.)
2. **Test đỏ:** refresh lỗi **mạng** (`.error(new ProgressEvent('error'), { status: 0 })`) → **không** đăng xuất.
3. **Test đỏ:** 401 về muộn sau khi phiên đã kết thúc → không gửi refresh nữa.
4. **Test đỏ** (`auth.service.spec.ts`): `logout()` gửi `POST /api/auth/logout` với refresh token, xóa phiên ngay, server trả 500 vẫn
   đăng xuất.
5. Sửa:
   - Đưa việc đăng xuất vào **phần dùng chung** (`tap({ error })` trong `AuthService.refresh`), chỉ khi status 401. Bỏ `auth.login()`
     khỏi interceptor.
   - `login(returnUrl, reason?)` thêm `reason` vào query params. `logout()` gọi `/api/auth/logout` (không chờ).
   - Trang đăng nhập: input `reason`; `reason === 'expired'` thì hiện `nz-alert` cảnh báo với key `auth.sessionExpired`
     (thêm vào **cả** `vi.json` và `en.json`). Test component cho cả hai trường hợp.
6. **Thử token bị lộ trên trình duyệt:** đăng nhập, copy `refreshToken` trong DevTools → Application → Session Storage, chạy
   ```bash
   curl -X POST localhost:8081/api/auth/refresh -H 'Content-Type: application/json' -d '{"refreshToken":"<dán vào đây>"}'
   ```
   (bạn là "kẻ gian", nhận token mới). Chờ 45 giây, thao tác trong app → về đăng nhập với thông báo phiên hết hạn; đăng nhập lại về đúng
   trang. Gọi lại curl với token **mới** vừa nhận: cũng 401 (cả family đã bị revoke).
7. Danh sách "thuê bao xem gần đây" có bị xóa khi bị đăng xuất không? (Gợi ý: buổi 4, `RecentSubscribers` theo dõi `username`.)

---

## Bài 4 — Bearer đúng phạm vi (15 phút)

1. **Test đỏ** (`auth.interceptor.spec.ts`, `it.each`) với `apiUrl = 'http://api'`, các URL sau **không** được có `Authorization`:
   `http://api.evil.com/api/me`, `http://api@evil.com/api/me`, `http://api:8443/api/me`, `http://apix/api/me`.
2. **Test đỏ:** `apiUrl = ''` (API cùng origin với app, sau reverse proxy ở buổi 9): `/api/me` có Bearer,
   `https://cdn.example.com/logo.png` không có.
3. Sửa: viết hàm thuần `apiPathOf(url, apiUrl, base)` trong `api-url.ts`, dùng `new URL(...)` so **origin** (scheme + host + port) và
   đường dẫn gốc của `apiUrl`; trả đường dẫn bên trong API (vd `/api/tickets`) hoặc `null`. `base` là `inject(DOCUMENT).baseURI`.
   Interceptor dùng kết quả cho cả việc "có gắn token không" và "có phải `/api/auth/` không".
4. `api-url.spec.ts`: `it.each` cho các trường hợp thuộc API (kể cả chữ hoa trong host, `apiUrl` có đường dẫn `/care/`) và không thuộc
   (`/care-evil/`, `//evil.com`, URL hỏng).

---

## Bài 5 — Vòng đời phiên (15 phút)

Viết `docs/vong-doi-phien.md`:
1. Bảng hai loại token: dùng để làm gì, thời hạn, server kiểm tra gì, có revoke được không.
2. Sơ đồ trình tự (Mermaid `sequenceDiagram`): đăng nhập → gọi API → hết hạn với 2 request song song → **một** refresh → gửi lại →
   kẻ gian dùng refresh token trước → app bị revoke → đăng nhập lại → đăng xuất chủ động.
3. Bảng quy tắc ở frontend (tình huống → hành vi → file).
4. So sánh nơi lưu token: biến JS, `sessionStorage`, `localStorage`, cookie `HttpOnly`. Nếu chuyển sang cookie thì phải thêm gì để chống
   CSRF? Angular hỗ trợ sẵn đến đâu (`withXsrfConfiguration`, chỉ URL tương đối)?
5. Một đoạn đề xuất cho Care Portal: giữ như hiện tại hay chuyển sang cookie/BFF, với điều kiện nào.

---

## Kiểm tra cuối lab

```bash
npx nx run-many -t lint test build
npx playwright test -c apps/portal-e2e/playwright.config.mts security --project=chromium
```

## Review chéo (20 phút)

Mỗi nhóm 5 phút: chạy ma trận trước lớp, chỉ dòng 403 (và chứng minh dữ liệu không đổi), chạy test "3 request → 1 refresh", trình bày
sơ đồ vòng đời. Nhóm khác hỏi: "Nếu đổi sang cookie `HttpOnly`, dòng nào trong ma trận phải thêm?"

## Đáp án

Đáp án nằm trong [`../solution/`](../solution/). Chỉ mở sau khi đã tự làm.
