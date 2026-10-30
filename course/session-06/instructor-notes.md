# Buổi 06 — Ghi chú giảng viên

## Trước buổi học

**Vài ngày trước:**
- Nhắc học viên: buổi này phải **build lại** `api` (có bảng `refresh_token` mới), lệnh dưới. Máy chậm build mất vài phút.
- Thu bảng benchmark buổi 5 (`docs/benchmark-buoi-05.md`).

**Ngày học:**
- [ ] `git checkout session06-start`
- [ ] `ACCESS_TOKEN_TTL=30s docker compose -f infra/docker-compose.yml up -d --build api`
- [ ] `docker compose -f infra/docker-compose.yml logs api | grep "refresh token"`: Flyway đã chạy `5 - refresh token`
- [ ] `cd frontend && npm ci && npm start`, đăng nhập `agent1`, chờ 45 giây, bấm vào một thuê bao: **phải** bị đá về đăng nhập (đây là lỗi cần thấy)
- [ ] Terminal sẵn: `docker compose -f infra/docker-compose.yml logs -f api | grep --line-buffered "dung lai"`
- [ ] Trình duyệt: DevTools mở Network (lọc `api`) và Application → Session Storage
- [ ] Nhánh `session06-end` để chuyển sang ở bước 5 của demo
- [ ] Sau buổi: `docker compose -f infra/docker-compose.yml up -d api` (về 15 phút)

## Timeline (4 giờ)

| Thời gian | Nội dung | Slide | Ghi chú |
|---|---|---|---|
| 0:00–0:20 | Review buổi 5, use case | 1–4 | Cho cả lớp làm bước "tái hiện lỗi" ngay (5 phút). Hỏi: "Refresh lần 1 đã 200, vì sao vẫn bị đá ra?" Để câu hỏi treo |
| 0:20–1:00 | Khái niệm | 5–20 | Ranh giới tin cậy, 401/403/409 (5–6) · JWT và kiểm tra claim (7–8) · hai loại token, rotation (9–10) · trả lời use case, refresh dùng chung, Bearer (11–14) · nơi lưu token, XSS, CSRF (15–17) · CORS, HTTPS (18–19) · ma trận (20) |
| 1:00–1:30 | Live demo | 21 | 5 bước, cho lớp dự đoán status trước mỗi lệnh curl |
| 1:30–1:40 | **Nghỉ** | | |
| 1:40–3:40 | **Lab** 5 bài | 22–23 | Mốc nhắc: 2:05 sang Bài 2, 2:45 sang Bài 3, 3:10 sang Bài 4, 3:25 sang Bài 5 |
| 3:40–4:00 | Review chéo | 24 | Câu hỏi chốt: "Đổi sang cookie `HttpOnly` thì ma trận phải thêm dòng nào?"; giao bài tập về nhà |

## Kịch bản demo

Chuẩn bị biến cho curl (terminal):
```bash
login() { curl -s -XPOST localhost:8081/api/auth/login -H 'Content-Type: application/json' \
  -d "{\"username\":\"$1\",\"password\":\"$1\"}"; }
A=$(login agent1 | jq -r .accessToken); S=$(login supervisor1 | jq -r .accessToken)
T=$(curl -s "localhost:8081/api/tickets?status=RESOLVED&size=1" -H "Authorization: Bearer $S" | jq '.content[0] | {id, version}')
```

1. **JWT (5 phút).** Copy access token từ Session Storage, dán vào jwt.io (hoặc `echo $A | cut -d. -f2 | base64 -d`). Chỉ `exp - iat = 30`,
   `aud`, `token_use`. Sửa `roles` thành `["ADMIN"]` trên jwt.io (signature giữ nguyên), gọi `/api/admin/stats` → 401. Hỏi: "Sao server biết?"
2. **403 và 409 (5 phút).** `curl -XPOST localhost:8081/api/tickets/<id>/approve -H "Authorization: Bearer $A" -H 'Content-Type: application/json' -d '{"version":<v>}'`
   → 403. Cùng lệnh với `$S` và `version + 1` → 409. Nhấn mạnh: UI đã ẩn nút, nhưng chỉ API mới chặn được.
3. **Tranh chấp refresh (8 phút).** Trình duyệt: chờ 45 giây, bấm thuê bao. Network: 2 request 401, `refresh` 200 rồi 401; terminal log
   hiện "bi dung lai -> thu hoi ho". Mở slide 11 giải thích. Hỏi: "Lỗi ở backend hay frontend?"
4. **Token bị lộ (7 phút).** Đăng nhập lại. Copy `refreshToken` trong Session Storage, curl refresh (bạn là kẻ gian, nhận token mới).
   Chờ 45 giây, thao tác trong app → bị đá ra. Curl lại bằng token **mới** của kẻ gian → cũng 401. "Cả hai mất phiên; người dùng đăng
   nhập lại được, kẻ gian thì không."
5. **Sau khi sửa (5 phút).** `git checkout session06-end` (dev server tự build lại), làm lại 3 và 4: một refresh; bị lộ thì về đăng nhập
   kèm thông báo "Phiên đăng nhập đã hết hạn", đăng nhập xong về đúng trang. Trả về `session06-start` trước lab.

## Điểm cần nhấn mạnh

