# Buổi 01 — Ghi chú giảng viên

## Trước buổi học

**1 tuần trước:**
- Gửi học viên [course/setup/environment.md](../setup/environment.md), yêu cầu gửi lại ảnh chụp checklist 4 ô.
- Hỏi bộ phận IT của VNPT: máy học viên có cài được Docker Desktop không, mạng có proxy không, có Nexus/registry nội bộ không.
  Nếu không cài được Docker, cần một máy chủ dùng chung chạy `infra/docker-compose.yml`, học viên sửa `apiUrl` trong `config.json` trỏ về đó
  (thêm địa chỉ máy học viên vào `CORS_ORIGINS` của service `api`).

**Ngày học:**
- [ ] `git checkout session01-start`, chạy `docker compose -f infra/docker-compose.yml up -d` và `npm start`
- [ ] Đăng nhập thử `agent1` trên portal và `admin1` trên admin (localhost:4300, `npm run start:admin`)
- [ ] Mở sẵn: slide, VS Code tại `frontend/`, terminal, tab `npx nx graph`
- [ ] Chuẩn bị nhánh dự phòng: `git stash` + 3 file patch đáp án để áp nhanh nếu demo hỏng; một nhánh riêng đã áp bài 2 + bài 3–5 cho Demo 3

## Timeline (4 giờ)

| Thời gian | Nội dung | Slide | Ghi chú |
|---|---|---|---|
| 0:00–0:20 | Giới thiệu khóa, Care Portal (= Service Portal của đề cương), phân tích use case | 1–6 | Demo nhanh: đăng nhập `agent1`, mở Phiếu yêu cầu; mở `ticket-list.page.ts` cho lớp thấy `inject(TicketApi)` và `content/totalElements`. Hỏi: "Test màn hình này cần dựng gì?" |
| 0:20–1:00 | Khái niệm: monorepo, Nx, 4 loại lib, tags, boundaries, lazy, DI, Clean Architecture, port/adapter, ADR, monorepo/tách thư viện | 7–30 | **Demo 1** ở slide 10. Clean Architecture, DI, port, fake, luật CI (slide 18–23) là phần trọng tâm, đi chậm; runtime config (24–25) đi nhanh |
| 1:00–1:30 | Live demo và phân tích lỗi | 13–14, 20 | **Demo 2** (phá luật feature → feature), **Demo 3** (thiếu provider TicketPort) |
| 1:30–1:40 | **Nghỉ** | | |
| 1:40–3:40 | **Lab** 5 bài | 31–33 | Mốc nhắc: 1:55 sang Bài 2, 2:25 sang Bài 3, 3:05 sang Bài 4, 3:25 sang Bài 5 |
| 3:40–4:00 | Review chéo, chốt ADR-0002 | 27, 34 | Hai nhóm trình bày sơ đồ trước/sau + ADR; giao bài tập về nhà |

## Kịch bản demo

### Demo 1 — Đọc workspace (khoảng 10 phút)

```bash
cd frontend
npx nx show projects
npx nx graph
```

- Trong graph: click vào `portal`, chọn "Show dependencies". Sau đó click `admin` để chỉ ra admin không có mũi tên nào sang lib của portal.
- Mở `libs/portal/feature-subscribers/project.json` để chỉ `tags`.
- Mở `libs/portal/feature-subscribers/src/index.ts`: chỉ export `subscriberRoutes`, đó là toàn bộ public API của lib.

### Demo 2 — Phá luật trực tiếp (khoảng 5 phút)

Thêm vào `libs/admin/feature-dashboard/src/lib/dashboard.routes.ts`:

```ts
import { subscriberRoutes } from '@care/portal-feature-subscribers';
```

Chạy `npx nx lint admin-feature-dashboard` → báo lỗi. **Xóa dòng vừa thêm.**

Sau đó chạy `npx nx build portal`, chỉ vào bảng "Lazy chunk files" (`subscriber-list-page`, `ticket-list-page`).

### Demo 3 — Composition root và phạm vi DI (khoảng 10 phút)

Chuẩn bị trước: một nhánh đã áp `bai2-goi-cuoc.patch` + `bai3-5-ticket-port.patch`.

1. Xóa `providers: [provideHttpTicketPort()]` khỏi route `tickets`, mở trang Phiếu → console báo
   `NullInjectorError: No provider for TicketPort`. Hỏi lớp: "Nên đặt provider ở đâu?" và cho lớp dự đoán trước khi trả lời.
