# Đáp án lab buổi 6

## Áp đáp án vào code

Trong thư mục gốc repo, từ `session06-start`:

```bash
git apply course/session-06/solution/bai2-refresh-dung-chung.patch
git apply course/session-06/solution/bai3-refresh-loi-va-dang-xuat.patch
git apply course/session-06/solution/bai4-bearer-dung-pham-vi.patch
git apply course/session-06/solution/bai1-5-ma-tran-va-vong-doi-phien.patch
```

Gỡ theo thứ tự ngược lại. Bản đã áp đủ là nhánh `session06-end`.

Đã kiểm tra: sau **từng** patch, `nx run-many -t lint test build` pass (16 project); áp đủ ra đúng `session06-end`, gỡ ra về đúng
`session06-start`. Mỗi test trong Bài 2–4 được viết trước và **đỏ** trên code chưa sửa. Hành vi trên trình duyệt kiểm tra bằng Playwright
với backend thật (`ACCESS_TOKEN_TTL=30s`); toàn bộ e2e cũ vẫn pass.

---

## Tái hiện lỗi (điểm bắt đầu)

Trình duyệt thật, chờ 45 giây, bấm vào thuê bao (trang chi tiết gọi 2 request):

| | Điểm bắt đầu | Sau Bài 2 |
|---|---|---|
| `POST /api/auth/refresh` | **200, 401** | **200** |
| Kết thúc ở | `/login?returnUrl=%2Fsubscribers%2F2000` | `/subscribers/2000`, đủ dữ liệu |
| Log API | `Refresh token ... cua agent1 bi dung lai -> thu hoi ho ...` | (không có) |

---

## Bài 1 — Ma trận kiểm thử bảo mật

- `docs/ma-tran-bao-mat.md`: 25 dòng (18 API + 7 frontend) và mục "Rủi ro còn lại".
- `apps/portal-e2e/src/security/api-matrix.spec.ts`: 18 test Playwright `request`, chạy dưới 1 giây, không cần trình duyệt.
  Tự ký JWT bằng `createHmac` với key DEV (đọc `JWT_SECRET`, mặc định key trong `application.yml`) để thử riêng `exp`, `aud`, `iss`.

Các dòng học viên hay sai:

| Dòng | Sai thường gặp | Đúng |
|---|---|---|
| #6 hết hạn | Ký `exp = now - 1` → vẫn 200 | Clock skew cho phép 10 giây: dùng `now - 15`; có đối chứng "còn hạn → 200" |
| #9 403 | Chỉ kiểm status | Kiểm thêm phiếu vẫn `RESOLVED`, `version` không đổi |
| #11 409 | Dùng phiếu đã `CLOSED` → 409 vì sai trạng thái, không phải vì `version` | Lấy phiếu `RESOLVED`, gửi `version + 1` |
| #13 đồng thời | Gọi tuần tự trong `for` | `Promise.all` |
| #15 | Kỳ vọng 401 | **200**: access token stateless dùng được tới khi hết hạn. Ghi vào "Rủi ro còn lại" |
| #18 CORS | Kết luận "CORS chặn được kẻ tấn công" | curl không gửi `Origin` → 200. CORS chỉ bảo vệ người dùng trình duyệt |

## Bài 2 — Refresh dùng chung

```ts
// auth.service.ts
private refreshing: Observable<string> | null = null;

refresh(): Observable<string> {
  this.refreshing ??= this.http
    .post<TokenResponse>(`${this.apiUrl}/api/auth/refresh`, { refreshToken: this.tokens?.refreshToken })
    .pipe(
      tap((tokens) => this.setTokens(tokens)),
      map((tokens) => tokens.accessToken),
      finalize(() => (this.refreshing = null)),
      share(),
    );
  return this.refreshing;
}
```

```ts
// auth.interceptor.ts, nhanh 401
const current = auth.accessToken();
const freshToken$ = current && current !== token ? of(current) : auth.refresh();
return freshToken$.pipe(switchMap((freshToken) => next(withBearer(req, freshToken))));
```

Test (`auth.interceptor.spec.ts`): "3 request cùng nhận 401 → chỉ MỘT lần refresh", "401 về muộn → không refresh lại", "refresh xong thì
lần hết hạn sau refresh mới". Trên điểm bắt đầu: test 1 đỏ (`found 3 requests`), test 2 đỏ (`found 1`), test 3 xanh (hàng rào).

**Thử phá (bước 6), đã chạy thật:**

