# Lab buổi 2 — Component dùng lại và màn hình nghiệp vụ phức tạp

**Thời gian:** 120 phút · **Điểm xuất phát:** `git checkout session02-start`

**Use case.** Agent (`agent1`) tạo phiếu yêu cầu cho thuê bao; Manager (`supervisor1`) duyệt phiếu đã xử lý xong
(*Đã xử lý* → *Đã đóng*). Hôm nay bạn sẽ:
- trích dòng bảng phiếu thành component dùng lại;
- xây form tạo phiếu chặn tiêu đề chỉ có khoảng trắng và giữ nguyên nội dung khi API lỗi;
- xử lý tình huống hai Manager duyệt cùng một phiếu (HTTP 409);
- dùng `Idempotency-Key` để gửi lại an toàn.

**Đã có sẵn ở `session02-start`** (không cần sửa):

| Phần | Nội dung |
|---|---|
| Backend | `POST /api/tickets` nhận header `Idempotency-Key`; `POST /api/tickets/{id}/approve` `{ version }` chỉ cho `SUPERVISOR`, version cũ hoặc sai trạng thái → 409 |
| `TicketPort` | Thêm `create(command, idempotencyKey)` và `approve(id, version)`; `TicketSummary` có `version` |
| Lỗi nghiệp vụ | `TicketConflictError` (409), `TicketValidationError` (400, có `fieldErrors`) trong `@care/portal-domain-tickets` |
| Fake adapter | `InMemoryTicketAdapter` mô phỏng version, idempotency và `failNext(error)`; ghi lại `createCalls`, `approveCalls` |
| i18n | Key `ticket.form.*`, `ticket.approve.*`, `ticket.col.actions`, `ticket.new`, `title.ticketNew`, `subscriber.createTicket` ở cả vi và en |

Trước khi bắt đầu:
```bash
docker compose -f infra/docker-compose.yml up -d --build api   # backend có endpoint mới
cd frontend && npm ci && npm start
```
Tất cả lệnh `nx` chạy trong thư mục `frontend/`. Mọi chữ trên giao diện đi qua key i18n; mọi màu lấy từ token `var(--care-*)`.

---

## Bài 1 — Trích `ticket-row` (30 phút)

### 1.1 Tạo lib

```bash
npx nx g @nx/angular:library libs/portal/ui-tickets \
  --name=portal-ui-tickets --tags=scope:portal,type:ui
```

Xóa thư mục component mẫu trong `src/lib/`.

### 1.2 Viết component

`libs/portal/ui-tickets/src/lib/ticket-row/ticket-row.ts` (+ `.html`):

- Selector **`tr[care-ticket-row]`** (dạng thuộc tính, để DOM vẫn là `tbody > tr > td`).
- `ticket = input.required<TicketSummary>()`, `canApprove = input(false)`, `approving = input(false)`, `approve = output<TicketSummary>()`.
- Render 9 ô: 8 ô như dòng hiện tại trong `ticket-list.page.html` và ô cuối chứa nút **Duyệt** khi `canApprove()`.
  Nút có `aria-label` gồm cả mã phiếu, bị vô hiệu và quay khi `approving()`.
- Ô cuối có `nzRight` để cột thao tác luôn hiện khi bảng cuộn ngang.
- Không inject service nào. Nhãn và màu của trạng thái, ưu tiên, phân loại: lib `ui` không được import `shared-data-access-api`,
  nên tạo `ticket-tags.ts` riêng trong lib (ghi chú lại đây là nợ kỹ thuật, bài tập về nhà sẽ xử lý).

Export component từ `src/index.ts`.

### 1.3 Đọc lỗi lint và quyết định

Chạy `npx nx lint portal-ui-tickets`. Bạn sẽ gặp hai loại lỗi:
1. `@angular-eslint/component-selector`: thông báo là *"The selector should start with one of these prefixes: "care""*, dễ gây hiểu nhầm
   vì selector đã có tiền tố `care`. Nguyên nhân thật: luật đang chỉ chấp nhận selector dạng element. Trong `libs/portal/ui-tickets/eslint.config.mjs`, cho phép
   `type: ['element', 'attribute']` và ghi một dòng chú thích lý do.
