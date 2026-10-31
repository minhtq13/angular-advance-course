# Buổi 08 — Ghi chú giảng viên

## Trước buổi học

**Vài ngày trước:**
- **Hỏi VNPT chính sách AI** (đề cương yêu cầu đơn vị chuẩn bị): công cụ nào được dùng (Copilot, chat nội bộ...), có được gửi mã nguồn
  repo mẫu không, có lưu lịch sử không. Ghi câu trả lời lên slide 10 trước buổi học. Không có công cụ: lab làm theo cặp (một người đóng vai AI).
- Nhắc học viên cài sẵn extension AI được phép và đăng nhập trước (đăng nhập trong lớp mất nhiều thời gian).
- Thu `docs/checklist-sso.md`, `docs/bao-cao-kiem-thu.md` của buổi 7.

**Ngày học:**
- [ ] `git checkout session08-start`
- [ ] `docker compose -f infra/docker-compose.yml up -d --build api` (backend có tham số `category`)
- [ ] `curl -s "localhost:8081/api/tickets?category=BILLING&size=5" -H "Authorization: Bearer $(curl -s -XPOST localhost:8081/api/auth/login -H 'Content-Type: application/json' -d '{"username":"agent1","password":"agent1"}' | jq -r .accessToken)" | jq '[.content[].category]'` → toàn `"BILLING"`
- [ ] `cd frontend && npm ci && npm start`
- [ ] Nhánh demo: `git switch -c demo-pr session08-start && git apply course/session-08/lab/pr-bo-loc-loai-yeu-cau.patch` (từ `main`, hoặc
      `git show main:course/session-08/lab/pr-bo-loc-loai-yeu-cau.patch | git apply`). Chạy gate trước một lần để demo không phải đợi
- [ ] Trình duyệt Chrome: DevTools Network lọc `api/tickets`; tab Swagger <http://localhost:8081/swagger-ui.html> mở sẵn `GET /api/tickets`
- [ ] Công cụ AI của lớp mở sẵn, có `AGENTS.md` mẫu (từ `session08-end`) để dán khi demo bước 4

## Timeline (4 giờ)

| Thời gian | Nội dung | Slide | Ghi chú |
|---|---|---|---|
| 0:00–0:20 | Review buổi 7, use case | 1–5 | Slide 5: cho lớp đoán "CI xanh, vậy lỗi ở đâu?" trước khi demo |
| 0:20–1:00 | Khái niệm | 6–19 | Prompt, AGENTS.md, MCP, dữ liệu (6–10) · checklist review, tham số API, lỗi chồng lỗi, lint (11–15) · xác minh finding, thử phá, negative test, năng suất (16–19) |
| 1:00–1:30 | Live demo | 20 | 5 bước; bước 4–5 dùng công cụ AI thật của lớp, kết quả mỗi lần mỗi khác: cứ để lớp thấy |
| 1:30–1:40 | **Nghỉ** | | |
| 1:40–3:40 | **Lab** 5 bài | 21 | Mốc nhắc: 2:00 sang Bài 2, 2:40 sang Bài 3, 3:10 sang Bài 4, 3:30 sang Bài 5. Nhắc bấm giờ |
| 3:40–4:00 | Review chéo, chốt | 22 | Câu hỏi chốt: "Hàng rào nào trong quy trình chặn được PR của đồng nghiệp?"; giao bài tập về nhà |

## Kịch bản demo

Trên nhánh `demo-pr` (đã áp PR):

1. **CI xanh, tính năng sai (7 phút).** `cd frontend && npx nx run-many -t lint test build` (hoặc chiếu kết quả đã chạy trước): 16 project xanh.
   Trình duyệt: Phiếu yêu cầu → Loại yêu cầu "Cước phí". Network: `GET /api/tickets?type=BILLING&page=0&size=20&sort=id,desc`. Cột Phân loại vẫn lẫn
   Cước phí, Khác, Dịch vụ, Mạng/sóng. Đổi English: nhãn vẫn "Loại yêu cầu".
2. **Nguồn sự thật (5 phút).** Swagger `GET /api/tickets`: tham số `category`. Mở `libs/shared/data-access-api/src/lib/models.ts` trong diff: `type?`.
   Mở test của PR (`ticket-list.page.spec.ts`, "loc theo loai yeu cau"): `expect(port.calls.at(-1)?.query.type).toBe('BILLING')`. Mở
   `domain-tickets/src/testing.ts`: fake không lọc theo loại. Hỏi: "Test này có thể đỏ trong trường hợp nào?"
3. **Rò listener (3 phút).** Console: `getEventListeners(document).keydown.length` (2). Bấm Thuê bao ↔ Phiếu 5 lần, chạy lại (7).
4. **Prompt tốt hơn (8 phút).** `git stash` hoặc chuyển về `session08-start`. Dán `AGENTS.md` mẫu vào repo, gõ prompt có AC (lấy từ
   `docs/ai-review-pr-bo-loc-loai-yeu-cau.md`, mục "Prompt nên dùng"). Cho AI sinh, cùng lớp review theo checklist slide 12. Kết quả AI thay đổi
   mỗi lần: chỉ ra chỗ đúng, chỗ vẫn sai.
