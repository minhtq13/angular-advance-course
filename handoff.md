# Handoff: Care Portal, khóa Angular nâng cao cho VNPT

Viết cho: phiên Claude Code (hoặc người) làm tiếp dự án này ở một cuộc hội thoại mới. Cập nhật 2026-10-30.

## 1. Mục tiêu

- Thầy của người dùng dạy khóa **Angular nâng cao** cho VNPT: **40 giờ = 10 buổi × 4 giờ**, theo file đề cương PDF
  *"Đề cương khóa học Angular nâng cao"*. Đề cương là chuẩn: nội dung, use case/lab và sản phẩm đầu ra của từng buổi đã chép vào
  `course/session-XX/README.md` (mục "Theo đề cương") và bảng tổng trong `course/README.md`.
- Thứ tự buổi: 1 kiến trúc · 2 component dùng lại + form phức tạp · 3 Signals và RxJS · 4 state + NgRx · 5 hiệu năng + bộ nhớ ·
  6 auth + bảo mật API · 7 SSO + chiến lược kiểm thử · 8 AI/Copilot · 9 build + CI/CD · 10 nâng cấp + bảo vệ capstone.
- Lịch mỗi buổi: 20' review + use case, 40' khái niệm, 30' live demo, 10' nghỉ, **120' lab**, 20' review chéo.
- Người dùng (trợ giảng) soạn cho mỗi buổi: slide, code chạy được, lab có đáp án, ghi chú giảng viên, bài tập về nhà.
- Dự án xuyên suốt: **Care Portal** (CSKH + quản lý thuê bao viễn thông). Đề cương gọi là *Service Portal*; ánh xạ:
  yêu cầu dịch vụ = ticket, Agent = `agent1`, Manager = `supervisor1`.
- Repo: `github.com/minhtq13/angular-advance-course` (push qua HTTPS đang chạy được; SSH `git@github.com:minhtq13/angular-advance-course.git`).

## 2. Quyết định đã chốt

| Chủ đề | Quyết định | Lý do / ngày |
|---|---|---|
| Đề cương | PDF 40h là chuẩn; giữ tên Care Portal, chỉ ghi ánh xạ | Người dùng, 2026-10-28 |
| Frontend | Angular 22.2 (standalone, zoneless, signals, `OnPush`) trong **Nx 24**, tsconfig paths kiểu cũ | Dạy bản mới |
| Node | 24.22 qua nvm (`frontend/.nvmrc`) | Angular 22 cần ≥ 22.22 |
| UI | **ng-zorro-antd** (MIT); ADR-0001 | PrimeNG có license thương mại |
| i18n | Transloco vi/en, **vi mặc định**; mọi chữ UI qua key ở cả hai file; lỗi backend dịch theo `Accept-Language` | Người dùng |
| Theme | Sáng/tối, mặc định theo hệ thống; màu chỉ từ token `var(--care-*)`; tương phản ≥ 4.5:1 cả hai theme | Người dùng |
| Xác thực | Mặc định **JWT HS256 do backend phát** (`POST /api/auth/login`, `/api/auth/refresh`, claim `roles`). Keycloak **chỉ** ở buổi 7, dưới Docker profile tùy chọn `sso` (chưa làm) | Khóa tập trung FE; đề cương buổi 7 cần Keycloak |
| Môi trường học viên | Chỉ Git, Node, Docker; **không Java** | Cài đặt nhẹ |
| Backend | Spring Boot 3.5.16, Java 21, Flyway, MapStruct, Testcontainers | |
| Dữ liệu | Postgres có dump ~200.000 thuê bao + 50.000 phiếu, tự restore | Có dữ liệu ngay |
| Kiến trúc lib | 5 loại tag: `type:app/feature/ui/data-access/domain/util` × `scope:portal/admin/shared`. `type:domain` (port + model, cấm import Angular) thêm từ buổi 1; `type:ui` được dùng **kiểu** của `type:domain` từ buổi 2 | Lab buổi 1–2 |
| **Git flow** | Mỗi buổi 2 nhánh `sessionXX-start` (điểm học viên bắt đầu lab) và `sessionXX-end` (đã áp đáp án). `session(XX+1)-start` = `sessionXX-end` + một commit chuẩn bị. `main` = tài liệu mới nhất + code ở điểm bắt đầu buổi mới nhất. **Không dùng tag** | Người dùng, 2026-10-29; áp dụng cho mọi khóa mới |
| Commit/push | **Chỉ khi người dùng bảo rõ.** Soạn xong thì để thay đổi chưa commit cho người dùng xem | Người dùng, 2026-10-29 |
| Slide | Marp (`slides.md`) → PDF + PPTX. PPTX là ảnh, sửa bằng `slides.md` rồi xuất lại | |
| Bài tập về nhà | HTML tự chấm `course/bai-tap-ve-nha/buoi-XX-<chu-de>.html`, ~30 phút, nộp trước buổi sau; không lặp lại lab | Người dùng |

