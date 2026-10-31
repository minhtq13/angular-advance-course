# Buổi 08 — Ứng dụng AI và Copilot trong phát triển Angular

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Điểm bắt đầu:** `git checkout session08-start` · **Đáp án:** 4 patch trong `solution/`, bản đầy đủ ở nhánh `session08-end`

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Prompt theo use case và acceptance criteria; hướng dẫn ở repository; sinh component, refactor, code review, phát hiện lỗi và kiểm thử. Kiểm tra API theo version, phạm vi diff và chính sách dữ liệu. |
| Use case và lab | Dùng AI xử lý một thay đổi nhỏ, yêu cầu negative test, tạo lỗi có chủ đích để kiểm chứng test; đối chiếu thời gian viết, review và sửa lỗi. |
| Sản phẩm đầu ra | Prompt, diff đã review, finding đã xác minh và báo cáo năng suất có tính thời gian kiểm tra. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Viết prompt theo use case và acceptance criteria, có ràng buộc (lib nào được sửa, quy ước, không đổi API công khai, không ngoài phạm vi).
2. Viết hướng dẫn ở repository (`AGENTS.md`, `.github/copilot-instructions.md`) từ quy ước thật của dự án.
3. Dùng AI để sinh code, refactor, review, viết test, rồi **kiểm chứng** trước khi chấp nhận: hợp đồng API, fake adapter, i18n, theme, phạm vi.
4. Nhận ra API sai phiên bản (`@Input`, `EventEmitter`, `*ngFor`, `NgModule`) mà lint không bắt hết.
5. Đo năng suất có tính thời gian review và xác minh; tuân thủ chính sách dữ liệu (không đưa mã nguồn, dữ liệu thật vào công cụ chưa được phép).

## Use case trên Care Portal

Yêu cầu nhỏ: **lọc danh sách phiếu theo Loại yêu cầu** (Cước phí, Mạng/sóng, Dịch vụ, Khác). Đội backend đã thêm tham số `category` cho
`GET /api/tickets` (có trên Swagger). Một đồng nghiệp nhờ AI làm phần frontend với prompt một dòng; PR
([lab/pr-bo-loc-loai-yeu-cau.patch](lab/pr-bo-loc-loai-yeu-cau.patch)) **qua CI: lint, test, build xanh cả 16 project**. Tester báo lọc không chạy.

PR là bản **mô phỏng** một thay đổi do AI sinh, lỗi được cài có chủ đích. Kết quả đo khi áp PR, backend thật:

| Hiện tượng | Đo được |
|---|---|
| Chọn "Cước phí" | Request `GET /api/tickets?type=BILLING&...`; 20 dòng gồm Cước phí 5, Khác 5, Dịch vụ 5, Mạng/sóng 5. Backend nhận `category`, bỏ qua `type` im lặng |
| Vì sao test xanh | Fake adapter không lọc theo loại; test của PR chỉ kiểm `query.type === 'BILLING'` |
| `?category=abc` | Không lỗi (bị lỗi trên che). Sửa riêng tên tham số → API 400 → "Không tải được danh sách phiếu. Kiểm tra kết nối rồi thử lại." |
| Đổi sang English | Nhãn vẫn "Loại yêu cầu" (chữ cứng) |
| Màu nhãn `#1677ff` | 4,10:1 trên nền trắng, 4,49:1 trên nền tối: dưới 4.5:1 |
| Phím tắt Alt+L (ngoài yêu cầu) | Listener `keydown` trên `document`: 2 → 7 sau 5 lần vào/ra trang phiếu |

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Viết `AGENTS.md` + `.github/copilot-instructions.md` từ quy ước Care Portal; cấu hình Angular MCP (`ng mcp`) nếu công cụ hỗ trợ | 20 |
| 2 | Prompt theo acceptance criteria, để AI làm bộ lọc, review diff theo checklist, sửa cho đúng; kiểm tra trên trình duyệt | 40 |
| 3 | Yêu cầu negative test; thử phá 5 chỗ (M1–M5), ghi test nào bắt; E2E với backend thật | 30 |
| 4 | Dùng AI review PR có lỗi cài sẵn; xác minh từng finding (đúng / sai / chưa chắc) | 20 |
| 5 | Báo cáo năng suất có tính thời gian kiểm tra | 10 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Quy ước cần đưa vào hướng dẫn repo | `frontend/eslint.config.mjs`, `docs/adr/`, `libs/shared/util-i18n`, token `--care-*` (`libs/shared/ui-layout/src/styles/_base.scss`) |
| Bộ lọc trên URL, whitelist | `frontend/libs/portal/feature-tickets/src/lib/ticket-list/ticket-url.ts` |
| Port, fake adapter phải mô phỏng backend | `libs/portal/domain-tickets` (`ticket.ts`, `testing.ts`) |
| Tên tham số API | `libs/shared/data-access-api/src/lib/models.ts` (`TicketSearch`), backend `TicketDtos.TicketSearch`, Swagger `/swagger-ui.html` |
| Nhãn enum có sẵn | `TICKET_CATEGORY`, `toOptions()` trong `libs/shared/data-access-api/src/lib/labels.ts` |
| Angular MCP server | `npx ng mcp` (`--read-only`, `--local-only`) |
| Đáp án | `AGENTS.md`, `.github/copilot-instructions.md`, `apps/portal-e2e/src/ticket-filter.spec.ts`, `docs/ai-review-pr-bo-loc-loai-yeu-cau.md`, `docs/bao-cao-nang-suat-ai.md` |

## Đã chuẩn bị ở `session08-start`

- Đáp án buổi 7 đã áp (`session07-end`).
- Backend: `GET /api/tickets?category=` (`TicketDtos.TicketSearch`, `TicketService.search`); `TicketApiTests.filtersByCategory`: lọc đúng,
  tham số `type` bị bỏ qua, `category=abc` → 400. Không có migration mới.
- Frontend: **chưa** có bộ lọc theo loại (học viên làm ở Bài 2).
- PR mô phỏng AI: `course/session-08/lab/pr-bo-loc-loai-yeu-cau.patch` (nằm trên `main`, áp được lên `session08-start`).

## Tài liệu

| | |
|---|---|
| Slide | [slides/slides.md](slides/slides.md) (nguồn Marp) · `buoi-08-ai-va-copilot.pptx` · `buoi-08-ai-va-copilot.pdf` |
| Lab | [lab/README.md](lab/README.md) · PR để review: [lab/pr-bo-loc-loai-yeu-cau.patch](lab/pr-bo-loc-loai-yeu-cau.patch) |
| Đáp án | [solution/README.md](solution/README.md) + 4 file `.patch` |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) · [note-cho-giang-vien.md](note-cho-giang-vien.md) |
| Bài tập về nhà | [../bai-tap-ve-nha/buoi-08-ai-va-copilot.html](../bai-tap-ve-nha/buoi-08-ai-va-copilot.html) |

## Sửa slide

```bash
cd course/session-08/slides
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-08-ai-va-copilot.pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-08-ai-va-copilot.pdf
```
