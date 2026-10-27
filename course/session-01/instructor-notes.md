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
- [ ] Chuẩn bị nhánh dự phòng: `git stash` + 2 file patch đáp án để áp nhanh nếu demo hỏng

## Timeline (3,5 giờ)

| Thời gian | Nội dung | Slide | Ghi chú |
|---|---|---|---|
| 0:00–0:10 | Giới thiệu khóa, dự án Care Portal | 1–4 | Demo nhanh: đăng nhập `agent1`, tra cứu, đăng nhập `admin1` ở app admin |
| 0:10–0:25 | Vấn đề dự án lớn, monorepo/polyrepo | 5–6 | Hỏi lớp: "Dự án của anh chị đang để bao nhiêu repo?" |
| 0:25–0:50 | Nx, cấu trúc, đồ thị, 4 loại lib, tags | 7–11 | **Demo 1** |
| 0:50–1:05 | Module boundaries, lazy loading | 12–15 | **Demo 2** |
| 1:05–1:15 | Provider, runtime config, generators, ADR, micro-frontend | 16–22 | Đi nhanh; runtime config sẽ làm kỹ trong lab |
| 1:15–1:30 | **Nghỉ giải lao** | | |
| 1:30–3:00 | **Lab** | 23–25 | Đi vòng quanh lớp; sau 30 phút nhắc mọi người đã sang Bài 2 |
| 3:00–3:25 | Chữa lab | | Áp patch đáp án lên máy chiếu, giải thích Bài 3 |
| 3:25–3:30 | Tổng kết, giới thiệu buổi 2 | 26 | |

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

## Điểm cần nhấn mạnh

- **Ranh giới mới là thứ quan trọng nhất, công cụ chỉ là phương tiện.** Không có Nx thì vẫn áp dụng được 4 loại lib bằng cấu trúc thư mục cộng một luật ESLint.
- **App phải mỏng.** Nếu thấy một service nằm trong `apps/` thì hỏi: "service này thuộc lib nào?"
- **`environment.ts` là anti-pattern khi dùng CI/CD.** Nối sang buổi 7.
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

## Lỗi thường gặp khi làm lab

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Lib tên `feature-service-plans`, import `@care/feature-service-plans` | Thiếu `--name` khi chạy generator | `npx nx g @nx/workspace:remove feature-service-plans` rồi tạo lại |
| Bảng trống, tab Network không có request nào | `rxResource` có `params` trả về `undefined` → resource ở trạng thái idle | Bọc params trong object (slide 25) |
| Icon menu Gói cước không hiện, console báo `icon appstore-o does not exist` | Chưa đăng ký icon | Thêm `AppstoreOutline` vào `provide-ui.ts` |
| `nx test` báo `No test files found` | Lib mới chưa có test | Thêm `passWithNoTests: true` vào `vite.config.mts` |
| Lỗi `ERROR TS7053 ... can't be used to index type` | Đang lặp bằng `let-x` của ng-template (kiểu `any`) | Dùng `@for (p of rows(); track p.code)` để có kiểu chặt |
| Bài 4: test `app.spec.ts` lỗi `No provider for InjectionToken APP_CONFIG` | App giờ inject `APP_CONFIG` | Provide giá trị giả trong `TestBed` |
| Màn hình hiện chữ dạng `servicePlan.col.name` | Key chưa có trong file dịch, hoặc gõ sai | Thêm key vào `vi.json` và `en.json`; console (dev) báo `Missing translation for ...` |
| `nx test shared-util-i18n` báo "vi va en co cung bo key" | Chỉ thêm key vào một file | Thêm key tương ứng vào file còn lại |
| Ở chế độ Tối có mảng nền trắng hoặc chữ khó đọc | Viết mã màu cứng (`#fff`, `#333`) trong component | Dùng token `var(--care-surface)`, `var(--care-text)`… |
| Ở chế độ EN vẫn còn chữ tiếng Việt | Viết chữ cứng trong template | Chuyển sang key + pipe `transloco` |
| Trang Gói cước mở được khi chưa đăng nhập | Route đặt ngoài nhóm `children` có `authGuard` | Chuyển route vào trong `children` |
| Bài 4: sửa `config.json` mà nhãn không đổi | Đang sửa `apps/portal/public/config.json` trong khi chạy bản build, hoặc trình duyệt cache | Sửa trong `dist/apps/portal/browser/config.json`; hard reload (Ctrl+Shift+R) |

## Sau buổi học

- Thu kết quả Bài 3 (câu hỏi thảo luận) để mở đầu buổi 2.
- Gắn tag `session01-end` sau khi áp đáp án. Đây cũng là điểm xuất phát `session02-start`.
