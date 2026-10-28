# Đáp án lab buổi 1

## Áp đáp án vào code

Trong thư mục gốc repo (từ trạng thái `session01-start`):

```bash
git apply course/session-01/solution/bai2-goi-cuoc.patch
git apply course/session-01/solution/bai3-5-ticket-port.patch      # áp sau bài 2
git apply course/session-01/solution/mo-rong-runtime-config.patch  # tùy chọn, áp sau cùng
```

Gỡ đáp án (theo thứ tự ngược lại):

```bash
git apply -R course/session-01/solution/mo-rong-runtime-config.patch
git apply -R course/session-01/solution/bai3-5-ticket-port.patch
git apply -R course/session-01/solution/bai2-goi-cuoc.patch
```

Ba patch đã được kiểm tra: áp cả ba thì `nx run-many -t lint test build` pass cho cả 15 project; gỡ ra thì repo về đúng trạng thái ban đầu.

---

## Bài 1 — Khám phá workspace

1. **2 app** (`portal`, `admin`), **1 project e2e** (`portal-e2e`), **8 lib**.
2. `scope:portal`, `type:feature`.
3. `admin` → `admin-feature-dashboard`, `shared-data-access-auth`, `shared-feature-auth`, `shared-ui-layout`, `shared-util-config`.
   **Không** có lib nào của portal. Luật `scope:admin` chỉ cho phép phụ thuộc `scope:admin` và `scope:shared`.
4. `type:ui` chỉ được import `type:ui` và `type:util`. UI không được tự gọi API (`data-access`) và không được biết về màn hình nghiệp vụ (`feature`).
5. `loadChildren` tách code của feature thành **lazy chunk**, chỉ tải khi người dùng vào màn hình đó. Nhờ vậy bundle ban đầu nhỏ hơn và các team không đụng code của nhau.
6. **Lazy** (`subscriber-list-page`, khoảng 7 kB, tải về chỉ khoảng 2,7 kB sau nén).
7. Sơ đồ trước khi tách:

   ```
   TicketListPage ──inject──► TicketApi (shared-data-access-api) ──► HttpClient
         └── đọc trực tiếp PageResponse.content / totalElements (hình dạng Spring Page)
   ```

   Điểm cần thấy: UI biết cả HTTP lẫn hình dạng JSON của backend; không có chỗ nào để thay nguồn dữ liệu khi test.

## Bài 2 — Màn hình Gói cước

Các file chính trong patch `bai2-goi-cuoc.patch`:

| File | Vai trò |
|---|---|
| `libs/portal/feature-service-plans/src/lib/service-plan-list/service-plan-list.page.ts` | Signal bộ lọc + `rxResource` |
| `.../service-plan-list.page.html` | `nz-radio-group` + `nz-table` |
| `.../service-plan.routes.ts` | `servicePlanRoutes` dùng `loadComponent` |
| `apps/portal/src/app/app.routes.ts` | Route `service-plans` dùng `loadChildren`, nằm trong nhóm `authGuard` |
| `apps/portal/src/app/app.ts` | Mục menu |
| `libs/shared/ui-layout/src/lib/provide-ui.ts` | Đăng ký `AppstoreOutline` |
| `libs/shared/util-i18n/src/assets/i18n/vi.json`, `en.json` | Key `nav.servicePlans`, `title.servicePlans`, `servicePlan.*` cho cả hai ngôn ngữ |

Đoạn quan trọng nhất:

```ts
protected readonly type = signal<SubscriberType | null>(null);

// Luu y: params() tra ve undefined => resource o trang thai idle, KHONG goi API.
protected readonly plans = rxResource({
  params: () => ({ type: this.type() }),
  stream: ({ params }) => this.api.list(params.type ?? undefined),
});

protected readonly rows = computed(() => (this.plans.hasValue() ? this.plans.value() : []));
```

Điểm chấm:
- **Lib:** tên và tag đúng quy ước.
- **Component:** dùng `OnPush`.
- **Định tuyến:** dùng `loadChildren`, và xuất hiện lazy chunk `service-plan-list-page` trong output build.
- **Đọc dữ liệu:** gọi `hasValue()` trước khi đọc `value()`, vì `value()` sẽ throw khi resource đang lỗi.
- **Đa ngôn ngữ:** không có chữ cứng trong template; key có mặt ở cả `vi.json` và `en.json` (test `translations.spec.ts` sẽ báo lỗi nếu thiếu); tiền dùng `translocoCurrency` thay cho `CurrencyPipe`.