2. `@nx/enforce-module-boundaries`: `type:ui` không được phụ thuộc `type:domain`. Thảo luận nhanh với nhóm các phương án
   (copy interface, đưa model xuống util, mở luật), rồi sửa `eslint.config.mjs` gốc: `type:ui` → `['type:ui', 'type:domain', 'type:util']`,
   kèm chú thích lý do.

### 1.4 Dùng trong danh sách

Trong `ticket-list.page.html`, thay toàn bộ nội dung `<tr>` trong `@for` bằng:

```html
<tr care-ticket-row [ticket]="t"></tr>
```

Thêm cột tiêu đề **Thao tác** (`ticket.col.actions`, `nzWidth="100px"`, `nzRight`) và tăng `nzScroll.x` lên `1300px`.
Xóa các import và field không còn dùng trong `ticket-list.page.ts`.

### 1.5 Test hợp đồng

`ticket-row.spec.ts` dùng một **host component** bọc `<table><tbody><tr care-ticket-row ...>`. Ba test:
- Render đủ 9 ô, đúng mã phiếu, hiện "Chưa giao" khi chưa có người xử lý.
- Không có nút khi `canApprove` là false; bật lên rồi bấm thì `approve` phát đúng phiếu.
- `approving` là true: nút bị vô hiệu, bấm không phát sự kiện.

Kiểm tra:
- [ ] `npx nx run-many -t lint test -p portal-ui-tickets portal-feature-tickets` pass
- [ ] http://localhost:4200/tickets hiển thị như trước, thêm cột **Thao tác** (đang trống)

---

## Bài 2 — Form tạo phiếu (35 phút)

### 2.1 Validator

`libs/portal/feature-tickets/src/lib/ticket-create/not-blank.validator.ts`: chuỗi chỉ gồm khoảng trắng → `{ blank: true }`;
chuỗi rỗng hoặc `null` → `null` (để `required` báo, tránh hiện hai lỗi cùng lúc). Viết test bằng `it.each` cho
`'   '`, `'\t\n'`, `'  a '`, `''`, `null`, và một test cho thấy `required` + `notBlank` chỉ báo một lỗi mỗi lúc.

### 2.2 Trang và route

- `TicketCreatePage` (`ticket-create.page.ts` + `.html`), standalone, `OnPush`, selector `care-ticket-create-page`.
- Route `new` trong `ticket.routes.ts`, đặt **trước** route rỗng, `title: 'title.ticketNew'`.
- `subscriberId = input<number | undefined, unknown>(undefined, { transform })`: đọc từ `?subscriberId=12`
  (app đã bật `withComponentInputBinding()`). Trong `ngOnInit`, nếu có giá trị thì gán vào form.
- Form typed:

  | Control | Kiểu | Validator |
  |---|---|---|
  | `subscriberId` | `number \| null` | `required` |
  | `category` | `TicketCategory \| null` | `required` |
  | `priority` | `TicketPriority`, `nonNullable`, mặc định `MEDIUM` | `required` |
  | `title` | `string`, `nonNullable` | `required`, `notBlank`, `maxLength(200)` |
  | `description` | `string`, `nonNullable` | `maxLength(4000)` |

- Template dùng `nz-form` dọc, `nz-form-label` có `nzFor` trỏ tới `id` của ô nhập. Option phân loại và ưu tiên lấy bằng
  `toOptions(TICKET_CATEGORY)`, `toOptions(TICKET_PRIORITY)`.
- Hiển thị lỗi bằng `<div class="field-error" id="...-error">`, **không** dùng `nzErrorTip` (màu chữ mặc định chỉ đạt 3,3:1 và không
  có `id` để nối `aria-describedby`). Thêm token `--care-danger` (sáng `#cf1322`, tối `#ff7875`) và class `.field-error`,
  `.form-panel`, `.page-action` vào `libs/shared/ui-layout/src/styles/_base.scss`.
