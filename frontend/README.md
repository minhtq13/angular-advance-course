# Care Portal — Frontend

Nx monorepo, Angular 22 (standalone, zoneless, signals) + ng-zorro-antd.

```
apps/
  portal/                     Ứng dụng cho nhân viên CSKH (port 4200)
  portal-e2e/                 Playwright E2E
  admin/                      Ứng dụng quản trị, chỉ role ADMIN (port 4300)
libs/
  shared/util-config          type:util         Cấu hình runtime (/config.json)
  shared/util-i18n            type:util         Đa ngôn ngữ (Transloco): vi (mặc định) / en, file dịch, LanguageService
  shared/data-access-auth     type:data-access  AuthService (JWT), interceptor, guard
  shared/feature-auth         type:feature      Trang đăng nhập
  shared/data-access-api      type:data-access  API client, model, nhãn hiển thị
  shared/ui-layout            type:ui           Shell, trang 403/404, provideUi()
  portal/feature-subscribers  type:feature      Tra cứu và chi tiết thuê bao
  portal/feature-tickets      type:feature      Danh sách phiếu yêu cầu
  admin/feature-dashboard     type:feature      Thống kê
```

Quy tắc phụ thuộc giữa các lib (tag `scope:*`, `type:*`) được ESLint kiểm tra, xem `eslint.config.mjs`.

## Lệnh thường dùng

```bash
nvm use                    # Node 24 (Angular 22 cần Node >= 22.22)
npm install
npm start                  # nx serve portal
npm run start:admin        # nx serve admin
npx nx run-many -t lint test build
npx nx e2e portal-e2e      # cần docker compose đang chạy
npx nx graph               # xem đồ thị phụ thuộc
```

## Quy ước giao diện

Token màu, khoảng cách, font và các class dùng chung nằm trong `libs/shared/ui-layout/src/styles/_base.scss`.

| Quy ước             | Cách làm                                                                                                                                                                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tiêu đề trang       | `<div class="page-header"><h1>…</h1></div>`; tiêu đề phần là `<h2 class="section-title">`                                                                                                                                                                      |
| Tên tab trình duyệt | Khai báo `title` trên route; `CareTitleStrategy` tự ghép thành "Tên trang · Care Portal"                                                                                                                                                                       |
| Bộ lọc              | Đặt trong `.filters`; mỗi ô là `.filter-field` có `<label for>` hiển thị (không dùng placeholder thay nhãn)                                                                                                                                                    |
| Bảng                | Đặt trong `.panel`; đặt `[nzScroll]="{ x: '…px' }"` để bảng tự cuộn ngang trên điện thoại; luôn có `[nzNoResult]` giải thích lý do bảng rỗng                                                                                                                   |
| Mở chi tiết         | Ô đầu tiên là `<a class="cell-link" [routerLink]>` để thao tác được bằng bàn phím; click cả hàng chỉ là tiện ích thêm                                                                                                                                          |
| Lỗi tải dữ liệu     | `nz-alert` có `role="alert"` và nút "Thử lại" (`resource.reload()`)                                                                                                                                                                                            |
| Thao tác nguy hiểm  | `nz-popconfirm` + `nzDanger`, đặt tách xa các nút thường                                                                                                                                                                                                       |
| Màu sắc             | Primary `#0958d9` (cấu hình trong `provideUi()`); màu chữ của tag đã được làm đậm để đạt ≥ 4,5:1, không dùng màu preset nhạt                                                                                                                                   |
| Icon                | Đăng ký trong `ICONS` của `provide-ui.ts`; icon đi kèm chữ thì đặt `aria-hidden="true"`                                                                                                                                                                        |
| Chữ hiển thị        | Không viết chữ cứng: thêm key vào **cả** `vi.json` và `en.json` (`libs/shared/util-i18n/src/assets/i18n/`), dùng `{{ 'key' \| transloco }}`; trong TS dùng `TranslocoService.translate()`. Test `translations.spec.ts` bắt thiếu key / lệch tham số            |
| Số, ngày, tiền      | `translocoDecimal`, `translocoDate: dateFormat` (`DATE_FORMAT`, `DATE_TIME_FORMAT`), `translocoPercent`, `translocoCurrency`: tự đổi `200.000` ↔ `200,000`, `27/10/2026` ↔ `10/27/2026`                                                                        |
| Giá trị enum        | Map trong `labels.ts` trả về **key dịch** (`labelKey`), không phải chữ                                                                                                                                                                                         |
| Lỗi từ backend      | Interceptor gửi `Accept-Language`; backend dịch `ProblemDetail.detail` (`messages*.properties`)                                                                                                                                                                |
| Theme sáng / tối    | Màu luôn dùng token `var(--care-*)` (bg, surface, text, text-muted, border, primary, placeholder); **không** viết mã hex trong component. Token tối định nghĩa trong `html[data-theme='dark']` (`_base.scss`). Màu nào cũng phải đo ≥ 4,5:1 ở **cả hai** theme |
| Chọn theme          | `ThemeService` (Sáng / Tối / Theo hệ thống, mặc định theo hệ thống, ghi nhớ trong `localStorage`); CSS dark của ng-zorro tải lười từ `/themes/`                                                                                                                |

Kiểm tra trước khi merge:

- Bố cục không tràn ngang ở độ rộng 390px.
- Dùng được toàn bộ bằng phím Tab và Enter.
- Độ tương phản chữ đạt ít nhất 4,5:1.