2. Đặt lại vào route. Đổi thành `useValue: new InMemoryTicketAdapter().seed([aTicket(), aTicket()])`, tắt container `api`
   (`docker compose -f infra/docker-compose.yml stop api`) → trang Phiếu vẫn chạy. Bật lại `api`, trả provider HTTP.
3. Chạy `npx nx test portal-feature-tickets`: test pass khi API đang tắt.

**Quay về `session01-start` trước khi học viên làm lab.**

## Điểm cần nhấn mạnh

- **Ranh giới mới là thứ quan trọng nhất, công cụ chỉ là phương tiện.** Không có Nx thì vẫn áp dụng được 4 loại lib bằng cấu trúc thư mục cộng một luật ESLint.
- **App phải mỏng.** Nếu thấy một service nằm trong `apps/` thì hỏi: "service này thuộc lib nào?"
- **Chiều phụ thuộc quan trọng hơn số tầng.** Không phải màn hình nào cũng cần port. Tách khi có lý do đo được: cần test độc lập, nhiều nguồn dữ liệu, backend hay đổi. Đây là ý "Clean Architecture ở mức phù hợp" của đề cương.
- **Composition root là app.** Feature không chọn adapter; app (hoặc test) chọn.
- **Luật phải chạy được trên CI, không chỉ nằm trong wiki.** ADR nào cũng nên có mục "cách kiểm chứng".
- **`environment.ts` là anti-pattern khi dùng CI/CD.** Nối sang buổi 9.
- **Kiểm tra license trước khi chọn thư viện.** Lấy câu chuyện PrimeNG → ng-zorro của chính dự án làm ví dụ ADR. Đây là chủ đề thực tế với VNPT.

## Câu hỏi học viên hay hỏi

| Câu hỏi | Gợi ý trả lời |
|---|---|
| Dự án của em là Angular CLI thường, có cần chuyển sang Nx không? | Không bắt buộc. Có thể `npx nx init` ngay trên dự án CLI hiện có để dùng cache/affected, rồi tách lib dần dần. |
| Lib nhỏ quá, có phải mỗi màn hình một lib không? | Không. Một lib feature tương ứng một nhóm màn hình của cùng nghiệp vụ. Chỉ tách khi có lý do: dùng lại, team khác sở hữu, cần lazy load riêng. |
| Sao không dùng micro-frontend luôn cho "chuẩn"? | Slide 21. Micro-frontend giải quyết bài toán **tổ chức/deploy**, không phải bài toán **code**. Chi phí vận hành cao. |
| `shared` có thành "thùng rác" không? | Có nguy cơ. Quy tắc: chỉ đưa vào `shared` khi ít nhất 2 scope cùng dùng; vẫn phải tuân thủ `type:*`. |
| Luật boundaries có làm chậm phát triển không? | Lúc đầu có cảm giác vướng, nhưng mỗi lỗi lint đều chỉ ra một chỗ thiết kế cần suy nghĩ lại. Chi phí sửa khi viết rẻ hơn nhiều so với khi đã có 50 nơi phụ thuộc. |
| Spring Boot có tương đương Nx không? | Multi-module Maven/Gradle; ArchUnit để kiểm tra luật phụ thuộc giữa các package. |
| Sao không gọi `HttpClient` trong một service rồi mock service đó luôn, cần gì port? | Mock service vẫn giữ hình dạng JSON của backend trong UI và không có luật ngăn feature khác gọi HTTP. Port + luật lint biến quy ước thành ràng buộc. Với màn hình đơn giản thì mock service là đủ: ghi rõ trong ADR. |
| Interface hay abstract class cho port? | Abstract class làm DI token luôn. Interface cần thêm `InjectionToken<TicketPort>`. Cả hai đều đúng, chọn một và thống nhất. |
| Domain có được dùng `inject()` không? | Không. Domain là TypeScript thuần + rxjs; luật `bannedExternalImports` chặn `@angular/core`. |
| Dự án của em chưa có Nx thì làm luật import thế nào? | `eslint-plugin-boundaries` hoặc `no-restricted-imports` theo đường dẫn thư mục; dependency-cruiser cho sơ đồ. |