## 3. Trạng thái hiện tại

**Git** (đã push hết, `main` = `799305a`):

| Nhánh | Commit | Nội dung |
|---|---|---|
| `session01-start` / `session01-end` | 5a7ad8c / c825bd8 | Buổi 1 |
| `session02-start` / `session02-end` | 68cb8c4 / e190f47 | Buổi 2 |
| `session03-start` / `session03-end` | 4e2a559 / 4e3b4e4 | Buổi 3 |
| `session04-start` / `session04-end` | d876f58 / f780566 | Buổi 4 |
| `session05-start` / `session05-end` | 671f847 / 7858396 | Buổi 5 |
| `main` | 799305a | Code = `session05-start`, tài liệu buổi 1–5 đầy đủ |

**Buổi 6 đã soạn xong nhưng CHƯA commit** (chờ người dùng xem diff): working tree `main` có code = `session06-start` (đáp án buổi 5 +
phần chuẩn bị buổi 6), tài liệu `course/session-06/*`, BTVN buổi 6, `course/README.md`. **Commit tạm trong worktree `wt6` đã LỖI THỜI** (còn comment không dấu, trước đợt đổi comment 2026-10-30): đừng dùng `f05cd60`/`bca411f`.
Dựng lại từ working tree hiện tại: `session06-start` = code `frontend/`, `backend/`, `infra/`, `docs/` đang có trên `main` (đã có dấu);
`session06-end` = áp 4 patch trong `course/session-06/solution/` theo thứ tự trong `solution/README.md` (patch đã đổi comment sang có dấu, đã kiểm tra áp/gỡ khớp).

**Thay đổi chưa commit của người dùng (đừng đụng, đừng commit nếu không được bảo):**
`course/session-01/slides/*` (đang sửa slide buổi 1), `course/session-02/README.md`, `course/session-02/react-to-angular-guide.md`,
`course/react-to-angular/`, một phần `handoff.md`.

**Buổi đã soạn đủ (1–6)**: mỗi buổi có `README.md`, `slides/` (slides.md + PDF + PPTX), `lab/README.md`, `solution/README.md` + patch,
`instructor-notes.md`, `note-cho-giang-vien.md`, bài tập về nhà.

| Buổi | Use case trên Care Portal | Chuẩn bị ở `-start` | Đáp án (patch) |
|---|---|---|---|
| 1 Kiến trúc | Màn hình phiếu gọi `TicketApi` trực tiếp | (code gốc) | Gói cước (lazy lib); `TicketPort` + HTTP adapter + fake; luật import, CI; ADR-0002; runtime config (mở rộng) |
| 2 Component + form | `ticket-row`, form tạo phiếu, 2 Manager duyệt cùng version | Backend `POST /api/tickets/{id}/approve` (SUPERVISOR), `IdempotencyStore`; port `create/approve`, lỗi nghiệp vụ 409/400 | `ticket-row` (lib `portal-ui-tickets`); typed form + `notBlank`; xử lý 409; `Idempotency-Key` |
| 3 Signals + RxJS | Ô chọn thuê bao có tìm kiếm, kết quả cũ về muộn | Backend `DEMO_SLOW_SHORT_QUERY`; `SubscriberPicker` (CVA); `lookup()` có 4 lỗi cố ý | `switchMap` + test marble; `catchError` trong; `toSignal`; `docs/bang-chon-operator.md` |
| 4 State + NgRx | F5/link/Back mất bộ lọc; rò "thuê bao xem gần đây" khi đổi phiên | `RecentSubscribers` root, chưa xóa khi đổi phiên | `docs/ma-tran-state.md`; `TicketListStore` (SignalStore) đọc bộ lọc từ URL; ADR-0003; `returnUrl` an toàn; SignalStore root tự xóa khi đổi phiên |
| 5 Hiệu năng | Báo cáo 10.000 dòng chậm, rò bộ nhớ | Backend `MAX_PAGE_SIZE`; màn hình `/subscribers/report` có 4 vấn đề | Virtual scroll (CDK); tách `ShiftClock` + view model + `trackBy`; gỡ listener; `perf/report.perf.spec.ts` (`PERF=1`); `docs/benchmark-buoi-05.md` số đo thật |