- Mỗi ô nhập: `[attr.aria-invalid]` và `[attr.aria-describedby]` chỉ có giá trị khi đang lỗi.

### 2.3 Lối vào trang

- Đầu trang danh sách phiếu: nút **Tạo phiếu** (`ticket.new`, class `page-action`) dẫn tới `/tickets/new`.
- Trang chi tiết thuê bao: nút **Tạo phiếu** (`subscriber.createTicket`) dẫn tới `/tickets/new?subscriberId=<id>`.

### 2.4 Test

`ticket-create.page.spec.ts` với `InMemoryTicketAdapter`, `provideRouter([])`, `provideUi()`, `provideI18nTesting()`:
- Đọc `subscriberId` từ input (`fixture.componentRef.setInput('subscriberId', '12')`).
- Tiêu đề `'    '`: không gọi `create`, ô tiêu đề có `aria-invalid="true"`, `aria-describedby="tk-title-error"`, thông báo
  "Không được chỉ có khoảng trắng", và **focus nằm ở ô tiêu đề**.

> `nz-select` không có ô nhập thật để gõ; trong test, đặt giá trị phân loại qua `form.controls.category.setValue(...)`.

---

## Bài 3 — Trạng thái gửi và lỗi API (25 phút)

1. `submitting = signal(false)`, `submitError = signal<FieldError | null>(null)`. Nút gửi: `[nzLoading]` và `[disabled]` theo
   `submitting()`, nhãn đổi thành "Đang gửi…".
2. `submit()`:
   - Đang gửi thì `return` (chống nhấp lặp phía client).
   - Form không hợp lệ: `markAllAsTouched()`, đặt lỗi chung `ticket.form.invalid`, đưa focus tới phần tử `[aria-invalid="true"]`
     đầu tiên bằng `afterNextRender(..., { injector })`.
   - Gửi `create()` với `title.trim()`, `description.trim() || undefined`.
   - Thành công: `router.navigate(['/tickets'], { state: { created: ticket.code } })`. Trang danh sách đọc
     `inject(Router).currentNavigation()?.extras.state` và hiện "Đã tạo phiếu TK-…".
   - Lỗi: **không reset form**. `TicketValidationError` → gắn từng `fieldErrors` vào control bằng
     `control.setErrors({ ...control.errors, server: message })` + `markAsTouched()`, hiện `error.message` ở đầu form, focus lỗi đầu tiên.
     Lỗi khác → `ticket.form.submitError`.
3. Thông báo lỗi chung nằm trong `<div aria-live="assertive">` có sẵn trong DOM (không đặt `aria-live` bên trong `@if`).

Test thêm:
- [ ] `port.failNext(new TicketValidationError('Dữ liệu không hợp lệ', { title: 'Tiêu đề đã bị cấm' }))`: form giữ nguyên tiêu đề và
      mô tả, lỗi server hiện ở ô tiêu đề, sửa tiêu đề thì lỗi đó mất.
- [ ] `port.failNext(new Error('network'))`: báo lỗi chung, form giữ nguyên, nút gửi bấm lại được.
- [ ] Thành công: `createCalls[0].command` đã trim; `navigate` được gọi với state `created` (dùng `vi.spyOn(router, 'navigate')`).

Thử trên trình duyệt: tạo phiếu thật từ trang chi tiết thuê bao; chuyển sang **EN** và chế độ **Tối**, kiểm tra chữ và màu lỗi.

---

## Bài 4 — Duyệt phiếu và HTTP 409 (20 phút)

1. `TicketListPage`:
   - `isManager = computed(() => this.auth.hasAnyRole('SUPERVISOR'))` (chỉ để ẩn/hiện nút).
   - `<tr care-ticket-row [ticket]="t" [canApprove]="isManager() && t.status === 'RESOLVED'" [approving]="approvingId() === t.id" (approve)="approve($event)">`.
   - `approve(ticket)`: gọi `tickets.approve(ticket.id, ticket.version)`, `finalize` để xóa `approvingId`, `takeUntilDestroyed`.
     Thành công → thông báo `ticket.approve.done` và `result.reload()`. `TicketConflictError` → alert lỗi
     (`ticket.approve.conflictTitle` + `error.message` từ backend) kèm nút **Tải lại danh sách**. **Không** tự động gửi lại.
