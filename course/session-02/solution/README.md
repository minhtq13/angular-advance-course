# Đáp án lab buổi 2

## Áp đáp án vào code

Trong thư mục gốc repo, từ `session02-start`:

```bash
git apply course/session-02/solution/bai1-ticket-row.patch
git apply course/session-02/solution/bai2-3-form-tao-phieu.patch
git apply course/session-02/solution/bai4-5-duyet-va-idempotency.patch
```

Gỡ theo thứ tự ngược lại:

```bash
git apply -R course/session-02/solution/bai4-5-duyet-va-idempotency.patch
git apply -R course/session-02/solution/bai2-3-form-tao-phieu.patch
git apply -R course/session-02/solution/bai1-ticket-row.patch
```

Đã kiểm tra: sau **từng** patch, `nx run-many -t lint test build` đều pass (16 project). Gỡ ra thì repo về đúng `session02-start`.
Spec E2E `apps/portal-e2e/src/ticket-flow.spec.ts` (trong patch cuối) đã chạy pass với backend thật.

---

## Bài 1 — `ticket-row`

| File | Vai trò |
|---|---|
| `libs/portal/ui-tickets/src/lib/ticket-row/ticket-row.ts` + `.html` | Component hiển thị, selector `tr[care-ticket-row]`, 3 input, 1 output |
| `libs/portal/ui-tickets/src/lib/ticket-tags.ts` | Nhãn và màu của trạng thái, ưu tiên, phân loại (trùng với `shared-data-access-api`, xem bên dưới) |
| `libs/portal/ui-tickets/src/lib/ticket-row/ticket-row.spec.ts` | Test hợp đồng bằng host component |
| `libs/portal/ui-tickets/eslint.config.mjs` | Cho phép selector dạng `attribute` |
| `eslint.config.mjs` | `type:ui` được phụ thuộc `type:domain` |
| `feature-tickets/.../ticket-list.page.html` | Dùng `<tr care-ticket-row>`, thêm cột Thao tác `nzRight`, `nzScroll.x` 1300px |

Lỗi lint thật khi chưa sửa luật:

```
error  A project tagged with "type:ui" can only depend on libs tagged with "type:ui", "type:util"
       @nx/enforce-module-boundaries
error  The selector should start with one of these prefixes: "care"            @angular-eslint/component-selector
```

Thông báo thứ hai gây hiểu nhầm: selector đã có tiền tố `care`. Nguyên nhân là luật cấu hình `type: 'element'`, còn selector là `tr[care-ticket-row]`.

**Vì sao cho `ui` → `domain` mà không copy interface?** Domain là TypeScript thuần (lint đã cấm `@angular/core` ở domain từ buổi 1),
nên lib ui chỉ dùng **kiểu**, không kéo theo HTTP hay state. Copy interface tạo hai nguồn sự thật; đưa model xuống util làm mất ranh giới domain.

**Nợ kỹ thuật cố ý để lại:** `ticket-tags.ts` trùng với `TICKET_STATUS`, `TICKET_PRIORITY`, `TICKET_CATEGORY` trong `shared-data-access-api`
(lib ui không được import data-access). Bài tập về nhà buổi 2 phần 4 yêu cầu thiết kế lại.

Điểm chấm:
- `ticket` dùng `input.required`; `canApprove` do **container** tính, component không biết vai trò người dùng.
- Không inject service nào trong lib ui.
- Test kiểm tra qua DOM và output, có cả ca `approving` (nút bị vô hiệu, không phát sự kiện).
- Cột thao tác không bị khuất khi màn hình hẹp (`nzRight`).

## Bài 2–3 — Form tạo phiếu

| File | Vai trò |
|---|---|
| `feature-tickets/src/lib/ticket-create/not-blank.validator.ts` + spec | Validator, 6 test |
| `feature-tickets/src/lib/ticket-create/ticket-create.page.ts` + `.html` + spec | Trang, form typed, trạng thái gửi, lỗi server |
| `feature-tickets/src/lib/ticket.routes.ts` | Route `new` đặt trước route rỗng |
| `feature-tickets/.../ticket-list.page.*` | Nút Tạo phiếu, thông báo "Đã tạo phiếu …" từ navigation state |
| `feature-subscribers/.../subscriber-detail.page.html` | Nút Tạo phiếu kèm `?subscriberId=` |
| `shared/ui-layout/src/styles/_base.scss` | Token `--care-danger`, `.field-error`, `.form-panel`, `.page-action` |

Đoạn quan trọng:

