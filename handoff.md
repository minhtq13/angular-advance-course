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
- Nhánh `main` khớp với `origin/main` ở commit `99fc10f`. Các thay đổi ngày 2026-10-28 (cập nhật theo đề cương) **chưa commit**.
- **Buổi 1 đã soạn lại theo đề cương:** slide 34 trang (thêm Clean Architecture, phạm vi DI, port/adapter, fake, luật CI, monorepo/tách thư viện; đã xuất lại PDF và PPTX), lab 5 bài 120' + review chéo ADR, 3 patch đáp án:
  - `bai2-goi-cuoc.patch` (giữ nguyên),
  - `bai3-5-ticket-port.patch` (mới: `portal-domain-tickets`, `portal-data-access-tickets`, fake adapter + test, luật `type:domain`, `no-restricted-imports`, `.github/workflows/ci.yml`, `docs/adr/0002`),
  - `mo-rong-runtime-config.patch` (đổi tên từ `bai4-runtime-config.patch`, giờ là bài mở rộng).
  Đã kiểm tra: áp cả 3 theo thứ tự thì `nx run-many -t lint test build` pass 15 project; gỡ theo thứ tự ngược thì về đúng trạng thái đầu.
- Code trong `frontend/` đang ở **trạng thái bắt đầu lab buổi 1**: chưa có Gói cước, `TicketListPage` còn inject `TicketApi`.
- Có thêm ở trạng thái gốc: `docs/adr/` (README + ADR-0001 ng-zorro), `course/_templates/` (adr, test-matrix, benchmark, ai-review, release-checklist, instructor-notes 4 giờ).
- **Buổi 2–10:** `README.md` và `instructor-notes.md` đã viết theo đề cương (nội dung, mục tiêu, use case trên Care Portal, kế hoạch lab 120', liên kết code, danh sách "cần chuẩn bị"). Chưa có slide, lab chi tiết, đáp án.
- Chú thích "buổi N" trong code đã đổi theo thứ tự mới (hiệu năng = 5, bảo mật = 6, CI/CD = 9).
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
1. **Commit** các thay đổi ngày 2026-10-28 (khi người dùng yêu cầu), rồi tạo git tag `session01-start` và `session01-end` (end = sau khi áp 3 patch).
2. **Soạn buổi 2** (component dùng lại, form, 409) đủ slide, lab, đáp án, ghi chú và bài tập về nhà. Trước đó làm phần backend trong `course/session-02/README.md` mục "Cần chuẩn bị": endpoint phê duyệt chỉ `SUPERVISOR`, `Idempotency-Key`, `@NotBlank` có trim. Điểm xuất phát buổi 2 = sau đáp án buổi 1 (đã có `TicketPort`).
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
