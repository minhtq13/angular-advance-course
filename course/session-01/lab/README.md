# Lab buổi 1 — Kiến trúc Angular cho dự án lớn

**Thời gian:** 120 phút · **Điểm xuất phát:** `git checkout session01-start`

**Use case.** Màn hình *Phiếu yêu cầu* (`TicketListPage`) đang inject thẳng `TicketApi` và đọc `content`, `totalElements`
của Spring Page. Muốn test màn hình phải giả lập HTTP; backend đổi hình dạng response thì phải sửa component.
Lab tách màn hình này thành **hợp đồng `TicketPort` + HTTP adapter**, rồi thay bằng **fake adapter** để chứng minh màn hình test được độc lập.

Sau lab này bạn sẽ:
- Vẽ được sơ đồ phụ thuộc của workspace trước và sau khi tách.
- Tự tạo lib đúng quy ước, nối vào app bằng lazy loading.
- Tách port (domain) và adapter (data access), nối chúng ở composition root bằng DI theo route.
- Viết test màn hình chạy trên fake adapter, không có HttpClient.
- Thêm luật import và chạy chúng như CI.

**Sản phẩm nộp cuối buổi** (theo nhóm 4–5 người): ảnh/ file sơ đồ phụ thuộc trước và sau, `docs/adr/0002-tach-ticket-port.md`,
nhánh code pass `npx nx run-many -t lint test build`.

Trước khi bắt đầu: `docker compose -f infra/docker-compose.yml up -d` và `npm start` đều đang chạy, đăng nhập được `agent1`/`agent1` (xem [course/setup/environment.md](../../setup/environment.md)).
Tất cả lệnh `nx` chạy trong thư mục `frontend/`.

---

## Bài 1 — Khám phá workspace, vẽ sơ đồ phụ thuộc (15 phút)

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
7. Vẽ tay (giấy, draw.io hoặc Mermaid) **sơ đồ phụ thuộc** của `portal-feature-tickets`: nó phụ thuộc lib nào, và từ
   `TicketListPage` đi qua những lớp nào để tới HTTP? Giữ bản vẽ này, cuối lab vẽ lại để so sánh.

---

## Bài 2 — Thêm màn hình "Gói cước" (30 phút)

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

## Bài 3 — Tách TicketPort và HTTP adapter (40 phút)

Mục tiêu: `TicketListPage` chỉ biết một hợp đồng. Đích đến:

```
apps/portal ──► portal-feature-tickets ──► portal-domain-tickets   (TicketPort, TicketSummary…)
     │                                            ▲
     └────────► portal-data-access-tickets ───────┘   (HttpTicketAdapter → TicketApi)
```

### 3.1 Tạo hai lib

```bash
npx nx g @nx/angular:library libs/portal/domain-tickets \
  --name=portal-domain-tickets --tags=scope:portal,type:domain
npx nx g @nx/angular:library libs/portal/data-access-tickets \
  --name=portal-data-access-tickets --tags=scope:portal,type:data-access
```

Xóa thư mục component mẫu mà generator sinh ra trong `src/lib/` của cả hai lib. Lib domain chưa có test: thêm
`passWithNoTests: true` vào `vite.config.mts` của nó.

Tag `type:domain` chưa có trong luật: trong `eslint.config.mjs` ở thư mục gốc, thêm `'type:domain'` vào danh sách được phép của
`type:app`, `type:feature`, `type:data-access`, và thêm luật mới cho chính nó:

```js
{ sourceTag: 'type:domain', onlyDependOnLibsWithTags: ['type:domain', 'type:util'] },
```

### 3.2 Domain: mô hình và port

Trong `libs/portal/domain-tickets/src/lib/`:

- `ticket.ts`: các type `TicketStatus`, `TicketPriority`, `TicketCategory`, `TicketSummary` (chỉ những trường màn hình danh sách
  dùng: xem template), `TicketQuery` (`status`, `priority`, `assignee`), `PageQuery` (`page`, `size`, `sort?`),
  `TicketPage` (`items`, `total`).