## Bài 3 — TicketPort và HTTP adapter

Các file chính trong `bai3-5-ticket-port.patch`:

| File | Vai trò |
|---|---|
| `libs/portal/domain-tickets/src/lib/ticket.ts` | `TicketSummary`, `TicketQuery`, `PageQuery`, `TicketPage` (chỉ TypeScript) |
| `libs/portal/domain-tickets/src/lib/ticket.port.ts` | `abstract class TicketPort` |
| `libs/portal/data-access-tickets/src/lib/http-ticket.adapter.ts` | `HttpTicketAdapter`, `toSummary`, `provideHttpTicketPort()` |
| `libs/portal/feature-tickets/.../ticket-list.page.ts` | `inject(TicketPort)`, đọc `items`/`total` |
| `apps/portal/src/app/app.routes.ts` | `providers: [provideHttpTicketPort()]` trên route `tickets` |
| `eslint.config.mjs` | Tầng `type:domain` và các luật `bannedExternalImports` |

Sơ đồ sau khi tách:

```
apps/portal ──► portal-feature-tickets ──► portal-domain-tickets ◄── portal-data-access-tickets ──► shared-data-access-api
     └──────────────────────────────────────────────────────────────────┘ (chọn adapter)
```

Điểm chấm:
- **Chiều phụ thuộc:** domain không import Angular hay lib nào ngoài util; adapter phụ thuộc domain, không ngược lại.
- **Composition root:** adapter được chọn ở `app.routes.ts`, không ở feature. Nếu học viên để trong `ticket.routes.ts`,
  chỉ ra rằng feature khi đó phụ thuộc `data-access-tickets` và không đổi adapter được nếu không sửa feature.
- **Mapping:** `HttpTicketAdapter` chuyển Spring Page sang `TicketPage`; màn hình không còn biết `content`/`totalElements`.
- **Hành vi giữ nguyên:** cùng request trong tab Network, lọc và phân trang không đổi.

## Bài 4 — Fake adapter và test

- `libs/portal/domain-tickets/src/testing.ts`: `InMemoryTicketAdapter` (không dùng `@Injectable`, cung cấp bằng `useValue`
  để test giữ tham chiếu và đọc `calls`), `aTicket()`.
- `ticket-list.page.spec.ts`: 2 test, không có `HttpClient` trong providers. Test thứ hai click checkbox thật rồi kiểm tra
  `port.calls.at(-1)?.query.assignee === 'agent1'`.
- `http-ticket.adapter.spec.ts`: dùng `HttpTestingController`, kiểm tra URL, `status`, `page` và kết quả đã chuyển đổi
  (không còn trường `version`).

Điểm chấm: assertion nói về **hành vi** (port nhận đúng query, bảng hiện đúng phiếu), không assert chi tiết nội bộ như số lần
change detection. Test màn hình phải chạy khi container `api` đang tắt.

## Bài 5 — Luật import và CI

Thông báo lỗi thật (đã chạy trên repo):

```
error  'TicketApi' import from '@care/shared-data-access-api' is restricted. Inject TicketPort
       (@care/portal-domain-tickets) thay vi goi TicketApi truc tiep (ADR-0002)            no-restricted-imports
error  A project tagged with "type:feature" is not allowed to import "@angular/common/http"   @nx/enforce-module-boundaries
error  A project tagged with "type:domain" is not allowed to import "@angular/core"           @nx/enforce-module-boundaries
error  A project tagged with "type:domain" can only depend on libs tagged with
       "type:domain", "type:util"                                                         @nx/enforce-module-boundaries
```

Vì sao `TicketApi` phải chặn bằng `no-restricted-imports` mà không dùng tag? Feature vẫn được phép phụ thuộc
`shared-data-access-api` để dùng `TICKET_STATUS`, `toPageRequest`... Tag chỉ phân biệt theo lib, còn quy tắc này cần phân biệt theo **tên export**.