| 6 Auth + bảo mật API | Token hết hạn, trang chi tiết thuê bao 2 request 401 → 2 refresh → lần hai bị coi là reuse → bị đá ra | Backend: bảng `refresh_token` (Flyway V5), rotation + revoke cả family khi dùng lại, `POST /api/auth/logout`, claim `aud`, clock skew 10s, `ACCESS_TOKEN_TTL`/`REFRESH_TOKEN_TTL`; FE: `AuthService.refresh()` chưa dùng chung, interceptor refresh mỗi 401, không gắn token cho `/api/auth/*` | Ma trận bảo mật (Playwright `request`, 18 test) + `docs/ma-tran-bao-mat.md`; refresh dùng chung (`share` + `finalize`), 401 về muộn; đăng xuất một lần + `reason=expired` + logout revoke ở server; `apiPathOf` so origin; `docs/vong-doi-phien.md` |

Mọi đáp án đã kiểm tra: lint + test + build pass **sau từng patch** (16 project), áp/gỡ sạch; các buổi 2–6 còn kiểm tra trên trình duyệt thật
với backend thật (Playwright). Buổi 6 kiểm tra với backend riêng (Postgres cổng 5434, API cổng 8091 chạy jar, `ACCESS_TOKEN_TTL=30s`,
seed 2.000 thuê bao → `i18n.spec` báo sai số tổng, không phải hồi quy), không đụng `care-api-1`.

**Buổi 7–10:** chỉ có `README.md` + `instructor-notes.md` dạng khung theo đề cương (mục tiêu, use case, kế hoạch lab, "cần chuẩn bị").

**Libs** (`frontend/libs/`): `admin/feature-dashboard`; `portal/{data-access-tickets, domain-tickets, feature-service-plans,
feature-subscribers, feature-tickets, ui-tickets}`; `shared/{data-access-api, data-access-auth, feature-auth, ui-layout, util-config, util-i18n}`.
Tài liệu dự án: `docs/adr/0001–0003`, `docs/bang-chon-operator.md`, `docs/ma-tran-state.md` (trên `main` vì là đáp án các buổi trước).

**Container trên máy người dùng:** `care-api-1` đang chạy code backend buổi 5, `DEMO_SLOW_SHORT_QUERY=false`, `MAX_PAGE_SIZE=200`.
Dữ liệu local đã bị các lần test đóng vài phiếu RESOLVED và tạo vài phiếu mới; `down -v` để về dump gốc.

## 4. Việc còn dở

1. **Buổi 6: chờ người dùng duyệt rồi commit** theo bước 7 mục 5 (nhánh `session06-start` từ working tree hiện tại, `session06-end` từ đầu
   worktree `wt6`; commit `main` loại `course/session-01/slides`, `course/react-to-angular`, `course/session-02/*` riêng của người dùng).
   Container `care-api-1` của người dùng vẫn chạy code buổi 5: cần `ACCESS_TOKEN_TTL=30s docker compose -f infra/docker-compose.yml up -d --build api`
   để có V5 (dump có V1–V4 nên Flyway tự nâng). Dọn worktree `wt6` sau khi tạo nhánh (container tạm `care6-pg` đã xóa).
