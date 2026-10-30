---
paths:
  - "frontend/**"
---
# Frontend (Nx + Angular 22)

## Công nghệ và cách viết

- Standalone component, **zoneless**, signals, `ChangeDetectionStrategy.OnPush`. Template dùng control flow `@if`, `@for` (có `track` theo id), không `*ngIf`.
- State: signal cho state cục bộ, `rxResource`/`toSignal` cho dữ liệu server, NgRx SignalStore cho state theo màn hình.
  Quyết định đã chốt: URL là nguồn sự thật của bộ lọc trang Phiếu (ADR-0003).
- RxJS: `switchMap` khi kết quả cũ phải bị bỏ, `catchError` **bên trong** `switchMap`; không `subscribe()` trần trong component (dùng `toSignal`, `takeUntilDestroyed`).
- UI: **ng-zorro-antd** (ADR-0001). Không PrimeNG.
- Import qua alias `@care/<scope>-<type>-<ten>` (tsconfig paths), không import đường dẫn tương đối chéo lib.

## Luật phụ thuộc giữa lib (`frontend/eslint.config.mjs`)

Mỗi lib có 2 tag: `scope:portal|admin|shared` và `type:app|feature|ui|data-access|domain|util`.

| Tag | Chỉ được phụ thuộc |
|---|---|
| `type:app` | feature, ui, data-access, domain, util |
| `type:feature` | ui, data-access, domain, util; **cấm** `@angular/common/http` |
| `type:ui` | ui, domain (chỉ kiểu), util |
| `type:data-access` | data-access, domain, util |
| `type:domain` | domain, util; **cấm** import Angular, ng-zorro |
| `type:util` | util |

`scope:portal|admin` phụ thuộc chính nó + `shared`; `scope:shared` chỉ phụ thuộc `shared`. Feature phiếu gọi dữ liệu qua `TicketPort`, không import `TicketApi`
(ADR-0002). Adapter chọn ở composition root (`apps/portal/src/app/app.routes.ts`). Thêm lib mới phải gắn đủ 2 tag; chạy `nx lint` để kiểm tra.

## i18n và theme

- Mọi chữ hiển thị qua key Transloco, **thêm đồng thời `vi.json` và `en.json`** (`libs/shared/util-i18n/src/assets/i18n/`). Vi mặc định.
- Ngày, số dùng `translocoDate`/`translocoDecimal`; không `toLocaleDateString('vi-VN')` cứng.
- Màu chỉ từ token `var(--care-*)` (`libs/shared/ui-layout/src/styles/_base.scss`); mỗi cặp màu mới phải đo ≥ 4.5:1 cả theme sáng và tối.
- Truy cập: control có `label`/`aria-label`, lỗi form gắn `aria-describedby`, nút chỉ có icon phải có `aria-label` và `title`.

## Xác thực

- `AuthService` lưu phiên trong `sessionStorage` (`care.auth`). Interceptor chỉ gắn Bearer cho request cùng origin với `apiUrl` (so bằng `URL`, không `startsWith`)
  và không gắn cho `/api/auth/*`.
- Refresh dùng chung một request cho mọi 401 đồng thời; refresh bị từ chối thì đăng xuất đúng một lần, giữ `returnUrl`.
- Ẩn nút theo role chỉ là trải nghiệm, không phải phân quyền.

## Test

- Vitest cho unit/component; viết **test đỏ trước** khi sửa lỗi. Fake adapter `InMemoryTicketAdapter` (`@care/portal-domain-tickets/testing`) cho màn hình phiếu.
- Playwright (`apps/portal-e2e`) chạy với backend thật; mỗi lần chạy `ticket-flow` đóng một phiếu và tạo một phiếu mới.
- Gate: `npx nx run-many -t lint test build` phải pass **mọi project** (xem skill `kiem-tra-gate`).

## Bẫy đã gặp

- nz-table có hàng đo rỗng: lấy hàng dữ liệu bằng `tbody tr.ant-table-row`. `page.goto` tải lại cả trang (mất state); điều hướng bằng nút trong app.
- Test Back/Forward cần `provideLocationMocks()`, `router.initialNavigation()` và chờ `NavigationEnd`.
- jsdom không có kích thước viewport: test virtual scroll kiểm `aria-rowcount` và "ít hơn N dòng", không đếm chính xác.