```ts
protected submit(): void {
  if (this.submitting()) return;
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    this.submitError.set({ key: 'ticket.form.invalid' });
    this.focusFirstInvalid();
    return;
  }
  ...
  error: (error: unknown) => {
    this.submitting.set(false);                       // không reset form
    if (error instanceof TicketValidationError) {
      this.applyServerErrors(error.fieldErrors);      // control.setErrors({ ...errors, server: message })
      this.submitError.set({ text: error.message });
      this.focusFirstInvalid();
    } else {
      this.submitError.set({ key: 'ticket.form.submitError' });
    }
  },
}
```

Màu chữ lỗi đã đo: `#cf1322` trên nền trắng 5,57:1, trên `--care-bg` 5,15:1; theme tối `#ff7875` trên `#141414` 7,19:1.
Màu chữ lỗi mặc định của ng-zorro `#ff4d4f` chỉ đạt khoảng 3,3:1.

Điểm chấm:
- `notBlank` không báo lỗi với chuỗi rỗng (để `required` báo). Không hiện hai lỗi cho cùng một trường.
- Lỗi chỉ hiện sau khi trường đã được chạm vào hoặc sau khi bấm gửi.
- `aria-invalid`/`aria-describedby` **chỉ có** khi đang lỗi (giá trị `null` để Angular gỡ thuộc tính).
- Vùng `aria-live` nằm ngoài `@if` (có sẵn trong DOM), nếu không trình đọc màn hình có thể không đọc thông báo đầu tiên.
- Nhánh lỗi không gọi `reset()`; test kiểm tra giá trị ô nhập vẫn còn.
- Lỗi `server` tự mất khi sửa giá trị (test có kiểm tra).
- Gửi lệnh với `title.trim()`.

## Bài 4 — Duyệt phiếu và 409

```ts
protected approve(ticket: TicketSummary): void {
  if (this.approvingId() !== null) return;
  this.approvingId.set(ticket.id);
  ...
  this.tickets.approve(ticket.id, ticket.version).pipe(
    finalize(() => this.approvingId.set(null)),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe({
    next: (approved) => { this.notice.set({ key: 'ticket.approve.done', params: { code: approved.code } }); this.result.reload(); },
    error: (error: unknown) => this.approveError.set(
      error instanceof TicketConflictError ? { text: error.message } : { key: 'common.genericError' }),
  });
}
```

Bằng chứng mong đợi (request thứ hai, tab Network):

```
POST /api/tickets/49999/approve   {"version":0}   → 409
{"type":"about:blank","title":"Conflict","status":409,
 "detail":"Dữ liệu đã bị người khác thay đổi, vui lòng tải lại","instance":"/api/tickets/49999/approve"}
```

Agent gọi thẳng API → **403** (body rỗng). Nút ẩn trên UI chỉ là trải nghiệm; quyền thật nằm ở `@PreAuthorize("hasRole('SUPERVISOR')")`.

Điểm chấm:
- Gửi kèm `version` đang hiển thị.
- 409: báo rõ, giữ màn hình, để người dùng **chọn** tải lại. Không tự gửi lại với version mới.
- Chỉ phiếu `RESOLVED` có nút; trong lúc duyệt, nút của dòng đó bị vô hiệu.

## Bài 5 — Idempotency

```ts
/** Một key cho một lần "tạo phiếu". Gửi lại sau lỗi dùng lại key này. */
private idempotencyKey = crypto.randomUUID();
...
this.tickets.create(command, this.idempotencyKey)
next: (ticket) => { this.idempotencyKey = crypto.randomUUID(); ... }
```

Replay trên DevTools sau khi sửa: cùng mã phiếu, header `Idempotent-Replayed: true`. Gửi cùng key với nội dung khác → 409
`error.idempotencyKeyReused`.

Câu hỏi thảo luận (một hướng đúng):
- **Disable nút không đủ** vì: request tới server nhưng response mất (timeout, mất mạng), người dùng tải lại trang rồi gửi lại, mở hai tab,
  thư viện HTTP hoặc proxy tự retry, app mobile gửi lại khi có mạng.
- **`approve` không cần `Idempotency-Key`**: `version` đã làm lệnh này an toàn khi gửi lại. Lần gửi thứ hai mang version cũ nên bị 409,
  không đóng phiếu hai lần. Nếu muốn lần gửi lại báo "thành công" thay vì 409, cần idempotency key (đánh đổi: thêm trạng thái ở server).
- Idempotency trong bộ nhớ chỉ đúng với một instance và mất khi khởi động lại. Production lưu DB/Redis, có TTL, và gắn key với người dùng.
