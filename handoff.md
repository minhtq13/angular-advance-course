# Handoff: Care Portal, khóa Angular nâng cao cho VNPT

Viết cho: người hoặc phiên Claude Code sẽ làm tiếp dự án này.

## 1. Mục tiêu
- Thầy dạy khóa **Angular nâng cao** cho VNPT, 40 giờ = 10 buổi × 4 giờ, **theo đề cương PDF "Đề cương khóa học Angular nâng cao"** (bảng đầy đủ trong `course/README.md`). Các buổi lần lượt là: 1 kiến trúc, 2 component dùng lại và form phức tạp, 3 Signals và RxJS, 4 state và NgRx, 5 hiệu năng và bộ nhớ, 6 auth và bảo mật API, 7 SSO và chiến lược kiểm thử, 8 AI và Copilot, 9 build và CI/CD, 10 nâng cấp và bảo vệ capstone.
- Mỗi buổi: 20' review + use case, 40' khái niệm, 30' demo, 10' nghỉ, 120' lab, 20' review chéo.
- Người dùng soạn tài liệu cho từng buổi: slide, code mẫu chạy được, lab có đáp án, ghi chú giảng viên và **bài tập về nhà**.
- Dự án xuyên suốt khóa là **Care Portal** (CSKH và quản lý thuê bao). Frontend viết bằng Angular, backend bằng Spring Boot 3.x. Đề cương gọi là *Service Portal*; ánh xạ: yêu cầu dịch vụ = ticket, Agent = `agent1`, Manager = `supervisor1`.
- Repo: `github.com/minhtq13/angular-advance-course`. Khi push, dùng địa chỉ SSH `git@github.com:minhtq13/angular-advance-course.git`.

## 2. Quyết định đã chốt
| Chủ đề | Quyết định | Lý do |
|---|---|---|
| Frontend | Angular 22.2 (standalone, zoneless, signals) trong **Nx 24**, dùng tsconfig paths kiểu cũ | Dạy bản mới. Buổi 8 sẽ làm phần nâng cấp từ code cũ |
| Node | 24.22, cài qua nvm (`frontend/.nvmrc`) | Angular 22 cần Node 22.22 trở lên |
| UI | **ng-zorro-antd** | PrimeNG có license thương mại |
| Đa ngôn ngữ | Transloco, có vi và en, **vi là mặc định**. Mọi chữ trên giao diện đều đi qua key. Thông báo lỗi của backend dịch theo `Accept-Language` | Yêu cầu của người dùng |
| Theme | Sáng và tối, mặc định theo hệ thống. Màu chỉ lấy từ token `var(--care-*)`, độ tương phản từ 4.5:1 trở lên ở cả hai theme | Yêu cầu của người dùng |
| Xác thực | **Mặc định JWT HS256 do backend tự phát** qua `POST /api/auth/login` và `/api/auth/refresh`, claim `roles`. Keycloak **chỉ** quay lại dưới Docker profile tùy chọn `sso` cho buổi 7 (chốt 2026-10-28, chưa triển khai) | Khóa tập trung vào frontend; đề cương buổi 7 yêu cầu Keycloak cục bộ |
| Đề cương | PDF 40h là chuẩn. Giữ tên Care Portal, chỉ ghi ánh xạ | Người dùng chốt 2026-10-28 |
| Tầng kiến trúc | Thêm `type:domain` (port + model, cấm import Angular) giữa data-access và util — **chỉ có trong đáp án buổi 1**, chưa có ở code gốc | Lab buổi 1 theo đề cương (TicketPort) |
| Môi trường học viên | Chỉ cài Git, Node và Docker. **Không cài Java** | Cài đặt ban đầu càng nhẹ càng tốt |
| Backend | Spring Boot 3.5.16, Java 21, Flyway, MapStruct, Testcontainers | |
| Dữ liệu | Postgres có sẵn bản dump khoảng 200.000 thuê bao, tự restore khi chạy | Học viên có dữ liệu ngay, không phải seed |
| Slide | Viết bằng Marp, xuất ra PDF và PPTX. File PPTX là ảnh nên không sửa chữ trực tiếp được | |
| Bài tập về nhà | File HTML tự chấm trong `course/bai-tap-ve-nha/`, đặt tên `buoi-XX-<chu-de>.html`, làm khoảng 30 phút, nộp trước buổi kế tiếp | Người dùng yêu cầu chuyển bài làm bằng `/teach` thành bài tập về nhà |

## 3. Trạng thái hiện tại
- **Mô hình git theo nhánh** (người dùng chốt 2026-10-29, thay cho tag): `sessionXX-start` là điểm bắt đầu lab, đáp án của buổi XX là patch trong
  `course/session-XX/solution/`. Khi chuẩn bị buổi kế tiếp: áp patch, commit "Áp đáp án buổi XX (sessionXX-end)", tạo nhánh `sessionXX-end`, rồi commit
  phần chuẩn bị của buổi sau và gắn `session(XX+1)-start`. Tài liệu `course/` luôn mới nhất trên `main`.
