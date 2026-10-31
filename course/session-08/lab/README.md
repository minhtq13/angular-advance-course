# Lab buổi 8 — Ứng dụng AI và Copilot trong phát triển Angular

**Thời gian:** 120 phút · **Điểm xuất phát:** `git checkout session08-start`

**Use case.** Nhân viên CSKH cần lọc danh sách phiếu theo **Loại yêu cầu**. Backend đã có `GET /api/tickets?category=`. Một đồng nghiệp nhờ
AI làm phần frontend, PR qua CI nhưng lọc không chạy. Lab này: viết hướng dẫn để AI làm đúng ngay từ đầu, làm lại tính năng bằng AI theo acceptance
criteria, chứng minh test có giá trị bằng thử phá, review PR cũ với finding đã xác minh, và đo năng suất thật.

**Chính sách dữ liệu:** chỉ dùng công cụ AI đơn vị cho phép. Repo này là dự án mẫu, dữ liệu giả: được dùng trong lớp. **Không** dán mã nguồn hay dữ
liệu khách hàng của dự án thật vào công cụ chưa được phép. Không có công cụ AI: làm theo cặp, một người đóng vai "AI" sinh code theo prompt của người kia.

**Sản phẩm nộp cuối buổi:** `AGENTS.md`, `.github/copilot-instructions.md` · prompt (dán vào báo cáo) · diff bộ lọc đã review · `docs/ai-review-pr-bo-loc-loai-yeu-cau.md`
(theo mẫu `course/_templates/ai-review.md`) · `docs/bao-cao-nang-suat-ai.md`.

Trước khi bắt đầu:
```bash
git checkout session08-start
docker compose -f infra/docker-compose.yml up -d --build api      # backend có tham số category
cd frontend && npm ci && npm start
# Lấy PR mô phỏng từ main (thư mục course/ trên main):
git show origin/main:course/session-08/lab/pr-bo-loc-loai-yeu-cau.patch > ../pr-ai.patch
```

**Bấm giờ từ đầu buổi lab** (Bài 5 cần số thật): mỗi lần đổi hoạt động (viết prompt, đợi AI, đọc diff, chạy test, sửa) ghi giờ:phút.

---

## Bài 1 — Hướng dẫn ở repository (20 phút)

1. Liệt kê quy ước **có thật** của dự án (đọc file, không đoán): phiên bản Angular và cách viết component (`input()`, `@if`, `OnPush`, zoneless),
   luật lib (`frontend/eslint.config.mjs`), `TicketPort` (ADR-0002), i18n vi/en, token `--care-*`, whitelist bộ lọc trên URL (`ticket-url.ts`),
   fake adapter (`@care/portal-domain-tickets/testing`), lệnh gate.
2. Viết `AGENTS.md` ở gốc repo: lệnh, bảng "dùng / không dùng", kiến trúc lib, giao diện, test, phạm vi và dữ liệu. Ngắn, câu mệnh lệnh, có đường dẫn file.
3. Viết `.github/copilot-instructions.md`: 6–8 gạch đầu dòng hay sai nhất, trỏ về `AGENTS.md`.
4. (Nếu công cụ hỗ trợ MCP) cấu hình Angular CLI MCP để AI tra tài liệu Angular **đúng phiên bản** và đọc workspace:
   ```json
   { "mcpServers": { "angular-cli": { "command": "npx", "args": ["-y", "@angular/cli", "mcp", "--read-only"] } } }
   ```
   `--read-only`: chỉ công cụ đọc; `--local-only`: không gọi Internet (khi chính sách không cho).
5. Kiểm tra nhanh: hỏi AI "Thêm một input cho TicketRow" **trước và sau** khi có hướng dẫn. Ghi khác biệt (decorator hay `input()`?).

## Bài 2 — Prompt theo acceptance criteria, sinh và review diff (40 phút)

