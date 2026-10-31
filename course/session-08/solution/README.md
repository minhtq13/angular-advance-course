# Đáp án lab buổi 8

## Áp đáp án vào code

Trong thư mục gốc repo, từ `session08-start`:

```bash
git apply course/session-08/solution/bai1-huong-dan-repository.patch
git apply course/session-08/solution/bai2-bo-loc-loai-yeu-cau.patch
git apply course/session-08/solution/bai3-negative-test-va-thu-pha.patch
git apply course/session-08/solution/bai4-5-review-va-bao-cao.patch
```

Gỡ theo thứ tự ngược lại. Bản đã áp đủ là nhánh `session08-end`. PR mô phỏng AI (`../lab/pr-bo-loc-loai-yeu-cau.patch`) **không** nằm
trong chuỗi đáp án: nó áp lên `session08-start` để review, không merge.

Đã kiểm tra: sau **từng** patch, `nx run-many -t lint test build` pass (16 project); áp đủ ra đúng `session08-end`, gỡ ra về đúng
`session08-start`. PR mô phỏng cũng pass trọn gate (đó là điểm của use case). Test Bài 2 viết trước và đỏ trên điểm bắt đầu; Bài 3 đo bằng thử phá.
E2E chạy với backend riêng (seed 500 phiếu, cổng 8091) và Chromium.

Đáp án không có "thời gian thật" của người: thời gian là số đo của từng nhóm (Bài 5). Đáp án chỉ ghi số đo bằng máy.

---

## Bài 1 — Hướng dẫn ở repository

Bản mẫu: `AGENTS.md` (gốc repo) và `.github/copilot-instructions.md` (trong patch). Điểm chấm:
- Lấy từ file thật: lệnh gate, Swagger để tra tên tham số, bảng "dùng / không dùng" của Angular 22, luật lib + `TicketPort`, đường đi khi thêm trường
  (domain → `TicketSearch` → adapter → **fake**), whitelist URL, i18n vi/en + `TICKET_CATEGORY`, token `--care-*`, negative test, phạm vi, dữ liệu.
- Có **lệnh** và **đường dẫn**, không chỉ lời khuyên chung ("viết code sạch").
- Có điều cấm cụ thể đúng với lỗi của PR: không đoán tên tham số, không sửa `eslint.config.mjs` để qua lint, fake phải lọc như backend.

Angular CLI 22.2.4 có `ng mcp` (đã chạy `npx ng mcp --help`: tùy chọn `--root`, `--read-only`, `--local-only`).

## Bài 2 — Bộ lọc đúng

| File | Thay đổi |
|---|---|
| `domain-tickets/src/lib/ticket.ts` | `TicketQuery.category` |
| `domain-tickets/src/testing.ts` | Fake lọc `query.category` như backend |
| `data-access-api/src/lib/models.ts` | `TicketSearch.category` (đúng tên tham số backend) |
| `feature-tickets/.../ticket-url.ts` | `category` trong `TicketFilters`, whitelist `CATEGORIES`, ghi lên URL |
| `ticket-list.store.ts` | Truyền `category` xuống query; `hasFilters` tính cả `category` |
| `ticket-list.page.{ts,html}` | Select `tk-category`, `toOptions(TICKET_CATEGORY)`, nhãn `ticket.category` |
| `vi.json`, `en.json` | `ticket.category`: "Loại yêu cầu" / "Request type" |

Test viết trước, đỏ trên điểm bắt đầu: adapter gửi `category` (không `type`, không gửi `null`); URL khứ hồi có `category`, `category=<script>` bị bỏ;
màn hình chọn "Loại yêu cầu" → chỉ còn phiếu đúng loại, nhãn có bản dịch. Các test cũ thêm `category: null` vào kỳ vọng query.

Bẫy khi viết test: `HttpTestingController.match('http://api/api/tickets')` so cả query string → không khớp; dùng predicate `(r) => r.url === ...`.

## Bài 3 — Negative test và thử phá

Negative test (patch): `category=abc` trên URL; chỉ lọc theo loại thì nút "Xóa bộ lọc" hiện và **bấm** được; loại không có phiếu → không dòng nào;
API lỗi → Thử lại giữ loại. E2E `ticket-filter.spec.ts` (2 test, 2,1 giây): request có `category=BILLING`, mọi dòng "Cước phí", F5 giữ; `category=abc` không lỗi.