- Nhánh hiện có (đã push): `session01-start` (5a7ad8c), `session01-end` (c825bd8), `session02-start` (68cb8c4); local có thêm `session02-end` (chưa push). Không còn tag (đã xóa vì trùng tên nhánh gây nhập nhằng khi checkout). `main` đang ở **trạng thái bắt đầu lab buổi 2**.
- **Buổi 1, buổi 2 đã soạn đủ**: slide (PDF, PPTX), lab 5 bài 120', đáp án dạng patch, `instructor-notes.md`, `note-cho-giang-vien.md`, bài tập về nhà.
  - Buổi 2 có 3 patch: `bai1-ticket-row`, `bai2-3-form-tao-phieu`, `bai4-5-duyet-va-idempotency`. Đã kiểm tra gate pass sau **từng** patch (16 project), áp/gỡ sạch, và spec E2E `ticket-flow.spec.ts` pass với backend thật.
  - Backend ở `session02-start`: `POST /api/tickets/{id}/approve` (chỉ SUPERVISOR), `IdempotencyStore` (trong bộ nhớ), `TicketApiTests` (19 test backend pass).
- **Buổi 3 đã soạn và đã commit (2026-10-29):** `main` ở code `session03-start` (đáp án buổi 2 + chuẩn bị buổi 3) kèm tài liệu buổi 3; nhánh `session03-start` và `session03-end` đã push.
  - Chuẩn bị: backend `care.demo.slow-short-query` (`DEMO_SLOW_SHORT_QUERY`), `SubscriberPicker` (CVA) thay ô nhập mã thuê bao, `lookup()` có 4 lỗi cố ý.
  - Đáp án 3 patch: `bai2-3-switchmap-va-test-thu-tu`, `bai4-luong-song-sau-loi`, `bai5-huy-dang-ky`. Test mới đỏ trước khi sửa, xanh sau khi sửa; tái hiện được trên trình duyệt thật.
- **Buổi 4–10:** `README.md` và `instructor-notes.md` có khung theo đề cương. Chưa có slide, lab chi tiết, đáp án.
- **Libs hiện có:**
  - `admin/feature-dashboard`
  - `portal/feature-{subscribers,tickets}`
  - `shared/{data-access-api, data-access-auth, feature-auth, ui-layout, util-config, util-i18n}`
- **Lệnh chạy dự án:**
  ```bash
  docker compose -f infra/docker-compose.yml up -d   # postgres :5433, api :8081, adminer :8088 (redis thuộc profile `cache`, cổng :6379)
  cd frontend && nvm use && npm ci && npm start     # http://localhost:4200
  ```
  Tài khoản đăng nhập là `agent1`, `supervisor1` và `admin1`, mật khẩu trùng tên đăng nhập.

## 4. Việc còn dở
1. Chỉ commit/push khi người dùng bảo rõ (xem memory `no-commit-without-asking`).
2. **Soạn buổi 4** (State và NgRx), bắt đầu từ `session03-end`.
3. **Buổi 6** cần backend refresh rotation có trạng thái và phát hiện token reuse (hiện refresh token stateless).
4. **Buổi 7:** thêm service `keycloak` vào `infra/docker-compose.yml` dưới `profiles: [sso]` + realm export; auth hỗ trợ 2 chế độ.
5. **Buổi 10:** tạo fixture Angular 21 (`fixtures/legacy-a21/`).
6. **Slide buổi 1** chưa có ảnh minh họa chế độ tối và giao diện tiếng Anh.
7. **Bài tập về nhà buổi 1** dạy 4 loại lib, chưa nói tới `type:domain` (đã ghi chú cho giảng viên); cân nhắc thêm một câu hỏi.
8. **Đề cương ghi Angular 22.0.0** (khóa phiên bản), repo đang `~22.2`. Chưa quyết định: hạ phiên bản hay sửa đề cương.
9. **Hỏi VNPT các điểm sau:**
   - Máy học viên có cài được Docker không; kéo được image Keycloak không.
   - Mạng có proxy không, có Nexus nội bộ không.
   - Họ đang dùng phiên bản Angular nào (ảnh hưởng buổi 10).
   - Họ dùng GitLab hay hệ thống CI khác (ảnh hưởng buổi 1 Bài 5 và buổi 9).
   - Chính sách dùng AI (buổi 8).
10. **Repo chưa nhất quán:** `ThemeService` nằm trong lib `ui`, còn `LanguageService` lại nằm trong `util-i18n`. Phần 4 của bài tập về nhà buổi 1 dùng đúng điểm này làm câu hỏi thảo luận, nên nếu sửa repo thì phải sửa cả câu hỏi đó.
11. **Chưa có `learning-records/`.** Theo `NOTES.md`, chỉ tạo thư mục này khi đã có phản hồi thật từ học viên.

