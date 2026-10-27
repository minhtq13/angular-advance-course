# Đáp án lab buổi 1

## Áp đáp án vào code

Trong thư mục gốc repo (từ trạng thái `session01-start`):

```bash
git apply course/session-01/solution/bai2-goi-cuoc.patch
git apply course/session-01/solution/bai4-runtime-config.patch   # áp sau bài 2
```

Gỡ đáp án (theo thứ tự ngược lại):

```bash
git apply -R course/session-01/solution/bai4-runtime-config.patch
git apply -R course/session-01/solution/bai2-goi-cuoc.patch
```

Hai patch đã được kiểm tra: áp vào thì `nx run-many -t lint test build` pass cho cả 12 project; gỡ ra thì repo về đúng trạng thái ban đầu.

---

## Bài 1 — Khám phá workspace

1. **2 app** (`portal`, `admin`), **1 project e2e** (`portal-e2e`), **8 lib**.
2. `scope:portal`, `type:feature`.
3. `admin` → `admin-feature-dashboard`, `shared-data-access-auth`, `shared-feature-auth`, `shared-ui-layout`, `shared-util-config`.
   **Không** có lib nào của portal. Luật `scope:admin` chỉ cho phép phụ thuộc `scope:admin` và `scope:shared`.
4. `type:ui` chỉ được import `type:ui` và `type:util`. UI không được tự gọi API (`data-access`) và không được biết về màn hình nghiệp vụ (`feature`).
5. `loadChildren` tách code của feature thành **lazy chunk**, chỉ tải khi người dùng vào màn hình đó. Nhờ vậy bundle ban đầu nhỏ hơn và các team không đụng code của nhau.
6. **Lazy** (`subscriber-list-page`, khoảng 7 kB, tải về chỉ khoảng 2,7 kB sau nén).

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

## Bài 3 — Module boundaries

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

## Bài 4 — Runtime config

Các thay đổi trong `bai4-runtime-config.patch`:
- `AppConfig`: thêm `environmentName?: string`.
- `Shell`: thêm `environmentName = input<string>()`. Template hiện `<nz-tag class="env-tag">` ngay sau tên app, bên trong `@if (environmentName(); as env)`.
  Màu chữ `#ad4e00` trên nền `#fff7e6` (5,1:1): preset `nzColor="orange"` của ng-zorro chỉ đạt khoảng 3:1, không đủ chuẩn WCAG AA.
- `App` (portal): `config = inject(APP_CONFIG)`, binding `[environmentName]="config.environmentName"`.
- `config.json`: thêm `"environmentName": "DEV"`.
- `app.spec.ts`: provide `APP_CONFIG` trong test (`{ environmentName: 'TEST', apiUrl: '', auth: { mode: 'local' } }`).

Kết quả đã kiểm tra trên bản build production: sửa `dist/apps/portal/browser/config.json` từ `DEV` thành `TEST` rồi tải lại trang, nhãn đổi theo mà không cần build lại.

Vì sao không dùng `environment.ts`? Giá trị trong `environment.ts` được **đóng cứng vào bundle lúc build**. Như vậy mỗi môi trường phải có một bản build riêng, và bản đã test ở môi trường TEST không phải là bản được đưa lên PROD. Với `config.json`, ta build **một lần**, rồi CI/CD chỉ thay file config theo từng môi trường (xem buổi 7).