1. Viết prompt gồm: use case, acceptance criteria **kiểm được**, ràng buộc (file nào được sửa, theo `AGENTS.md`, không thêm tính năng), test bắt buộc.
   AC tối thiểu:
   - Select "Loại yêu cầu" cạnh Trạng thái, Ưu tiên; nhãn và option qua Transloco ở cả `vi.json`, `en.json` (dùng `TICKET_CATEGORY`, `toOptions`).
   - Lọc ở **server**: tham số đúng như Swagger (<http://localhost:8081/swagger-ui.html>, `GET /api/tickets`). Mọi dòng trả về đúng loại.
   - Bộ lọc trên URL `?category=`; F5, link chia sẻ, Back giữ bộ lọc; giá trị lạ trên URL bị bỏ qua.
   - "Xóa bộ lọc" hiện khi chỉ lọc theo loại.
2. Cho AI sinh thay đổi. **Chưa chấp nhận**. Review diff theo checklist, mỗi dòng ghi đạt/không và bằng chứng:

   | Kiểm tra | Cách kiểm |
   |---|---|
   | Tên tham số đúng hợp đồng API | Swagger; Network: request có `category=BILLING` |
   | Fake adapter lọc như backend | Đọc `InMemoryTicketAdapter.search` |
   | URL whitelist | Mở `/tickets?category=abc`: không lỗi, không gửi `category` |
   | Angular đúng phiên bản dự án | Không `@Input`, `EventEmitter`, `*ngFor`, `CommonModule`; có `OnPush` nếu thêm component |
   | i18n, theme | Đổi English; không mã màu cứng |
   | Phạm vi | `git diff --stat`: chỉ file trong ràng buộc; không sửa `eslint.config.mjs` |

3. Sửa (nhờ AI hoặc tự sửa) tới khi đạt hết. Chạy `npx nx run-many -t lint test build`. Kiểm tra trên trình duyệt: chọn "Cước phí", cột Phân loại
   chỉ còn "Cước phí"; F5 vẫn giữ.

## Bài 3 — Negative test và lỗi có chủ đích (30 phút)

1. Yêu cầu AI viết negative test (và đọc kỹ từng assertion):
   - `?category=abc` trên URL → request không có `category`, select để trống.
   - Chỉ lọc theo loại → nút "Xóa bộ lọc" hiện; **bấm nút** → URL sạch, request không có `category`.
   - Không phiếu nào thuộc loại → không có dòng, hiện "Không có phiếu phù hợp với bộ lọc."
   - API lỗi khi đang lọc → Thử lại vẫn gửi đúng loại.
   - Adapter HTTP: `params.get('category') === 'BILLING'`, **không** có `type`; giá trị `null` không lên URL.
2. E2E với backend thật `apps/portal-e2e/src/ticket-filter.spec.ts`: lọc "Cước phí" → request có `category=BILLING`, mọi dòng là "Cước phí", F5 giữ bộ lọc;
   `?category=abc` → không lỗi. Chạy: `npx playwright test -c apps/portal-e2e/playwright.config.mts ticket-filter --project=chromium`.
3. **Thử phá** từng chỗ (sửa, chạy unit + E2E, hoàn lại), ghi bảng:

   | # | Phá | File |
   |---|---|---|
   | M1 | Adapter gửi `type` thay `category` | `http-ticket.adapter.ts` |
   | M2 | Bỏ whitelist: `params.get('category') as TicketCategory \| null` | `ticket-url.ts` |
   | M3 | Fake không lọc theo loại (xóa dòng `query.category`) | `domain-tickets/src/testing.ts` |
   | M4 | `hasFilters` quên `category` | `ticket-list.store.ts` |
   | M5 | Store không truyền `category` xuống query | `ticket-list.store.ts` |

   Chỗ nào không test nào đỏ: viết thêm test cho tới khi đỏ. Tầng nào bắt được chỗ nào?

## Bài 4 — AI review một PR có lỗi cài sẵn (20 phút)

1. Trên một nhánh riêng từ `session08-start`: `git switch -c review-pr && git apply ../pr-ai.patch`. Chạy gate: xanh hết.
2. Đưa diff (`git diff`) cho AI, yêu cầu review theo `AGENTS.md`: liệt kê finding kèm mức độ.
3. **Xác minh từng finding**: đúng / sai / chưa chắc, kèm cách xác minh (lệnh, test, trình duyệt, Swagger, CDP đếm listener). Ghi vào
   `docs/ai-review-pr-bo-loc-loai-yeu-cau.md` theo mẫu `course/_templates/ai-review.md`. Gợi ý đo rò listener (Console DevTools, Chrome):
   `getEventListeners(document).keydown.length` trước và sau 5 lần vào/ra trang Phiếu.
4. Có lỗi nào AI bỏ sót mà bạn tìm được? Có finding nào AI nói sai?
5. Xong thì về nhánh làm việc: `git switch -` (PR không được merge).

## Bài 5 — Báo cáo năng suất (10 phút)

Điền `docs/bao-cao-nang-suat-ai.md`: công cụ, prompt, thời gian từng hoạt động (**số bấm giờ thật**), số dòng AI sinh / giữ lại, số finding đúng/sai,
kết quả thử phá. So với một nhóm tự làm (hoặc ước lượng của nhóm **trước** khi làm, ghi rõ là ước lượng). Kết luận: lần sau đổi gì trong prompt/hướng dẫn.

---

## Kiểm tra cuối lab

```bash
npx nx run-many -t lint test build
npx playwright test -c apps/portal-e2e/playwright.config.mts ticket-filter --project=chromium
git diff --stat session08-start      # chỉ file trong phạm vi
```

## Review chéo (20 phút)

Mỗi nhóm 5 phút: đọc prompt, chỉ một finding AI nói sai và cách bác bỏ, bảng thử phá, tổng thời gian **có** và **không** tính xác minh.
Nhóm khác hỏi: "Nếu chỉ chạy CI, PR của đồng nghiệp có được merge không? Hàng rào nào trong quy trình chặn được nó?"

## Đáp án

Đáp án nằm trong [`../solution/`](../solution/). Chỉ mở sau khi đã tự làm.