## Lỗi thường gặp khi làm lab

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Lib tên `feature-service-plans`, import `@care/feature-service-plans` | Thiếu `--name` khi chạy generator | `npx nx g @nx/workspace:remove feature-service-plans` rồi tạo lại |
| Bảng trống, tab Network không có request nào | `rxResource` có `params` trả về `undefined` → resource ở trạng thái idle | Bọc params trong object (slide 25) |
| Icon menu Gói cước không hiện, console báo `icon appstore-o does not exist` | Chưa đăng ký icon | Thêm `AppstoreOutline` vào `provide-ui.ts` |
| `nx test` báo `No test files found` | Lib mới chưa có test | Thêm `passWithNoTests: true` vào `vite.config.mts` |
| Lỗi `ERROR TS7053 ... can't be used to index type` | Đang lặp bằng `let-x` của ng-template (kiểu `any`) | Dùng `@for (p of rows(); track p.code)` để có kiểu chặt |
| Bài 3: trang Phiếu báo `NullInjectorError: No provider for TicketPort` | Quên `providers` ở route `tickets` | Thêm `provideHttpTicketPort()` vào route trong `app.routes.ts` |
| Bài 3: lint báo `type:domain` không được phép từ `type:feature` | Chưa thêm `type:domain` vào luật | Bổ sung `type:domain` cho app, feature, data-access và thêm luật cho chính nó |
| Bài 3: lint domain báo cấm `@angular/compiler` | Cấm `@angular/*` quá rộng, đụng `test-setup.ts` | Liệt kê cụ thể `@angular/core*`, `@angular/common*`... |
| Bài 4: test báo bảng có thêm một dòng rỗng | Hàng đo (measure row) của nz-table | Lọc chuỗi rỗng khi đọc cột |
| Bài 4: `Cannot find module '@care/portal-domain-tickets/testing'` | Thiếu path trong `tsconfig.base.json` | Thêm path, khởi động lại TS server của VS Code |
| Bài mở rộng: test `app.spec.ts` lỗi `No provider for InjectionToken APP_CONFIG` | App giờ inject `APP_CONFIG` | Provide giá trị giả trong `TestBed` |
| Màn hình hiện chữ dạng `servicePlan.col.name` | Key chưa có trong file dịch, hoặc gõ sai | Thêm key vào `vi.json` và `en.json`; console (dev) báo `Missing translation for ...` |
| `nx test shared-util-i18n` báo "vi va en co cung bo key" | Chỉ thêm key vào một file | Thêm key tương ứng vào file còn lại |
| Ở chế độ Tối có mảng nền trắng hoặc chữ khó đọc | Viết mã màu cứng (`#fff`, `#333`) trong component | Dùng token `var(--care-surface)`, `var(--care-text)`… |
| Ở chế độ EN vẫn còn chữ tiếng Việt | Viết chữ cứng trong template | Chuyển sang key + pipe `transloco` |
| Trang Gói cước mở được khi chưa đăng nhập | Route đặt ngoài nhóm `children` có `authGuard` | Chuyển route vào trong `children` |
| Bài mở rộng: sửa `config.json` mà nhãn không đổi | Đang sửa `apps/portal/public/config.json` trong khi chạy bản build, hoặc trình duyệt cache | Sửa trong `dist/apps/portal/browser/config.json`; hard reload (Ctrl+Shift+R) |

## Sau buổi học

- Giao bài tập về nhà: [../bai-tap-ve-nha/buoi-01-bon-loai-lib-va-luat-phu-thuoc.html](../bai-tap-ve-nha/buoi-01-bon-loai-lib-va-luat-phu-thuoc.html) (khoảng 30 phút, nộp trước buổi 2). Nhắc học viên mở file bằng trình duyệt từ repo đã clone.
- Thu sơ đồ phụ thuộc, ADR-0002 của các nhóm và bài tập về nhà để mở đầu buổi 2. Phần 4 của bài tập (`ThemeService` có nên nằm trong lib ui?) là chủ đề thảo luận đầu buổi 2.
- Câu hỏi thảo luận Bài 5 ("tạo/duyệt phiếu: thêm method vào port hay tách port?") là cầu nối sang lab buổi 2.
- Nhánh `session01-end` = đáp án đầy đủ. Buổi 2 bắt đầu từ `session02-start` (thêm phần backend phê duyệt, idempotency và mở rộng `TicketPort`).