2. **Buổi 7:** service `keycloak` trong `infra/docker-compose.yml` dưới `profiles: [sso]` + realm export (`infra/keycloak/`); auth hỗ trợ
   2 chế độ (local JWT / OIDC) qua một port; Playwright hành trình Agent tạo → Manager duyệt, API từ chối sai quyền (403).
3. **Buổi 8:** diff có lỗi cài sẵn cho bài AI review; mẫu `course/_templates/ai-review.md` đã có.
4. **Buổi 9:** `frontend/Dockerfile` + `nginx.conf` (SPA fallback, cache, header bảo mật), pipeline GitHub Actions + GitLab CI, diễn tập rollback.
   Job CI kiểm tra import đã có từ buổi 1 (`.github/workflows/ci.yml`).
5. **Buổi 10:** fixture Angular 21 (`fixtures/legacy-a21/`, NgModule, `*ngIf`, zone.js, có test) để nâng lên 22 theo checkpoint.
6. **Slide buổi 1:** chưa có ảnh chế độ tối và giao diện EN (người dùng đang tự sửa slide buổi 1).
7. **Bài tập về nhà buổi 1** dạy 4 loại lib, chưa có `type:domain` (đã ghi chú cho giảng viên).
8. **Đề cương ghi Angular 22.0.0**, repo `~22.2`: chưa quyết định hạ phiên bản hay sửa đề cương.
9. **Hỏi VNPT:** Docker và image Keycloak trên máy học viên; proxy, Nexus nội bộ; phiên bản Angular đang dùng (buổi 10); GitLab hay CI khác
   (buổi 9); chính sách dùng AI (buổi 8).
10. Repo chưa nhất quán: `ThemeService` trong lib `ui`, `LanguageService` trong `util-i18n` (dùng làm câu hỏi thảo luận BTVN buổi 1).
11. Chưa có `learning-records/` trong `course/bai-tap-ve-nha/`: chỉ tạo khi có phản hồi thật từ học viên.

## 5. Quy trình soạn một buổi (đã dùng cho buổi 2–5)

> Bản đầy đủ, cập nhật theo kinh nghiệm buổi 6, nằm ở các skill trong `.claude/skills/` (`soan-buoi-hoc`, `kiem-tra-gate`, `xuat-slide`, `bai-tap-ve-nha`, `commit-theo-buoi`).
> Quy ước chung ở `CLAUDE.md` và `.claude/rules/`. Mục này giữ bản tóm tắt cũ để tham khảo; khi hai bên khác nhau thì theo skill.

1. Đọc `course/session-XX/README.md` (khung theo đề cương). Thiết kế use case trên Care Portal có **lỗi thật tái hiện được**.
2. `git worktree add --detach <scratch>/wtX session(XX-1)-end`, symlink `frontend/node_modules`. Làm phần chuẩn bị, chạy gate, commit tạm.
3. Làm đáp án từng bài trong worktree; **viết test đỏ trước** trên code chưa sửa, rồi sửa cho xanh; sau mỗi bài: gate + `git add -A` +
   `git diff --cached > bai-N.patch` + commit tạm.
4. Kiểm tra trên trình duyệt thật: chạy `nx serve portal --port 4210 --proxy-config <proxy.json>` trong worktree, tạm đổi
   `apps/portal/public/config.json` thành `apiUrl: http://localhost:4210` (không commit), Playwright spec tạm `zz-*.spec.ts` với
   `BASE_URL=http://localhost:4210`. Proxy phải gửi `Origin: http://localhost:4200` (CORS backend chỉ cho 4200/4300):
   ```json
   {"/api":{"target":"http://localhost:8081","secure":false,"changeOrigin":true,"headers":{"Origin":"http://localhost:4200"}}}
   ```
   Cổng 4200/4300 thường là dev server của người dùng: không tắt.
5. Đưa code vào working tree `main`: áp patch đáp án buổi trước + patch chuẩn bị; chép patch đáp án vào `course/session-XX/solution/`.
   So sánh với snapshot (`git add -N` để tính file mới, rồi `git diff --stat <snapshot> -- frontend backend infra docs` phải rỗng), áp/gỡ thử cả chuỗi.
