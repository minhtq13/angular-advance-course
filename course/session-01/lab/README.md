# Lab buổi 1 — Kiến trúc dự án lớn

**Thời gian:** 90 phút · **Điểm xuất phát:** code hiện tại của repo (tag `session01-start`)

Sau lab này bạn sẽ:
- Đọc được cấu trúc một Nx monorepo và đồ thị phụ thuộc giữa các project.
- Tự tạo một feature lib đúng quy ước, nối vào app bằng lazy loading.
- Hiểu vì sao ESLint chặn import sai tầng, và sửa được lỗi đó.
- Dùng cấu hình runtime để một bản build chạy được trên nhiều môi trường.

Trước khi bắt đầu: `docker compose -f infra/docker-compose.yml up -d` và `npm start` đều đang chạy, đăng nhập được `agent1`/`agent1` (xem [course/setup/environment.md](../../setup/environment.md)).
Tất cả lệnh `nx` chạy trong thư mục `frontend/`.

---

## Bài 1 — Khám phá workspace (15 phút)

```bash
npx nx show projects
npx nx show project portal --web     # mở trình duyệt xem các target
npx nx graph                         # đồ thị phụ thuộc
```

Trả lời các câu hỏi sau (ghi vào giấy hoặc file nháp):

1. Workspace có bao nhiêu **app** và bao nhiêu **lib**?
2. Mở `libs/portal/feature-subscribers/project.json`. Lib này có những **tag** nào?
3. Trong đồ thị, `admin` phụ thuộc vào những lib nào? Có lib nào của `portal` không?
4. Mở `eslint.config.mjs` ở thư mục gốc. Một lib `type:ui` được phép import lib loại nào?
5. Mở `apps/portal/src/app/app.routes.ts`. Vì sao màn hình thuê bao dùng `loadChildren` thay vì `component`?
6. Chạy `npx nx build portal` rồi xem bảng output. Tìm chunk tên `subscriber-list-page`: nó nằm ở **Initial** hay **Lazy**?

---

## Bài 2 — Thêm màn hình "Gói cước" (45 phút)

Nghiệp vụ: nhân viên CSKH cần xem danh sách gói cước, lọc theo Trả trước / Trả sau.
Backend đã có sẵn API `GET /api/service-plans?type=PREPAID|POSTPAID`, và FE đã có sẵn `ServicePlanApi` trong
`@care/shared-data-access-api`.

### 2.1 Tạo lib bằng generator

```bash
npx nx g @nx/angular:library libs/portal/feature-service-plans \
  --name=portal-feature-service-plans \
  --tags=scope:portal,type:feature
```

> Phải có `--name`. Nếu thiếu, Nx đặt tên project là `feature-service-plans` và import path là
> `@care/feature-service-plans`, lệch với quy ước `<scope>-<type>-<tên>` của repo.

Sau khi chạy:
- Kiểm tra `tsconfig.base.json` đã có path `@care/portal-feature-service-plans`.
- Xóa thư mục component mẫu `src/lib/portal-feature-service-plans/`.
- Trong `vite.config.mts` của lib, thêm `passWithNoTests: true` vào khối `test` (lib chưa có test).

### 2.2 Viết màn hình

Tạo `src/lib/service-plan-list/service-plan-list.page.ts` (+ `.html`). Làm theo quy ước giao diện của app (xem trang Thuê bao):
`<h1>` trong `.page-header`, bộ lọc trong `.filters` có nhãn hiển thị, bảng nằm trong `.panel`. Yêu cầu:

- Component standalone, `ChangeDetectionStrategy.OnPush`, selector bắt đầu bằng `care-`.
- Lưu bộ lọc trong một `signal<SubscriberType | null>(null)`, với `null` nghĩa là tất cả.
- Tải dữ liệu bằng `rxResource` gọi `ServicePlanApi.list(type)`.
- **Không viết chữ cứng trong template.** App hỗ trợ tiếng Việt và tiếng Anh: thêm key mới (vd `servicePlan.col.name`)
  vào **cả hai** file `libs/shared/util-i18n/src/assets/i18n/vi.json` và `en.json`, rồi dùng `{{ 'servicePlan.col.name' | transloco }}`.
  Tên loại thuê bao dùng lại `SUBSCRIBER_TYPE` (đã là key dịch).
- Số và tiền dùng pipe theo ngôn ngữ: `translocoDecimal`, `translocoCurrency: 'symbol' : {} : 'VND'`.
- Giao diện:
  - Nhóm nút `nz-radio-group` với 3 lựa chọn Tất cả / Trả trước / Trả sau.
  - Bảng `nz-table` với các cột Mã gói, Tên gói, Loại, Cước tháng (định dạng VND), Data (GB).