2. Test (fake adapter, AuthService giả có `hasAnyRole`):
   - Chỉ phiếu `RESOLVED` có nút; duyệt xong hiện "Đã duyệt phiếu …" và nút biến mất.
   - Gọi `port.approve(101, 3)` trước (mô phỏng Manager khác), rồi bấm Duyệt trên màn hình còn version 3 → alert lỗi, `approveCalls`
     cuối là `{ id: 101, version: 3 }`; bấm **Tải lại danh sách** → alert mất, phiếu không còn nút.
   - Cập nhật test cũ: AuthService giả của Agent cần thêm `hasAnyRole: () => false`.
3. Tái hiện thật: hai cửa sổ ẩn danh (hoặc hai trình duyệt), cùng đăng nhập `supervisor1`, lọc **Đã xử lý**, cùng duyệt dòng đầu.
   Ghi lại status và body của request thứ hai ở tab Network.
4. Đăng nhập `agent1`: không thấy nút. Lấy token của agent (tab Network, header `Authorization`) rồi gọi thẳng API:

   ```bash
   curl -i -X POST localhost:8081/api/tickets/<id>/approve -H "Authorization: Bearer <token>" \
     -H 'Content-Type: application/json' -d '{"version":0}'
   ```
   Kết quả phải là **403**.

---

## Bài 5 — Chống nhấp lặp và idempotency (10 phút)

Ở Bài 3, mỗi lần bấm gửi bạn sinh một `crypto.randomUUID()` mới làm `Idempotency-Key`.

1. **Thấy lỗi:** DevTools → Network → throttling **Slow 3G**. Tạo phiếu, chuột phải request `POST /api/tickets` → **Replay XHR**
   hai lần. Response header `Idempotent-Replayed` là gì, mã phiếu có trùng không? Giờ hãy hình dung request đầu bị timeout và
   người dùng bấm gửi lại: key mới → **phiếu thứ hai**.
2. **Sửa:** chuyển key thành field của component, sinh **một lần cho một lần tạo phiếu**; gửi lại sau lỗi dùng lại key;
   thành công thì sinh key mới.
3. **Test:**
   - `port.failNext(new Error('timeout'))`, bấm gửi hai lần → hai lần gọi `create` có **cùng** key.
   - Bấm nút gửi hai lần liên tiếp khi đang gửi → chỉ một lần gọi `create`.

Câu hỏi thảo luận (chuẩn bị cho review chéo):
- Disable nút đã đủ chưa? Liệt kê ít nhất 3 tình huống disable nút không chặn được.
- Duyệt phiếu (`approve`) có cần `Idempotency-Key` không? (Gợi ý: version đóng vai trò gì?)

---

## Kiểm tra cuối lab

```bash
npx nx run-many -t lint test build
```

Tùy chọn, có backend chạy: `npx playwright test -c apps/portal-e2e/playwright.config.mts ticket-flow` (đáp án có sẵn spec này;
mỗi lần chạy sẽ đóng một phiếu và tạo một phiếu mới trong DB).

## Review chéo (20 phút)

Mỗi nhóm trình bày trong 5 phút:
1. Hợp đồng `TicketRow`: input nào bắt buộc, vì sao `canApprove` do container tính.
2. Một lỗi API trên form: người dùng thấy gì, trình đọc màn hình đọc gì, focus ở đâu.
3. Bằng chứng 409 (ảnh tab Network) và câu trả lời hai câu hỏi thảo luận Bài 5.

Nhóm khác kiểm tra: có chữ cứng nào trong template không, có màu cứng nào không, test có kiểm tra hành vi hay chỉ kiểm tra "không lỗi".

## Đáp án

Đáp án nằm trong [`../solution/`](../solution/). Chỉ mở sau khi đã tự làm.