CI: `.github/workflows/ci.yml` chạy `npm ci` rồi `npx nx run-many -t lint` trong `frontend/` cho mỗi push vào `main` và mỗi PR.

Câu hỏi thảo luận (một hướng đúng):
- Thêm *tạo phiếu*, *duyệt phiếu*: có thể thêm method vào `TicketPort` khi vẫn cùng một nguồn dữ liệu và cùng màn hình dùng;
  tách port riêng (`TicketCommandPort`) khi lệnh ghi có ràng buộc khác (idempotency, quyền Manager) hoặc có nơi chỉ đọc.
- Màn hình Thuê bao: chưa cần tách nếu chưa có nhu cầu test độc lập hay đổi nguồn dữ liệu. ADR-0002 ghi rõ điều kiện xem lại.

## Review chéo — ADR

Mẫu đáp án: `docs/adr/0002-tach-ticket-port.md` trong patch. Điểm chấm ADR:
- Bối cảnh có **dấu hiệu quan sát được**, không chỉ "để clean hơn".
- Có ít nhất 3 phương án, mỗi phương án có nhược điểm thật.
- Mục *Cách kiểm chứng* trỏ tới luật lint và test cụ thể.

## Phá luật feature → feature (demo 2 của giảng viên)


Lỗi khi import `@care/portal-feature-subscribers` từ một feature khác:

```
error  A project tagged with "type:feature" can only depend on libs tagged with
       "type:ui", "type:data-access", "type:util"  @nx/enforce-module-boundaries
```

Lỗi khi import bằng đường dẫn tương đối:

```
error  Projects cannot be imported by a relative or absolute path, and must begin
       with a npm scope  @nx/enforce-module-boundaries
```

Điểm khác nhau:
- **Lỗi thứ nhất** chặn **sai tầng kiến trúc**.
- **Lỗi thứ hai** chặn việc **đi vòng qua public API** (`index.ts`). Nếu không chặn, lib không còn ranh giới: ai cũng import file nội bộ của người khác, và đổi tên một file có thể làm hỏng team khác.

Câu hỏi thảo luận (một hướng đúng):
1. Tách bảng hiển thị thuê bao thành lib `libs/portal/ui-subscriber-table` với tag `scope:portal,type:ui`. Nếu admin cũng cần dùng thì đặt ở `libs/shared/ui-subscriber-table`, tag `scope:shared,type:ui`.
2. Component trong lib này chỉ nhận `input()` và phát `output()`, không inject API.
3. Phụ thuộc sau khi tách:

```
feature-subscribers ──► ui-subscriber-table ◄── feature-service-plans
```

## Bài mở rộng — Runtime config

Các thay đổi trong `mo-rong-runtime-config.patch`:
- `AppConfig`: thêm `environmentName?: string`.
- `Shell`: thêm `environmentName = input<string>()`. Template hiện `<nz-tag class="env-tag">` ngay sau tên app, bên trong `@if (environmentName(); as env)`.
  Màu chữ `#ad4e00` trên nền `#fff7e6` (5,1:1): preset `nzColor="orange"` của ng-zorro chỉ đạt khoảng 3:1, không đủ chuẩn WCAG AA.
- `App` (portal): `config = inject(APP_CONFIG)`, binding `[environmentName]="config.environmentName"`.
- `config.json`: thêm `"environmentName": "DEV"`.
- `app.spec.ts`: provide `APP_CONFIG` trong test (`{ environmentName: 'TEST', apiUrl: '', auth: { mode: 'local' } }`).

Kết quả đã kiểm tra trên bản build production: sửa `dist/apps/portal/browser/config.json` từ `DEV` thành `TEST` rồi tải lại trang, nhãn đổi theo mà không cần build lại.

Vì sao không dùng `environment.ts`? Giá trị trong `environment.ts` được **đóng cứng vào bundle lúc build**. Như vậy mỗi môi trường phải có một bản build riêng, và bản đã test ở môi trường TEST không phải là bản được đưa lên PROD. Với `config.json`, ta build **một lần**, rồi CI/CD chỉ thay file config theo từng môi trường (xem buổi 9).