5. **AI review (7 phút).** Đưa `git diff session08-start demo-pr` cho AI, yêu cầu review theo `AGENTS.md`. Chọn một finding đúng (tên tham số) và
   một finding nghi sai, xác minh trước lớp (Network; `getByLabel` hoặc thử bằng trình đọc màn hình/DevTools Accessibility).

## Điểm cần nhấn mạnh

- **AI tăng tốc viết; trách nhiệm review vẫn là của người.** Báo cáo năng suất phải tính cả thời gian kiểm tra.
- **Test do AI viết có thể chỉ xác nhận lại code do AI viết** (`query.type`). Tạo lỗi có chủ đích để chứng minh test có giá trị.
- **Fake phải giống thật.** Ít nhất một test đi tới backend thật cho hợp đồng API.
- **Hướng dẫn ở repository** là cách rẻ nhất để AI sinh code đúng quy ước; viết từ file thật, có lệnh và đường dẫn.
- **Mỗi finding của AI phải được xác minh** trước khi đưa vào review: đúng / sai / chưa chắc.
- **Dữ liệu:** chỉ công cụ được phép; không dữ liệu thật trong prompt.

## Câu hỏi học viên hay hỏi

| Câu hỏi | Gợi ý trả lời |
|---|---|
| Sao không để backend báo lỗi khi gặp tham số lạ? | Có thể (validate tham số không biết), nhưng phần lớn framework mặc định bỏ qua; client không nên dựa vào điều đó. Hợp đồng (OpenAPI) + test adapter + một E2E là đủ chắc |
| Dùng OpenAPI generator cho client thì lỗi `type` có xảy ra không? | Không, kiểu `TicketSearch` sinh từ `/v3/api-docs` sẽ không có `type`. Là một lựa chọn tốt; dự án mẫu viết tay để dễ dạy, ghi được vào ADR |
| AGENTS.md hay copilot-instructions? | Nội dung một nguồn (`AGENTS.md`, nhiều công cụ đọc); file riêng của từng công cụ tóm tắt và trỏ về. Tránh hai bản lệch nhau |
| AI viết test có nên tin không? | Tin sau khi thấy test đỏ với lỗi có chủ đích. Đọc assertion: kiểm dữ liệu/hành vi hay chỉ kiểm "được gọi"? |
| Có nên cho AI tự chạy lệnh, sửa file (agent)? | Được, trong repo mẫu và trong phạm vi chính sách. Vẫn review diff như PR của người; giới hạn quyền (MCP `--read-only`) khi chỉ cần tra cứu |
| Tính năng suất thế nào cho công bằng? | So cùng một yêu cầu, cùng mức "đã kiểm chứng" (test, E2E, review). Ghi giờ thật; nếu so với ước lượng thì ghi rõ là ước lượng |
| AI đề xuất sửa `eslint.config.mjs` cho qua lỗi thì sao? | Từ chối: luật lib là quyết định kiến trúc (ADR). `AGENTS.md` ghi rõ điều cấm này |

## Lỗi thường gặp khi làm lab

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| `git show origin/main:course/session-08/...` báo không có | Chưa `git fetch` | `git fetch origin` rồi chạy lại |
| `git apply ../pr-ai.patch` lỗi | Đang ở nhánh đã sửa bộ lọc | Áp trên nhánh mới từ `session08-start` |
| Bộ lọc đúng ở unit test nhưng trình duyệt không lọc | `api` chưa build lại (backend cũ không có `category`) | `docker compose -f infra/docker-compose.yml up -d --build api` |
| Test cũ đỏ hàng loạt sau khi thêm `category` | `toEqual` của query thiếu `category: null` | Thêm vào kỳ vọng; đừng đổi sang `toMatchObject` để "cho qua" |
| `HttpTestingController.match('http://api/api/tickets')` không khớp | So cả query string | Predicate `(r) => r.url === '...'` |
| Bảng rỗng nhưng test đếm được 1 dòng | nz-table render ô "Không có phiếu..." trong `tbody` | Đếm `tbody tr.ant-table-row` |
| Thử phá M4 không test nào đỏ | Test gọi thẳng `clearFilters()` hoặc URL có thêm bộ lọc khác | Chỉ lọc theo loại, kiểm nút "Xóa bộ lọc" hiện và **bấm** nút |
| AI sinh `@Input`, `*ngFor` dù đã có AGENTS.md | Công cụ không đọc file đó, hoặc file quá dài | Kiểm tra công cụ đọc file nào; đưa điểm chính vào `.github/copilot-instructions.md`; nhắc trong prompt |