Tạo `src/lib/service-plan.routes.ts` export `servicePlanRoutes`, dùng `loadComponent`. Export file này từ `src/index.ts`.

### 2.3 Nối vào app

1. `apps/portal/src/app/app.routes.ts`: thêm route `service-plans` dùng `loadChildren`, đặt **bên trong** mảng
   `children` của nhóm có `canActivateChild: [authGuard]`. Nếu đặt ngoài nhóm này, trang không yêu cầu đăng nhập.
2. `apps/portal/src/app/app.ts`: thêm mục menu `{ label: 'Gói cước', icon: 'appstore', route: '/service-plans' }`.
3. Thêm `title: 'title.servicePlans'` cho route (title cũng là key dịch). Tab trình duyệt sẽ hiện "Gói cước · Care Portal"
   hoặc "Service plans · Care Portal" tùy ngôn ngữ. Nhãn menu cũng là key: `label: 'nav.servicePlans'`.
4. Icon `appstore` chưa được đăng ký. Thêm `AppstoreOutline` vào danh sách `ICONS` trong
   `libs/shared/ui-layout/src/lib/provide-ui.ts`.

### 2.4 Kiểm tra

- [ ] http://localhost:4200/service-plans hiện 8 gói; chọn "Trả sau" còn 4 gói
- [ ] Bấm **EN** ở header: toàn bộ trang chuyển sang tiếng Anh, tiền hiện `₫15,000`; không còn chữ tiếng Việt nào
- [ ] Chuyển sang chế độ **Tối**: trang vẫn đọc rõ, không có mảng nền trắng (không viết mã màu cứng, dùng `var(--care-*)`)
- [ ] `npx nx build portal`: trong output có lazy chunk `service-plan-list-page`
- [ ] `npx nx run-many -t lint test build` báo Successfully

> **Bẫy hay gặp:** nếu viết `params: () => this.type() ?? undefined` thì bảng trống mà không có request nào.
> `rxResource` coi `params` bằng `undefined` là trạng thái **idle** nên không gọi API. Hãy bọc trong object:
> `params: () => ({ type: this.type() })`.

---

## Bài 3 — Phá luật và sửa luật (15 phút)

1. Trong `service-plan.routes.ts`, thêm dòng:

   ```ts
   import { subscriberRoutes } from '@care/portal-feature-subscribers';
   ```

   Chạy `npx nx lint portal-feature-service-plans`. Ghi lại thông báo lỗi.

2. Thay bằng import đường dẫn tương đối:

   ```ts
   import { SubscriberListPage } from '../../../feature-subscribers/src/lib/subscriber-list/subscriber-list.page';
   ```

   Chạy lint lại. Lỗi lần này khác lần trước như thế nào?

3. Câu hỏi thảo luận: giả sử màn hình Gói cước cần dùng lại **bảng hiển thị thuê bao** của feature-subscribers.
   Bạn sẽ chuyển phần đó vào lib nào, với tag gì? Vẽ lại mũi tên phụ thuộc sau khi chuyển.

Xóa các dòng thử nghiệm trước khi làm bài tiếp theo.

---

## Bài 4 — Một bản build, nhiều môi trường (15 phút, nâng cao)

Yêu cầu: header hiện nhãn môi trường (ví dụ `DEV`, `TEST`) đọc từ `config.json`. Ở production không có nhãn.
**Không** dùng `environment.ts`.

1. Thêm thuộc tính tùy chọn `environmentName?: string` vào `AppConfig` (`libs/shared/util-config`).
2. `Shell` (`libs/shared/ui-layout`) nhận thêm input `environmentName` và hiển thị bằng `nz-tag` ngay cạnh tên app khi có giá trị.
   Màu chữ của nhãn phải đạt độ tương phản tối thiểu 4,5:1 (preset `orange` của ng-zorro không đạt).
3. App `portal` inject `APP_CONFIG` rồi truyền `environmentName` vào `<care-shell>`.
4. Thêm `"environmentName": "DEV"` vào `apps/portal/public/config.json`.

Kiểm tra:

```bash
npx nx build portal
npx nx run portal:serve-static        # phục vụ bản build production ở :4200
```

Mở trang: thấy nhãn **DEV**. Sửa `dist/apps/portal/browser/config.json` thành `"TEST"`, **không build lại**, tải lại trang:
nhãn đổi thành **TEST**.

> Nhớ cập nhật `app.spec.ts`: component giờ inject `APP_CONFIG` nên test phải provide giá trị này.

---

## Đáp án

Đáp án nằm trong [`../solution/`](../solution/). Chỉ mở sau khi đã tự làm.