- `ticket.port.ts`:

  ```ts
  export abstract class TicketPort {
    abstract search(query: TicketQuery, page: PageQuery): Observable<TicketPage>;
  }
  ```

Export cả hai file từ `src/index.ts`. **Không import gì từ `@angular/*`** trong lib này.

> Vì sao `abstract class` chứ không phải `interface`? Interface biến mất sau khi biên dịch nên không làm DI token được;
> abstract class vừa là kiểu vừa là token.

### 3.3 Adapter HTTP

Trong `libs/portal/data-access-tickets/src/lib/http-ticket.adapter.ts`:

- `HttpTicketAdapter extends TicketPort`, `@Injectable()` (không `providedIn`), inject `TicketApi`.
- `search()` gọi `TicketApi.search()` rồi `map` Spring Page → `TicketPage`: `content` → `items` (chuyển từng phần tử
  bằng hàm `toSummary`), `totalElements` → `total`.
- Hàm `provideHttpTicketPort()` trả về `[{ provide: TicketPort, useClass: HttpTicketAdapter }]`.

Export từ `src/index.ts`.

### 3.4 Đổi màn hình và nối ở composition root

1. `TicketListPage`: thay `inject(TicketApi)` bằng `inject(TicketPort)`; lấy `TicketStatus`, `TicketPriority` từ
   `@care/portal-domain-tickets`; đọc `items`/`total` thay cho `content`/`totalElements`.
2. `apps/portal/src/app/app.routes.ts`: thêm `providers: [provideHttpTicketPort()]` vào route `tickets`.

### 3.5 Kiểm tra

- [ ] http://localhost:4200/tickets hiển thị, lọc, phân trang như trước (so sánh tab Network: cùng request)
- [ ] `grep -rn "TicketApi" libs/portal/feature-tickets` không còn kết quả
- [ ] `npx nx graph`: `portal-feature-tickets` có mũi tên tới `portal-domain-tickets`; `portal` có mũi tên tới `portal-data-access-tickets`

> **Bẫy hay gặp:** quên `providers` ở route → vào trang Phiếu báo `NullInjectorError: No provider for TicketPort`.
> Đặt `provideHttpTicketPort()` trong `ticket.routes.ts` của feature thì chạy được, nhưng feature lại phụ thuộc adapter HTTP:
> đúng chỗ là app.

---

## Bài 4 — Fake adapter và test độc lập (20 phút)

1. Tạo `libs/portal/domain-tickets/src/testing.ts` với:
   - `InMemoryTicketAdapter extends TicketPort`: `seed(tickets)`, lọc theo `status`/`priority`/`assignee`, cắt trang theo
     `page`/`size`, lưu mỗi lần gọi vào mảng `calls`.
   - `aTicket(overrides)`: tạo `TicketSummary` mặc định hợp lệ.
2. Thêm path `"@care/portal-domain-tickets/testing"` trỏ tới file này trong `tsconfig.base.json`
   (tham khảo `@care/shared-util-i18n/testing`).
3. Viết `ticket-list.page.spec.ts` trong feature-tickets. Providers: `provideRouter([])`, `provideUi()`, `provideI18nTesting()`,
   `{ provide: TicketPort, useValue: port }`, `AuthService` giả chỉ có `username: signal('agent1')`. Hai test:
   - Lần gọi đầu tiên tới port có `page.page === 0` và không có bộ lọc; bảng hiện đúng mã phiếu đã seed.
   - Bấm checkbox *Chỉ phiếu của tôi* → lần gọi cuối có `assignee === 'agent1'`, bảng chỉ còn phiếu của agent1.
4. Viết `http-ticket.adapter.spec.ts` trong data-access-tickets bằng `provideHttpClientTesting()`: kiểm tra URL, query param
   `status`, `page`, và kết quả đã chuyển sang `items`/`total`.