**Thử phá, đã chạy thật** (unit: `portal-data-access-tickets`, `portal-feature-tickets`, `portal-domain-tickets`, `portal`; E2E: `ticket-filter.spec.ts`):

| Phá | Unit/integration đỏ | E2E |
|---|---|---|
| M1 adapter gửi `type` | 1: adapter "gửi đúng tên tham số" | Đỏ: lọc "Cước phí" |
| M2 bỏ whitelist | 2: `ticket-url` "URL sửa tay sai", `ticket-list.url` "category trên URL sai" | Đỏ: `category=abc` |
| M3 fake không lọc | 2: màn hình "chọn Loại yêu cầu", "không có phiếu nào thuộc loại" | Xanh |
| M4 `hasFilters` quên `category` | Bản đầu: **0**. Viết lại test (bấm nút, chỉ lọc theo loại): 1 | Xanh |
| M5 store quên `category` | 11 | Đỏ: lọc "Cước phí" |

Bài học từ M4: test đầu tiên mở `?category=BILLING&status=NEW` (status đã làm `hasFilters` đúng) và gọi thẳng `store.clearFilters()` thay vì bấm nút.
Test đó kiểm code, không kiểm hành vi người dùng thấy. M1 chỉ test adapter và E2E bắt; M3 chỉ unit bắt: cần cả hai tầng.

## Bài 4 — Review PR

Bản mẫu: `docs/ai-review-pr-bo-loc-loai-yeu-cau.md`. 8 finding đúng, 2 finding sai điển hình. Số đo thật (PR áp lên `session08-start`, backend thật):

| # | Finding | Bằng chứng |
|---|---|---|
| 1 | `type` thay `category` → không lọc | `GET /api/tickets?type=BILLING...`; 20 dòng: Cước phí 5, Khác 5, Dịch vụ 5, Mạng/sóng 5 |
| 2 | Fake không lọc, test kiểm `query.type` | Gate xanh 16 project với PR |
| 3 | Không whitelist URL (bị #1 che) | Chỉ sửa tên tham số: `?category=abc` → 400 → "Không tải được danh sách phiếu. Kiểm tra kết nối rồi thử lại." |
| 4 | Chữ cứng | English: nhãn vẫn "Loại yêu cầu"; "Mạng" ≠ "Mạng/sóng" |
| 5 | `#1677ff` | 4,10:1 (trắng), 4,49:1 (`#141414`) |
| 6 | `fromEvent(document,'keydown')` không hủy | CDP: keydown 2 → 7 sau 5 lần vào/ra |
| 7 | `@Input`/`@Output`/`@ViewChild`/`CommonModule`, thiếu `OnPush` | Lint chỉ bắt `*ngFor` (`prefer-control-flow`) |
| 8 | Alt+L ngoài phạm vi | Đối chiếu AC |
| 9 (sai) | "Nhãn không gắn với select" | `getByLabel('Loại yêu cầu')` → 1 phần tử |
| 10 (sai) | "`rxMethod` rò subscription" | `rxMethod` hủy theo injector |

Điểm chấm: mỗi finding có **cách xác minh** chạy lại được; tách rõ đúng/sai/chưa chắc; tìm được #1 (quan trọng nhất) và chỉ ra vì sao CI không bắt.

## Bài 5 — Báo cáo năng suất

Mẫu: `docs/bao-cao-nang-suat-ai.md`. Điểm chấm: thời gian là số bấm giờ của nhóm, **có dòng xác minh** riêng; có số finding đúng/sai; kết luận nói
được phần nào nên giao AI, phần nào phải tự kiểm; đề xuất sửa prompt/`AGENTS.md`. Báo cáo chỉ có "AI sinh mất 2 phút" là chưa đạt.

---

## Phần chuẩn bị ở `session08-start` (để giảng viên biết)

| Phần | Thay đổi |
|---|---|
| Backend | `TicketDtos.TicketSearch` thêm `category`; `TicketService.search` lọc theo `category`; `TicketApiTests.filtersByCategory` (lọc đúng; `type=BILLING` bị bỏ qua; `category=abc` → 400) |
| Frontend | Không đổi (bộ lọc là bài của học viên) |
| PR mô phỏng | `course/session-08/lab/pr-bo-loc-loai-yeu-cau.patch` (11 file, trên `main`): `type` thay `category`, fake không lọc, URL không whitelist, chữ cứng, màu cứng, `@Input`/`EventEmitter`, listener không hủy, phím tắt ngoài phạm vi; test cũ sửa cho xanh, thêm 1 test kiểm `query.type` |
