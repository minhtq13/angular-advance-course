# Báo cáo kiểm thử: đăng nhập SSO và duyệt phiếu (buổi 7)

Ngày chạy: 2026-10-30. Máy: MacBook, Node 24.22, Chromium của Playwright. Backend chạy riêng (Postgres seed 2.000 thuê bao,
500 phiếu; API cổng 8091; Keycloak 26.8.1 realm `care`). Mọi số dưới đây lấy từ lần chạy thật.

## 1. Phạm vi

| Rủi ro | Vì sao quan trọng |
|---|---|
| Đăng nhập SSO không gọi được API | Cả portal không dùng được ở chế độ OIDC |
| Đăng xuất không kết thúc phiên SSO | Quầy CSKH dùng máy chung: người sau vào tài khoản người trước |
| Agent đóng phiếu không qua Manager duyệt | Sai quy trình nghiệp vụ, không ai chịu trách nhiệm duyệt |
| Manager duyệt nhầm phiếu, mất thông báo 409 | Ghi đè thay đổi của người khác mà không biết |

## 2. Tháp kiểm thử

| Tầng | Công cụ | Số test | Thời gian | Kiểm tra cái gì |
|---|---|---|---|---|
| Unit: quy tắc | Vitest, hàm thuần | 9 (`canApprove`) | < 0,6 giây cả project | Bảng trạng thái × vai trò hiện nút Duyệt |
| Integration: HTTP + state | TestBed, `HttpTestingController` | 9 (`OidcAuthService`), 3 (duyệt phiếu ở app) | ~1–2 giây mỗi project | Header `Authorization`, refresh dùng chung, logout ở Keycloak; route + store + adapter HTTP thật |
| Toàn bộ frontend | `nx run-many -t test` | 143 (12 project) | — | |
| Backend | JUnit + Testcontainers | 28 (thêm 4 `SsoTokenTests`, 1 regression) | 15 giây (`./mvnw test`, image đã có sẵn) | JWKS, `iss`, `aud`; 403 theo vai trò; PATCH không đóng được phiếu |
| API trực tiếp | Playwright `request` | 18 (ma trận buổi 6) + 2 (`role-denial`) | 1,6 giây cả 20 test | 401/403/409 và **dữ liệu không đổi** |
| E2E hành trình | Playwright, trình duyệt | 1 hành trình duyệt phiếu, 4 SSO | 2,4 giây; 6,7 giây | Agent tạo → Manager duyệt → Agent thấy "Đã đóng"; đăng nhập/đăng xuất qua Keycloak |

E2E toàn bộ ở chế độ local: **30 pass, 5 skip** (4 SSO cần `SSO=1`, 1 perf cần `PERF=1`), 17,5 giây.
1 fail ở `i18n.spec` ("Total: 200,000" nhưng nhận "Total: 2,000"): do backend riêng chỉ seed 2.000 thuê bao, không phải hồi quy.

## 3. Lỗi tìm được

| # | Lỗi | Tìm bằng | Bằng chứng | Sửa | Test chống tái phát |
|---|---|---|---|---|---|
| 1 | Chế độ OIDC gửi **ID token** tới API: mọi API 401, màn hình "Không tải được danh sách" | Trình duyệt + giải mã header | `401 ... The aud claim is not valid`, token `typ: ID`, `aud: care-portal` | `OidcAuthService` dùng `accessToken` | `oidc-auth.service.spec.ts` (2 test), `sso.spec.ts` |
| 2 | Đăng xuất chỉ xóa token trong tab: bấm SSO là vào lại tài khoản cũ | E2E "máy dùng chung" | Keycloak trả 302 ngay, không hỏi mật khẩu | `logoffAndRevokeTokens()` (RP-initiated logout) | `oidc-auth.service.spec.ts`, `sso.spec.ts` |
| 3 | `PATCH /api/tickets/{id}` cho **agent đóng phiếu** (`status: CLOSED`), bỏ qua bước duyệt | Test API gọi thẳng, không qua UI | Mong 403, nhận **200** | `@PreAuthorize` ở `TicketController.update`: không ai đóng phiếu bằng PATCH | `role-denial.spec.ts`, `TicketApiTests.nobodyClosesTicketByPatch` |
| 4 | Bộ test cũ không bắt được: (a) thay thông báo 409 bằng lỗi chung, (b) agent thấy nút Duyệt | Thử phá (mutation bằng tay) | 39 test feature-tickets và 3 test app vẫn xanh | Tách `canApprove`; assertion kiểm URL, body, request tải lại, chữ trên màn hình | `ticket.rules.spec.ts`, `ticket-approval.spec.ts` |

Lỗi 3 tồn tại từ buổi 2: giao diện không có nút đóng phiếu nên mọi test qua UI đều xanh. Ma trận buổi 6 chỉ thử `/approve`.

## 4. Chất lượng assertion: kết quả thử phá

| Phá | Trước (test yếu) | Sau |
|---|---|---|
| M1: gửi `version: 0` | Bắt được (test trang dùng fake adapter) | Bắt được ở cả integration |
| M2: bỏ `store.reload()` sau khi duyệt | Bắt được (test trang) | Bắt được ở cả integration |
| M3: 409 hiện lỗi chung thay vì lý do từ server | **Lọt** | Integration đỏ |
| M4: hiện nút Duyệt cho mọi vai trò | **Lọt** (chỉ E2E buổi 2 bắt được) | Unit quy tắc đỏ (3 dòng), integration đỏ |

## 5. Rủi ro còn lại

- E2E SSO cần Keycloak: không chạy trong CI mặc định. Đề xuất job CI riêng chạy `docker compose --profile sso` (buổi 9).
- Token Keycloak nằm trong `sessionStorage` (xem `docs/checklist-sso.md`, mục rủi ro).
- Hành trình E2E tạo dữ liệu thật mỗi lần chạy; DB dùng chung sẽ đầy phiếu "Hanh trinh E2E". Dọn bằng `docker compose down -v`.
- `PATCH` vẫn cho đổi trạng thái tùy ý giữa NEW/IN_PROGRESS/RESOLVED (kể cả quay lui). Cần chốt quy tắc chuyển trạng thái với nghiệp vụ.
