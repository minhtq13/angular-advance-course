---
marp: true
theme: default
paginate: true
size: 16:9
header: 'Angular nâng cao · Buổi 8 — Ứng dụng AI và Copilot trong phát triển Angular'
style: |
  section { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; font-size: 26px; padding: 50px 64px; }
  h1 { color: #0050b3; }
  h2 { color: #0050b3; border-bottom: 3px solid #0050b3; padding-bottom: 6px; }
  header { color: #8c8c8c; font-size: 16px; }
  code { background: #f0f5ff; color: #1d39c4; }
  pre { font-size: 19px; line-height: 1.35; }
  table { font-size: 20px; }
  th { background: #0050b3; color: #fff; }
  .small { font-size: 20px; color: #595959; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .tip { background: #fffbe6; border-left: 6px solid #faad14; padding: 10px 16px; font-size: 22px; }
  .bad { background: #fff1f0; border-left: 6px solid #f5222d; padding: 10px 16px; font-size: 22px; }
  .good { background: #f6ffed; border-left: 6px solid #52c41a; padding: 10px 16px; font-size: 22px; }
  section.lead { background: #0050b3; color: #fff; justify-content: center; }
  section.lead h1, section.lead h2 { color: #fff; border: none; }
  section.lead header { color: #bae0ff; }
---

<!-- _class: lead -->
<!-- _paginate: false -->

# Buổi 8
## Ứng dụng AI và Copilot trong phát triển Angular

Prompt theo acceptance criteria · hướng dẫn repository · review diff · negative test · thử phá · năng suất thật

---

## Mục tiêu buổi học

Sau buổi này, học viên có thể:

1. Viết prompt theo **use case + acceptance criteria + ràng buộc**, không phải một dòng "thêm bộ lọc"
2. Viết **hướng dẫn repository** (`AGENTS.md`, `copilot-instructions.md`) từ quy ước thật của dự án
3. Review diff do AI sinh: **hợp đồng API, fake adapter, phiên bản Angular, i18n, theme, phạm vi**
4. Chứng minh test có giá trị bằng **lỗi có chủ đích**; viết **negative test**
5. Đo năng suất **có tính thời gian kiểm tra**; giữ đúng **chính sách dữ liệu**

<p class="small">Sản phẩm đầu ra: prompt · diff đã review · finding đã xác minh · báo cáo năng suất</p>

---

## Lịch buổi học (4 giờ)

| Thời gian | Hoạt động |
|---|---|
| 20' | Review buổi 7 (checklist SSO, báo cáo kiểm thử), phân tích use case |
| 40' | Prompt, hướng dẫn repository, MCP, review diff AI, test do AI viết, năng suất, dữ liệu |
| 30' | Live demo: PR "CI xanh" nhưng lọc không chạy; prompt tốt hơn; AI review và xác minh |
| 10' | Nghỉ |
| 120' | Lab 5 bài |
| 20' | Review chéo, chốt quy trình dùng AI của nhóm |

---

## Review buổi 7

- Lỗi `PATCH` đóng phiếu sống từ buổi 2 tới buổi 7 vì **không ai hỏi đúng câu** và test chỉ đi qua UI
- Thử phá: 39 test xanh vẫn lọt 2/4 chỗ phá
- Fake adapter, `HttpTestingController`: giả **cái gì**, và cái giả có đúng như cái thật không?

<div class="tip">Hôm nay: code do AI sinh làm mọi điểm yếu trên lộ ra nhanh hơn, vì AI viết code <b>và</b> viết test cho chính code đó.</div>

---

## Use case: "CI xanh, tester báo lọc không chạy"

Yêu cầu: lọc danh sách phiếu theo **Loại yêu cầu**. Backend đã có `GET /api/tickets?category=`. Đồng nghiệp nhờ AI với prompt một dòng.

| | Kết quả đo (backend thật) |
|---|---|
| CI | lint, test, build: **xanh 16 project** |
| Chọn "Cước phí" | Request `?type=BILLING`; 20 dòng: Cước phí 5, Khác 5, Dịch vụ 5, Mạng/sóng 5 |
| Đổi sang English | Nhãn vẫn "Loại yêu cầu" |
| Vào/ra trang phiếu 5 lần | Listener `keydown` trên `document`: 2 → **7** |

<p class="small">PR là bản mô phỏng một thay đổi do AI sinh, lỗi được cài có chủ đích: <code>course/session-08/lab/pr-bo-loc-loai-yeu-cau.patch</code></p>

---

<!-- _class: lead -->

# Phần 1
## Cho AI đủ ngữ cảnh

---

## Prompt một dòng và prompt theo acceptance criteria

<div class="cols">
<div>

**Prompt của PR**
```
Thêm bộ lọc theo loại yêu cầu
vào danh sách phiếu. Viết test.
```
AI phải **đoán**: tên tham số API, chỗ đặt state, cách dịch, có cần phím tắt không, test kiểm cái gì.

</div>
<div>

**Prompt nên có**
- **Use case**: ai, làm gì, vì sao
- **AC kiểm được**: "mọi dòng trả về đúng loại", "`?category=abc` bị bỏ qua"
- **Ràng buộc**: file được sửa, theo `AGENTS.md`, không thêm tính năng
- **Nguồn sự thật**: Swagger `/v3/api-docs`, `TICKET_CATEGORY`
- **Test bắt buộc**: negative, E2E với backend thật

</div>
</div>

<div class="tip">AC tốt cũng là danh sách test. Viết được AC thành test thì AI và người review cùng có thước đo.</div>

---

## Hướng dẫn ở repository: `AGENTS.md`

```markdown
## Angular 22: viết theo kiểu này
| Dùng                                         | Không dùng                          |
| `input()`, `output()`, `viewChild()`, signal | `@Input`, `@Output` + EventEmitter  |
| `@if`, `@for (x of xs; track x.id)`          | `*ngIf`, `*ngFor`, `track $index`   |
| `takeUntilDestroyed()`, `rxMethod`           | `subscribe` không có teardown       |

## Kiến trúc lib (lint chặn sai)
- Thêm trường cho phiếu: TicketQuery (domain) → TicketSearch (đúng tên tham số backend)
  → HttpTicketAdapter → fake InMemoryTicketAdapter phải mô phỏng cùng luật với backend.
- Không sửa eslint.config.mjs, tag Nx để "cho qua lỗi".
```

- Viết từ **file thật** của dự án, có lệnh và đường dẫn; ngắn, câu mệnh lệnh
- `AGENTS.md` (nhiều công cụ đọc), `.github/copilot-instructions.md` (Copilot), `CLAUDE.md`...: một nguồn, trỏ về nhau

---

## AI cần tài liệu đúng phiên bản: Angular MCP

```json
{ "mcpServers": { "angular-cli": {
    "command": "npx", "args": ["-y", "@angular/cli", "mcp", "--read-only"] } } }
```

- `ng mcp` có trong Angular CLI 22.2.4 của dự án: AI tra tài liệu, best practice, ví dụ **của bản đang dùng**
- `--read-only`: chỉ công cụ đọc. `--local-only`: không gọi Internet (khi chính sách không cho)
- Không có MCP: dán đường dẫn tài liệu, hoặc ghi rõ phiên bản trong `AGENTS.md`

<div class="bad">Model học từ code nhiều năm: <code>NgModule</code>, <code>*ngFor</code>, <code>@Input</code> chiếm đa số. Không nói phiên bản thì nó viết theo số đông.</div>

---

## Chính sách dữ liệu

| Được | Không được (khi chưa có phép) |
|---|---|
| Repo mẫu, dữ liệu giả của khóa học | Mã nguồn dự án khách hàng, hợp đồng, cấu hình production |
| Mô tả lỗi đã ẩn thông tin | Số thuê bao, CCCD, log có token, dump DB thật |
| Công cụ đơn vị đã duyệt, đúng cấu hình (vd không lưu lịch sử) | Công cụ cá nhân, extension lạ, "dán thử lên web" |

- Hỏi trước: công cụ nào được dùng, dữ liệu có rời khỏi mạng nội bộ không, có dùng để huấn luyện không
- `AGENTS.md` cũng ghi luật dữ liệu: AI đọc file đó trước khi sinh test, log, dữ liệu mẫu

---

<!-- _class: lead -->

# Phần 2
## Review và kiểm chứng

---

## Review diff do AI sinh: checklist

| Kiểm tra | PR | Cách kiểm |
|---|---|---|
| Hợp đồng API | `type=` thay `category=` | Swagger; Network |
| Fake giống thật | Fake không lọc theo loại | Đọc `InMemoryTicketAdapter.search` |
| Input không tin được | `params.get('category') as TicketCategory` | Mở `?category=abc` |
| Phiên bản Angular | `@Input`, `EventEmitter`, `@ViewChild`, `CommonModule` | Đối chiếu `AGENTS.md` |
| i18n, theme | Chữ cứng; `#1677ff` = 4,10:1 (trắng), 4,49:1 (tối) | Đổi English; đo tương phản |
| Teardown | `fromEvent(document,'keydown').subscribe` | Đếm listener (CDP / DevTools) |
| Phạm vi | Phím tắt Alt+L không ai yêu cầu | Đối chiếu AC; `git diff --stat` |

---

## Lỗi 1: tên tham số "hợp lý" nhưng sai

```ts
// PR: libs/shared/data-access-api/src/lib/models.ts
export interface TicketSearch {
  status?: TicketStatus | null;
  priority?: TicketPriority | null;
  type?: TicketCategory | null;        // chép kiểu SubscriberSearch.type
```

```java
// Backend: TicketDtos.TicketSearch
public record TicketSearch(TicketStatus status, TicketPriority priority, TicketCategory category, ...)
```

- Spring bỏ qua tham số lạ **không báo lỗi** → 200, không lọc
- Test của PR: `expect(port.calls.at(-1)?.query.type).toBe('BILLING')`: kiểm đúng cái code đã viết, không kiểm hành vi
- Fake không lọc theo loại nên không test unit nào có thể thấy

<div class="good">Nguồn sự thật là hợp đồng API (Swagger), không phải trí nhớ của AI. Test adapter: <code>params.get('category')</code>; E2E với backend thật.</div>

---

## Lỗi chồng lỗi: sửa một cái, lộ cái khác

| Bước | `/tickets?category=abc` |
|---|---|
| PR gốc | Gửi `type=abc` → backend bỏ qua → 200, không lỗi |
| Chỉ sửa tên tham số | Gửi `category=abc` → **400** → "Không tải được danh sách phiếu. Kiểm tra kết nối rồi thử lại." |
| Sửa đúng | Whitelist `oneOf(params.get('category'), CATEGORIES)` → bỏ qua, không gửi |

- Lỗi whitelist **có sẵn** trong PR, chỉ bị lỗi tên tham số che
- Thông báo sai lý do ("kiểm tra kết nối") làm người dùng và support đi sai hướng
- URL là input người dùng sửa tay được (buổi 4): mọi giá trị đọc từ URL qua whitelist

---

## Lint xanh không có nghĩa là đúng phiên bản

```ts
export class CategoryFilter implements OnInit {
  @Input() value: TicketCategory | null = null;
  @Output() valueChange = new EventEmitter<TicketCategory | null>();
  @ViewChild('host', { static: true }) host!: ElementRef<HTMLElement>;
  ngOnInit(): void {
    fromEvent<KeyboardEvent>(document, 'keydown').subscribe((e) => { /* Alt+L */ });
  }
}
```

- Lint của dự án chỉ bắt `*ngFor` (`prefer-control-flow`); PR đổi sang `@for (...; track $index)` là qua
- Không `OnPush`, decorator cũ, listener trên `document` không bao giờ hủy: **2 → 7** sau 5 lần vào/ra
- Đây là chỗ hướng dẫn repository và người review làm được mà công cụ chưa làm

---

## AI review: finding phải được xác minh

| Finding của AI | Xác minh | Kết luận |
|---|---|---|
| "Gửi `type`, API nhận `category`" | Network + Swagger | **Đúng** |
| "Listener keydown không được hủy" | CDP: 2 → 7 | **Đúng** |
| "Nhãn không gắn với select, screen reader không đọc" | `getByLabel('Loại yêu cầu')` → 1 phần tử (`nzId` = `for`) | **Sai** |
| "`rxMethod` trong store rò subscription" | `rxMethod` hủy theo injector | **Sai** |

<div class="bad">Finding sai đưa thẳng vào review tốn thời gian người viết PR và làm mất lòng tin vào review. Mỗi finding: đúng / sai / chưa chắc, kèm cách xác minh.</div>

---

## Test do AI viết: thử phá trước khi tin

| Phá (bản đã sửa) | Unit/integration đỏ | E2E backend thật |
|---|---|---|
| M1 adapter gửi `type` | 1 | Đỏ |
| M2 bỏ whitelist URL | 2 | Đỏ |
| M3 fake không lọc | 2 | Xanh |
| M4 `hasFilters` quên `category` | **0** → viết lại test → 1 | Xanh |
| M5 store quên `category` | 11 | Đỏ |

- M4 lọt vì test gọi thẳng `store.clearFilters()` và URL có sẵn `status=NEW`: kiểm code, không kiểm cái người dùng thấy
- Không tầng nào bắt hết: M1 cần test adapter hoặc E2E; M3, M4 cần unit

---

## Negative test: AI hay quên, phải yêu cầu rõ

```ts
it('category tren URL sai hoac doc hai: khong gui xuong API, select de trong', async () => {
  await harness.navigateByUrl('/tickets?category=abc');
  expect(lastCall()?.query.category).toBeNull();
  expect(store().hasFilters()).toBe(false);
});
```

| Loại | Ví dụ cho bộ lọc |
|---|---|
| Giá trị sai, độc hại | `?category=abc`, `<script>` |
| Rỗng | Không phiếu nào thuộc loại → "Không có phiếu phù hợp với bộ lọc." |
| Lỗi hạ tầng | API 500 → Thử lại giữ đúng loại |
| Quyền | Không áp dụng (đọc danh sách): ghi rõ, đừng bịa test |

---

## Năng suất: tính cả thời gian kiểm tra

| Hoạt động | Ghi gì |
|---|---|
| Viết prompt, AC | phút |
| AI sinh | phút (thường nhỏ nhất) |
| Đọc, review diff | phút |
| **Xác minh**: test, curl, trình duyệt, Swagger | phút |
| Sửa sau review | phút |
| Số dòng AI sinh / giữ lại; finding đúng / sai | số |

<div class="tip">"AI sinh xong trong 2 phút" không phải năng suất. PR của use case sinh nhanh, qua CI, và sai ở chỗ quan trọng nhất. Bấm giờ thật, so với tự làm.</div>

---

## Live demo (30 phút)

1. `git apply pr-ai.patch`, chạy gate: **xanh**. Chọn "Cước phí": Network `type=BILLING`, bảng lẫn mọi loại
2. Mở Swagger `GET /api/tickets`: tham số tên `category`. Đọc test của PR: kiểm `query.type`
3. Đếm listener: Console `getEventListeners(document).keydown.length`, vào/ra trang 5 lần
4. Viết lại prompt theo AC + `AGENTS.md`, cho AI làm lại; review với checklist
5. Đưa diff PR cho AI review; xác minh 2 finding (một đúng, một sai) trước lớp

---

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | `AGENTS.md` + `.github/copilot-instructions.md` từ quy ước thật; Angular MCP nếu có | 20 |
| 2 | Prompt theo AC, AI làm bộ lọc, review theo checklist, sửa, kiểm trên trình duyệt | 40 |
| 3 | Negative test; thử phá M1–M5; E2E với backend thật | 30 |
| 4 | AI review PR có lỗi cài sẵn; xác minh từng finding | 20 |
| 5 | Báo cáo năng suất có thời gian xác minh | 10 |

<p class="small">Bấm giờ từ đầu lab. Chỉ dùng công cụ AI đơn vị cho phép; không có công cụ thì làm theo cặp (một người đóng vai AI).</p>

---

## Chốt buổi

- AI viết theo số đông và theo những gì nó **đoán**: cho nó AC, ràng buộc, nguồn sự thật (Swagger, `AGENTS.md`, MCP đúng phiên bản)
- CI xanh chỉ chứng minh những gì test kiểm; test do AI viết thường chỉ kiểm lại code của chính nó
- Fake phải giống thật; ít nhất một test đi tới backend thật cho hợp đồng API
- Mỗi finding của AI: **xác minh** rồi mới đưa vào review
- Năng suất = từ yêu cầu tới code **đã kiểm chứng**, không phải tới lúc AI sinh xong

<p class="small">Bài tập về nhà: <code>course/bai-tap-ve-nha/buoi-08-ai-va-copilot.html</code> (~30 phút, nộp trước buổi 9)</p>