## 5. Code và config quan trọng

**Luật phụ thuộc giữa các lib** (`frontend/eslint.config.mjs`, trạng thái gốc). Luật này chặt hơn khuyến nghị của Nx: lib feature **không** được import lib feature khác. ESLint chỉ báo luật đầu tiên bị vi phạm. Đáp án buổi 1 thêm `type:domain` và `bannedExternalImports` (xem `bai3-5-ticket-port.patch`).
```js
depConstraints: [
  { sourceTag: 'type:app',         onlyDependOnLibsWithTags: ['type:feature','type:ui','type:data-access','type:util'] },
  { sourceTag: 'type:feature',     onlyDependOnLibsWithTags: ['type:ui','type:data-access','type:util'] },
  { sourceTag: 'type:ui',          onlyDependOnLibsWithTags: ['type:ui','type:util'] },
  { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access','type:util'] },
  { sourceTag: 'type:util',        onlyDependOnLibsWithTags: ['type:util'] },
  { sourceTag: 'scope:portal',     onlyDependOnLibsWithTags: ['scope:portal','scope:shared'] },
  { sourceTag: 'scope:admin',      onlyDependOnLibsWithTags: ['scope:admin','scope:shared'] },
  { sourceTag: 'scope:shared',     onlyDependOnLibsWithTags: ['scope:shared'] },
]
```

**Runtime config** (`frontend/apps/portal/public/config.json`). File này được đọc lúc khởi động trong `main.ts`, nên build một lần rồi deploy cho nhiều môi trường được:
```json
{ "apiUrl": "http://localhost:8081" }
```

**Xác thực** (`frontend/libs/shared/data-access-auth/`):
- `AuthService` lưu phiên trong sessionStorage với key `care.auth`.
- `provideAuth()` khởi tạo phiên khi ứng dụng khởi động (app initializer).
- `auth.interceptor.ts` chỉ gắn Bearer token cho request tới `apiUrl`. Khi nhận lỗi 401, interceptor chỉ chuyển về trang đăng nhập nếu request đó đã gửi kèm token và không phải request tới `/api/auth/`.
- `authGuard` và `guestGuard` đều tôn trọng `returnUrl`. Hàm `safeReturnUrl` chặn chuyển hướng ra ngoài trang (open redirect).

**Theme ng-zorro:** khai báo `provideNzConfig({ theme: { primaryColor: '#0958d9' } })`. File CSS cho theme tối (`/themes/ng-zorro-antd.dark.min.css`) chỉ tải khi chuyển sang theme tối.

**Xuất lại slide** (chạy trong `course/session-XX/slides`):
```bash
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-XX-....pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-XX-....pdf
```
Trước khi ghi đè PPTX, phải kiểm tra file khóa `~$...` và tiến trình PowerPoint. Đã từng ghi đè nhầm khi file đang mở trong PowerPoint.

**Backend test:** VS Code (extension Java) ghi đè `backend/target/classes` không có bean MapStruct → `./mvnw test` lỗi `No qualifying bean ...Mapper`. Chạy test trong bản sao (`rsync -a --exclude target backend/ <scratch>/` rồi `./mvnw test` ở đó) hoặc đóng VS Code.

**Đáp án lab dạng patch:** cách đang dùng là tạo `git worktree` tạm ở HEAD, áp các patch trước đó, commit tạm, chép file đã làm vào rồi `git diff --cached`. Mỗi lần tạo lại phải kiểm tra `git apply` rồi `git apply -R` vẫn chạy được, và chạy gate trong worktree (symlink `frontend/node_modules`, `NX_DAEMON=false`). Nếu sửa một dòng code nằm trong vùng context của patch thì phải sửa cả dòng đó trong file patch.

**Bài tập về nhà** (`course/bai-tap-ve-nha/assets/`):
- `quiz.js` dùng cho `[data-quiz]`, đọc dữ liệu JSON.
- `boundary-checker.js` dùng cho `[data-boundary-checker]`. Thêm `data-allow-add` thì học viên tự thêm được lib của mình.
- `lesson.css` chứa token cho cả sáng và tối, có style khi in.

Mỗi bài phải có các phần: ôn lại từ trí nhớ, luyện tập có phản hồi ngay, bài vận dụng, và mục "Nộp bài". Bài **không lặp lại lab** trên lớp.

## 6. Quy ước làm việc với người dùng
- Chỉ commit hoặc push khi người dùng yêu cầu.
- Tài liệu viết bằng tiếng Việt có dấu.
- Không gửi email của người dùng ra dịch vụ ngoài.
- Bộ nhớ dài hạn nằm ở `~/.claude/projects/-Users-taminh-Documents-Workspace-angular-advance-course/memory/`.
