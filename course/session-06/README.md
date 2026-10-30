# Buổi 06 — Authentication và bảo mật giao tiếp API

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Điểm bắt đầu:** `git checkout session06-start` · **Đáp án:** 4 patch trong `solution/`, bản đầy đủ ở nhánh `session06-end`

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Ranh giới browser và server; authentication, authorization, JWT và kiểm tra claim; access token ngắn hạn, refresh rotation, cookie HttpOnly, CSRF, CORS, HTTPS và hạn chế XSS. |
| Use case và lab | Kiểm tra API trả 401, 403, 409; chia sẻ một refresh cho nhiều request 401; xử lý refresh lỗi, token reuse và ngăn gửi Bearer tới URL ngoài phạm vi. |
| Sản phẩm đầu ra | Ma trận kiểm thử bảo mật, test refresh đồng thời và mô tả vòng đời session. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Vẽ ranh giới tin cậy browser/server: client chỉ để trải nghiệm, server mới quyết định quyền.
2. Đọc và kiểm tra JWT: signature, `exp`, `iss`, `aud`, `roles`; phân biệt 401, 403, 409.
3. Thiết kế vòng đời session: access token ngắn hạn, refresh token rotation và phát hiện reuse.
4. So sánh nơi lưu token (memory, sessionStorage, cookie HttpOnly) cùng rủi ro XSS và CSRF; hiểu CORS, HTTPS.
5. Viết interceptor dùng chung một refresh cho nhiều request 401 đồng thời, và không gửi Bearer ra ngoài `apiUrl`.

## Use case trên Care Portal

Backend đã có refresh token **rotation**: mỗi refresh token đổi được một lần, gửi lại token đã dùng thì server revoke cả phiên.
Frontend ở điểm bắt đầu refresh khi gặp 401 nhưng **mỗi request tự refresh riêng**. Lớp chạy `ACCESS_TOKEN_TTL=30s`.

Lỗi tái hiện được (đã đo trên trình duyệt thật): chờ 45 giây, mở chi tiết thuê bao (2 request song song) → 2 request 401 →
`POST /api/auth/refresh` **200 rồi 401** (lần hai bị coi là reuse) → người dùng bị đá về đăng nhập. Log API:
`Refresh token ... bi dung lai -> thu hoi ho ...`.

Cùng lúc: `agent1` gọi API duyệt phiếu → **403** dù nút đã ẩn; `supervisor1` duyệt bản cũ → **409**; interceptor so
`req.url.startsWith(apiUrl)` nên gắn Bearer cho `http://api.evil.com`, `http://api@evil.com`, và mọi URL khi `apiUrl` rỗng.

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Ma trận kiểm thử bảo mật: 401 (token sửa, hết hạn, sai `aud`), 403, 409, rotation, logout, CORS bằng Playwright `request` | 25 |
| 2 | Refresh dùng chung: test đỏ "3 request 401 → 1 refresh", 401 về muộn; `share` + `finalize` | 40 |
| 3 | Refresh lỗi và token reuse: đăng xuất một lần, `returnUrl`, `reason=expired`, logout revoke ở server | 25 |
| 4 | Bearer đúng phạm vi: `apiPathOf` so origin bằng `URL`, `it.each` URL độc | 15 |
| 5 | `docs/vong-doi-phien.md`: sơ đồ trình tự, so sánh nơi lưu token, cookie HttpOnly + CSRF | 15 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Interceptor gắn Bearer, xử lý 401 | `frontend/libs/shared/data-access-auth/src/lib/auth.interceptor.ts` (+ `.spec.ts`) |
| Lưu phiên, refresh, đăng xuất | `frontend/libs/shared/data-access-auth/src/lib/auth.service.ts`, `jwt.ts` |
| So origin của API (đáp án) | `frontend/libs/shared/data-access-auth/src/lib/api-url.ts` |
| Guard theo role, chống open redirect | `auth.guard.ts`, `role.guard.ts` (`safeReturnUrl`) |
| Phát, rotation, revoke token | `backend/.../auth/TokenService.java`, `RefreshTokenRepository.java`, `AuthController.java`, `V5__refresh_token.sql` |
| Phân quyền, CORS | `backend/.../config/SecurityConfig.java`, `CorsProperties.java` |
| Ma trận kiểm thử (đáp án) | `frontend/apps/portal-e2e/src/security/api-matrix.spec.ts`, `docs/ma-tran-bao-mat.md` |

## Đã chuẩn bị ở `session06-start`

- Đáp án buổi 5 đã áp (`session05-end`).
- Backend: refresh token rotation có trạng thái (bảng `refresh_token`, `jti`, token family; dùng lại → revoke cả family), `POST /api/auth/logout`,
  claim `aud`, clock skew 10 giây, lỗi refresh `auth.sessionExpired` (vi/en); 4 test mới trong `AuthApiTests`.
- `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL` qua biến môi trường (`infra/docker-compose.yml`).
- Frontend: `AuthService.refresh()` (chưa dùng chung), interceptor refresh khi 401 và gửi lại; không gắn token cho `/api/auth/*`;
  khôi phục phiên khi refresh token còn hạn.

## Tài liệu

| | |
|---|---|
| Slide | [slides/slides.md](slides/slides.md) (nguồn Marp) · `buoi-06-xac-thuc-va-bao-mat-api.pptx` · `buoi-06-xac-thuc-va-bao-mat-api.pdf` |
| Lab | [lab/README.md](lab/README.md) |
| Đáp án | [solution/README.md](solution/README.md) + 4 file `.patch` |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) · [note-cho-giang-vien.md](note-cho-giang-vien.md) |
| Bài tập về nhà | [../bai-tap-ve-nha/buoi-06-xac-thuc-va-bao-mat-api.html](../bai-tap-ve-nha/buoi-06-xac-thuc-va-bao-mat-api.html) |

## Sửa slide

```bash
cd course/session-06/slides
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-06-xac-thuc-va-bao-mat-api.pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-06-xac-thuc-va-bao-mat-api.pdf
```