- **Ẩn nút không phải là phân quyền.** Mọi kiểm tra quyền phải có ở API và có test chứng minh (ma trận #9).
- **Refresh đồng thời là bài toán thật.** Không dùng chung thì N request sinh N refresh; với rotation thì N−1 cái bị coi là reuse
  và người dùng bị đăng xuất. Backend đúng mà sản phẩm vẫn lỗi.
- **Side effect đặt ở phần dùng chung.** Đăng xuất trong `catchError` của từng request = N lần điều hướng.
- **Token trong storage đọc được bằng JS:** XSS là đủ để lộ. Cookie `HttpOnly` đổi rủi ro XSS lấy rủi ro CSRF. Không có lựa chọn
  "an toàn tuyệt đối", chỉ có lựa chọn có điều kiện.
- **CORS không phải phân quyền** (ma trận #18).
- **Không bao giờ đặt secretKey trong code client:** điều kiện bắt buộc của bài cuối khóa.

## Câu hỏi học viên hay hỏi

| Câu hỏi | Gợi ý trả lời |
|---|---|
| Sao không refresh chủ động trước khi hết hạn (đọc `exp`)? | Làm được (timer trước `exp` vài giây), giảm số 401. Nhưng vẫn phải xử lý 401 (clock skew giữa máy và server, token bị revoke, tab ngủ). Lab làm phần bắt buộc trước. |
| Mở 2 tab thì sao? | Mỗi tab một `sessionStorage`, một token family riêng (đăng nhập riêng). Dùng `localStorage` chung giữa tab thì 2 tab có thể refresh cùng lúc → reuse. Cần khóa giữa tab (`navigator.locks`, `BroadcastChannel`) hoặc cookie/BFF. |
| Server có nên cho "khoảng ân hạn" khi dùng lại refresh token? | Một số nhà cung cấp cho dùng lại trong vài giây để chịu được mạng chập chờn. Đổi lại kẻ gian cũng có vài giây. Care Portal chọn nghiêm (0 giây) để lỗi frontend lộ ra. |
| Sao access token không revoke được khi đăng xuất? | Stateless: server không tra DB mỗi request. Muốn revoke tức thì: danh sách đen theo `jti` hoặc introspection, đổi lại mỗi request tốn một lần tra cứu. TTL ngắn là thỏa hiệp. |
| HS256 hay RS256? | HS256: một key vừa ký vừa kiểm, hợp khi chỉ một service. RS256: private key ký, public key kiểm (JWKS), hợp nhiều service hoặc SSO. Buổi 7 Keycloak dùng RS256. |
| Interceptor có nên tự retry 403? | Không. 403 nghĩa là token hợp lệ nhưng không đủ quyền; refresh ra token cùng role. |
| Dùng `localStorage` có sao không? | Rủi ro XSS như `sessionStorage`, thêm: còn sau khi đóng trình duyệt (máy dùng chung ở quầy giao dịch), chia sẻ giữa tab. Ứng dụng CSKH dùng chung máy → không nên. |

## Lỗi thường gặp khi làm lab

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Không bao giờ thấy 401 | `api` chưa build lại / chưa truyền `ACCESS_TOKEN_TTL=30s`; chờ chưa đủ 40 giây | Chạy lại lệnh `--build`; `curl` login xem `expiresIn` = 30 |
| Lỗi Flyway khi `api` khởi động | Volume DB đã chạy migration lạ từ trước | `docker compose -f infra/docker-compose.yml down -v` rồi `up -d --build` (về dump gốc) |
| Mọi refresh đều 401 | Học viên "dọn" code và gắn lại Bearer cho `/api/auth/*` | Không gắn token cho endpoint xác thực (Spring từ chối Bearer hết hạn kể cả ở `permitAll`) |
| Test "3 request" vẫn 3 refresh | `refresh()` tạo observable mới mỗi lần; quên `??=` | Giữ observable đang chạy trong field |
| Test "lần hết hạn sau" đỏ | Quên `finalize` reset, hoặc dùng `shareReplay(1)` | Xem bảng "thử phá" trong đáp án |
| `NG04002: Cannot match any routes. URL Segment: 'login'` trong test | `logout()` điều hướng mà test không có route `login` | `provideRouter([{ path: 'login', children: [] }])` |
| Vòng lặp 401 → refresh → 401 | Gửi lại bằng `HttpClient` (đi lại qua interceptor) thay vì `next(...)`; hoặc refresh cả khi 403 | Gửi lại bằng `next(...)`, chỉ xử lý 401 |
| Ma trận #6 vẫn 200 | `exp` chỉ lùi 1–5 giây, còn trong 10 giây clock skew cho phép | Lùi ≥ 15 giây |
| Ma trận #17 kỳ vọng 401 | Nhầm CORS với xác thực | Preflight bị từ chối trả 403, không liên quan token |

## Sau buổi học

- Giao bài tập về nhà: [../bai-tap-ve-nha/buoi-06-xac-thuc-va-bao-mat-api.html](../bai-tap-ve-nha/buoi-06-xac-thuc-va-bao-mat-api.html)
  (khoảng 30 phút, nộp trước buổi 7).
- Thu `docs/ma-tran-bao-mat.md`, `api-matrix.spec.ts` và `docs/vong-doi-phien.md` của các nhóm.
- Buổi 7 bắt đầu từ `session07-start` = `session06-end` + phần chuẩn bị (Keycloak dưới profile `sso`).