| Thay đổi | Test đỏ | Vì sao |
|---|---|---|
| Bỏ `finalize` | "lần hết hạn sau refresh mới" | `share()` tự đăng ký lại nguồn, nhưng body `{ refreshToken: R1 }` đã tạo lúc dựng observable → gửi lại R1 → server coi là reuse |
| `shareReplay(1)` không reset | Nhiều test, gồm "lần hết hạn sau" | Phát lại token `A2` cũ mãi, không bao giờ refresh nữa |

## Bài 3 — Refresh lỗi và token reuse

- `AuthService.refresh`: `tap({ error })` gọi `this.login(this.router.url, 'expired')` **chỉ khi** `HttpErrorResponse` status 401.
  Nằm trong phần dùng chung nên chạy một lần dù bao nhiêu request đang chờ.
- Interceptor: bỏ `inject(Router)` và `auth.login()`; thêm "`accessToken()` rỗng (phiên đã kết thúc) → trả lỗi gốc, không refresh".
- `login(returnUrl, reason?)`, `logout()` gọi `POST /api/auth/logout` (subscribe, nuốt lỗi) rồi xóa phiên.
- `LoginPage`: input `reason`; `nz-alert` `nzType="warning"` với `auth.sessionExpired`; `login.page.spec.ts` 2 test. Key mới ở cả
  `vi.json` và `en.json`. Tương phản đo trên trình duyệt: 20,2:1 (sáng), 15,8:1 (tối).

Kiểm tra trên trình duyệt (token bị lộ): kẻ gian refresh trước → 200; app refresh bằng token cũ → `[401]` → một lần điều hướng tới
`/login?returnUrl=%2Fsubscribers%2F2000&reason=expired`, sessionStorage trống, đăng nhập lại về đúng trang. Đăng xuất: `logout` 204,
không gửi `Authorization`; refresh bằng token cũ sau đó → 401.

Câu 7: có. `RecentSubscribers` (buổi 4) xóa khi `username` đổi, và `clear()` đặt người dùng về `null`.

## Bài 4 — Bearer đúng phạm vi

```ts
export function apiPathOf(url: string, apiUrl: string, base: string): string | null {
  let target: URL;
  let api: URL;
  try {
    target = new URL(url, base);
    api = new URL(apiUrl || '/', base);
  } catch {
    return null;
  }
  const root = api.pathname.replace(/\/$/, '');
  if (target.origin !== api.origin || (target.pathname !== root && !target.pathname.startsWith(`${root}/`))) {
    return null;
  }
  return target.pathname.slice(root.length) || '/';
}
```

Interceptor: `const path = apiPathOf(req.url, apiUrl, inject(DOCUMENT).baseURI); if (path === null || path.startsWith('/api/auth/')) return next(req);`

Trên điểm bắt đầu 5 test đỏ: 4 URL độc (`api.evil.com`, `api@evil.com`, cổng khác, `apix`) và trường hợp `apiUrl` rỗng (CDN nhận token).
URL CDN thường (`https://cdn.example.com`) vốn đã không bị gắn token: lỗi chỉ lộ ra với URL "giống" API.

## Bài 5 — Vòng đời phiên

Bản mẫu: `docs/vong-doi-phien.md` (trong patch cuối): bảng hai loại token, sơ đồ trình tự Mermaid (gồm nhánh kẻ gian), bảng quy tắc
frontend, so sánh 4 nơi lưu token, cookie + CSRF, đề xuất BFF khi đưa ra Internet.

Điểm chấm:
- Sơ đồ có **một** refresh cho nhiều request và nhánh "reuse → revoke cả family".
- Phân biệt được: cookie `HttpOnly` chặn **đọc** token, không chặn XSS **gọi API** trong trang; đổi lại phải chống CSRF.
- Đề xuất có điều kiện ("mạng nội bộ, phiên theo tab → giữ sessionStorage + TTL ngắn + CSP; ra Internet → BFF").

---

## Phần chuẩn bị ở `session06-start` (để giảng viên biết)

| Phần | Thay đổi |
|---|---|
| Backend | Bảng `refresh_token` (Flyway `V5`), `RefreshToken`, `RefreshTokenRepository.markUsed` (một câu `UPDATE` có điều kiện) và `revokeFamily`; `TokenService.login/rotate/revoke`; `POST /api/auth/logout`; claim `jti`, `aud`; clock skew 10 giây (mặc định Spring 60 giây); lỗi refresh trả `auth.sessionExpired`; 4 test mới trong `AuthApiTests` (gồm 3 luồng refresh đồng thời) |
| Hạ tầng | `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL` trong `infra/docker-compose.yml` |
| Frontend | `AuthService.refresh()` (chưa dùng chung), `accessToken()` trả token kể cả đã hết hạn (server quyết định), `init()` giữ phiên nếu refresh token còn hạn; interceptor refresh khi 401 và gửi lại, **không** gắn token cho `/api/auth/*` |