6. Viết tài liệu: `slides/slides.md` (render ảnh kiểm tra tràn chữ, xuất PDF/PPTX), `lab/README.md`, `solution/README.md`,
   `instructor-notes.md` (timeline khớp số slide), `note-cho-giang-vien.md`, README buổi, bài tập về nhà HTML (render kiểm tra không lỗi console),
   cập nhật bảng `course/README.md` và file này.
7. Báo người dùng, **chờ lệnh commit**. Khi được bảo: tạo nhánh bằng `git commit-tree` từ cây của snapshot (để tác giả đúng, commit tạm
   trong worktree không lên origin), `git update-ref`, commit `main` bằng
   `git add -A -- . ':!course/session-01/slides' ':!course/react-to-angular'` (loại thay đổi riêng của người dùng), kiểm tra code staged
   khớp `sessionXX-start`, push `main sessionXX-start sessionXX-end`, dọn worktree.

## 6. Code và config quan trọng

**Luật phụ thuộc** (`frontend/eslint.config.mjs`, trên `main`):
```js
{ sourceTag: 'type:app',         onlyDependOnLibsWithTags: ['type:feature','type:ui','type:data-access','type:domain','type:util'] },
{ sourceTag: 'type:feature',     onlyDependOnLibsWithTags: ['type:ui','type:data-access','type:domain','type:util'],
                                 bannedExternalImports: ['@angular/common/http'] },
{ sourceTag: 'type:ui',          onlyDependOnLibsWithTags: ['type:ui','type:domain','type:util'] },
{ sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access','type:domain','type:util'] },
{ sourceTag: 'type:domain',      onlyDependOnLibsWithTags: ['type:domain','type:util'],
                                 bannedExternalImports: ['@angular/core*','@angular/common*','@angular/router*','@angular/forms*','ng-zorro-antd*'] },
{ sourceTag: 'type:util',        onlyDependOnLibsWithTags: ['type:util'] },
// scope:portal|admin -> chính nó + shared; scope:shared -> shared
```
`libs/portal/feature-tickets/eslint.config.mjs` còn chặn import `TicketApi` (phải dùng `TicketPort`).

**Port phiếu** (`libs/portal/domain-tickets`): `TicketPort.search/create(command, idempotencyKey)/approve(id, version)`;
lỗi nghiệp vụ `TicketConflictError` (409), `TicketValidationError` (400, `fieldErrors`). Fake `InMemoryTicketAdapter` ở
`@care/portal-domain-tickets/testing` (mô phỏng version, idempotency, `failNext`). Adapter HTTP + `provideHttpTicketPort()` ở
`libs/portal/data-access-tickets`, nối ở `apps/portal/src/app/app.routes.ts`.

**Trang phiếu** (`libs/portal/feature-tickets/src/lib/ticket-list/`): `TicketListStore` (SignalStore, `providers` ở component) đọc bộ lọc
từ query params (`ticket-url.ts`: `status`, `priority`, `mine=1`, `page` đếm từ 1, `size` 20/50/100, `sort` whitelist), tải bằng
`rxMethod` + `switchMap`; `listUrl` cho `returnUrl` sang trang tạo phiếu.

**Runtime config** (`frontend/apps/portal/public/config.json`, đọc trong `main.ts`):
```json
{ "environmentName": "DEV", "apiUrl": "http://localhost:8081" }
```

**Biến môi trường backend cho demo** (`infra/docker-compose.yml`, đều tắt/mặc định khi không truyền):
```bash
DEMO_SLOW_SHORT_QUERY=true docker compose -f infra/docker-compose.yml up -d api        # buổi 3: tìm thuê bao < 5 ký tự chậm 2s
MAX_PAGE_SIZE=10000 docker compose -f infra/docker-compose.yml up -d --build api      # buổi 5: cho tải 10.000 dòng
ACCESS_TOKEN_TTL=30s docker compose -f infra/docker-compose.yml up -d --build api     # buổi 6: token hết hạn sau ~40s (lệch 10s)
docker compose -f infra/docker-compose.yml up -d api                                   # về mặc định
```