5. **Thử nhanh không cần backend:** tạm đổi provider ở route `tickets` thành
   `{ provide: TicketPort, useValue: new InMemoryTicketAdapter().seed([aTicket(), aTicket()]) }`, tắt container `api` → trang Phiếu
   vẫn hiển thị. **Trả lại `provideHttpTicketPort()` sau khi thử.**

> nz-table chèn một hàng đo (measure row) rỗng ở đầu `tbody`: khi đọc cột đầu tiên, lọc bỏ chuỗi rỗng.

Kiểm tra: `npx nx test portal-feature-tickets` và `npx nx test portal-data-access-tickets` đều pass, **không có HTTP thật**.

---

## Bài 5 — Luật import và chạy như CI (15 phút)

1. Bổ sung luật trong `eslint.config.mjs` gốc:
   - `type:feature`: `bannedExternalImports: ['@angular/common/http']`
   - `type:domain`: `bannedExternalImports: ['@angular/core*', '@angular/common*', '@angular/router*', '@angular/forms*', 'ng-zorro-antd*']`
     (không cấm `@angular/compiler` vì `test-setup.ts` do generator sinh ra dùng nó)
2. Trong `libs/portal/feature-tickets/eslint.config.mjs`, thêm `no-restricted-imports` chặn import `TicketApi` từ
   `@care/shared-data-access-api`, kèm message nhắc ADR-0002.
3. Phá luật để thấy lỗi, ghi lại thông báo:
   - Trong `TicketListPage`: `import { TicketApi } from '@care/shared-data-access-api';` và `import { HttpClient } from '@angular/common/http';`
   - Trong `ticket.port.ts`: `import { Injectable } from '@angular/core';`
   - Trong `ticket.port.ts`: import bất kỳ thứ gì từ `@care/shared-data-access-api`

   Chạy `npx nx run-many -t lint -p portal-feature-tickets portal-domain-tickets`. **Xóa các dòng thử.**
4. Viết job CI chạy luật cho mọi push/PR. Repo dùng GitHub: `.github/workflows/ci.yml` với các bước `actions/checkout`,
   `actions/setup-node` (đọc `frontend/.nvmrc`), `npm ci`, `npx nx run-many -t lint` (thư mục `frontend`). Nếu dự án của bạn dùng GitLab:

   ```yaml
   architecture:
     image: node:24
     script:
       - cd frontend && npm ci && npx nx run-many -t lint
   ```

5. Chạy gate như CI ở máy: `npx nx run-many -t lint test build`.

Câu hỏi thảo luận (chuẩn bị cho review chéo):
- Port hiện chỉ có `search`. Buổi 2 thêm *tạo phiếu* và *duyệt phiếu*: port nên thêm method, hay tách port khác?
- Màn hình Thuê bao có cần tách port tương tự không? Lý do tách/không tách (chi phí so với lợi ích).

---

## Review chéo (20 phút): sơ đồ và ADR

Mỗi nhóm điền `docs/adr/0002-tach-ticket-port.md` theo mẫu [course/_templates/adr.md](../../_templates/adr.md)
(tham khảo `docs/adr/0001-dung-ng-zorro-thay-primeng.md`), gồm: bối cảnh (dấu hiệu quan sát được ở Bài 1), ít nhất 3 phương án,
quyết định, hệ quả, **cách kiểm chứng** (luật lint, test nào). Kèm sơ đồ phụ thuộc trước/sau (Mermaid trong ADR là đủ).
Nhóm khác review theo 3 câu: chiều phụ thuộc có đúng không? luật nào giữ quyết định? phương án bị loại có được nêu lý do?

---

## Bài mở rộng — Một bản build, nhiều môi trường (làm ở nhà hoặc khi xong sớm)

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

> Chủ đề này được dùng lại ở buổi 9 (build một lần, triển khai nhiều môi trường).

---

## Đáp án

Đáp án nằm trong [`../solution/`](../solution/). Chỉ mở sau khi đã tự làm.