**Xác thực** (`libs/shared/data-access-auth/`): `AuthService` lưu phiên trong sessionStorage key `care.auth`, có `username`, `roles`,
`hasAnyRole`; interceptor chỉ gắn Bearer cho `apiUrl`; 401 có token → về `/login`; `safeReturnUrl` chặn open redirect.
Backend quyền: `@PreAuthorize("hasRole('SUPERVISOR')")` cho duyệt phiếu; `/api/admin/**` cần `ADMIN`.

**Chạy dự án:**
```bash
docker compose -f infra/docker-compose.yml up -d   # postgres :5433, api :8081, adminer :8088
cd frontend && nvm use && npm ci && npm start     # portal :4200 (admin: npm run start:admin, :4300)
npx nx run-many -t lint test build                # gate, phải pass 16 project
```
Tài khoản: `agent1`, `supervisor1`, `admin1` (mật khẩu trùng tên).

**Xuất slide** (trong `course/session-XX/slides`; kiểm tra file khóa `~$...` và PowerPoint trước khi ghi đè PPTX):
```bash
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-XX-<ten>.pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-XX-<ten>.pdf
```

**Bẫy đã gặp:**
- **Backend test:** VS Code (extension Java) ghi đè `backend/target/classes` không có bean MapStruct → `./mvnw test` lỗi
  `No qualifying bean ...Mapper`. Chạy trong bản sao: `rsync -a --exclude target backend/ <scratch>/be && cd <scratch>/be && ./mvnw -q test`.
- **zsh:** biến không tự tách từ (`for p in $L` sai) → viết danh sách trực tiếp; không có lệnh `timeout`.
- **Playwright:** nz-table có hàng đo rỗng → dùng `tbody tr.ant-table-row`; `nz-select` đã có giá trị thì bấm vào `nz-select:has(#id)`,
  không bấm input; `page.goto` tải lại cả trang (mất state trong bộ nhớ) → điều hướng bằng nút trong app; tiến trình Playwright đôi khi
  không thoát sau khi test xong (chạy nền, đọc file log).
- **Test router:** Back/Forward với `RouterTestingHarness` cần `provideLocationMocks()`, `router.initialNavigation()` và chờ `NavigationEnd`.
- **Patch:** sửa một dòng nằm trong context của patch thì phải sửa cả dòng đó trong file patch; luôn thử `git apply` rồi `git apply -R`.

**Bài tập về nhà** (`course/bai-tap-ve-nha/assets/`): `quiz.js` cho `[data-quiz]` (JSON: `prompt`, `options`, `answer`, `explain`);
`boundary-checker.js` cho `[data-boundary-checker]` (`data-allow-add` cho học viên thêm lib); `lesson.css` có token sáng/tối và style in.
Cấu trúc mỗi bài: Phần 0 nhớ lại (có `<details>` ôn tập), 1–2 quiz tự chấm, 3 vận dụng nghiệp vụ mới (đáp án trong `<details>`), Nộp bài, Đọc thêm.

## 7. Quy ước làm việc với người dùng

- Trả lời, viết tài liệu và **code comment** bằng **tiếng Việt có dấu** (từ 2026-10-30 đã đổi toàn bộ comment trong `frontend/` và `backend/src` sang có dấu).
- **Thuật ngữ kỹ thuật giữ tiếng Anh** trong comment và tài liệu (người dùng yêu cầu 2026-10-30): secret/secretKey, signing key, key, signature, revoke, rotation, reuse, token family, clock skew, lock, resource, unsubscribe. Chữ hiển thị cho người dùng (i18n, `messages*.properties`) vẫn tiếng Việt. **Không sửa comment trong migration Flyway đã áp (V1–V4)**: đổi nội dung làm lệch checksum.
- **Chỉ commit/push khi người dùng bảo rõ**; trước đó để thay đổi chưa commit và tóm tắt các commit/nhánh dự định tạo.
- Không đụng thay đổi riêng của người dùng (mục 3).
- Không gửi email của người dùng ra dịch vụ ngoài.
- Bộ nhớ dài hạn: `~/.claude/projects/-Users-taminh-Documents-Workspace-angular-advance-course/memory/`
  (`syllabus-40h`, `git-flow-per-session`, `no-commit-without-asking`, `minimal-learner-setup`, `i18n-convention`, `theme-convention`,
  `ui-library-ng-zorro`, `vnpt-angular-course`).
