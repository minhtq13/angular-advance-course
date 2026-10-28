# Buổi 08 — Ứng dụng AI và Copilot trong phát triển Angular

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Trạng thái tài liệu:** đã có khung theo đề cương; chưa soạn slide, lab chi tiết, đáp án.

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Prompt theo use case và acceptance criteria; hướng dẫn ở repository; sinh component, refactor, code review, phát hiện lỗi và kiểm thử. Kiểm tra API theo version, phạm vi diff và chính sách dữ liệu. |
| Use case và lab | Dùng AI xử lý một thay đổi nhỏ, yêu cầu negative test, tạo lỗi có chủ đích để kiểm chứng test; đối chiếu thời gian viết, review và sửa lỗi. |
| Sản phẩm đầu ra | Prompt, diff đã review, finding đã xác minh và báo cáo năng suất có tính thời gian kiểm tra. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Viết prompt theo use case và acceptance criteria, có ràng buộc (lib nào được sửa, quy ước, không đổi API công khai).
2. Viết hướng dẫn ở repository (`.github/copilot-instructions.md`, `AGENTS.md`/`CLAUDE.md`) từ quy ước thật của dự án: lib, tag, i18n, theme token.
3. Dùng AI để sinh component, refactor, review, tìm lỗi và viết test, rồi kiểm chứng trước khi chấp nhận.
4. Phát hiện API sai phiên bản (cú pháp Angular cũ, NgModule, `*ngIf`, `@Input` khi dự án dùng `input()`), diff vượt phạm vi.
5. Tuân thủ chính sách dữ liệu: không đưa mã nguồn hay dữ liệu sản xuất vào công cụ chưa được phép.

## Use case trên Care Portal

- Thay đổi nhỏ có acceptance criteria rõ, ví dụ: thêm bộ lọc *Loại yêu cầu* (`category`) vào danh sách phiếu, có key i18n
  vi/en, dùng token màu, cập nhật port + fake adapter + test.
- Yêu cầu AI viết **negative test** (giá trị rỗng, không có quyền, API lỗi).
- **Tạo lỗi có chủ đích** (mutation: đảo điều kiện lọc, bỏ `track`, bỏ hủy request) để xem test có bắt được không.
- Ghi thời gian: viết prompt, AI sinh, đọc và review diff, sửa lỗi. So sánh với tự làm.

## Dự kiến lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Viết hướng dẫn repository từ quy ước Care Portal (lib, tag, i18n, theme, test) | 20 |
| 2 | Prompt theo acceptance criteria, sinh thay đổi, review diff theo checklist (phạm vi, API version, quy ước) | 40 |
| 3 | Yêu cầu negative test; tạo 3 lỗi có chủ đích, ghi test nào bắt được | 30 |
| 4 | Dùng AI review một diff có lỗi cài sẵn; xác minh từng finding (đúng / sai / không chắc) | 20 |
| 5 | Báo cáo năng suất có tính thời gian kiểm tra | 10 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Quy ước cần đưa vào hướng dẫn repo | `frontend/eslint.config.mjs`, `docs/adr/`, `libs/shared/util-i18n`, token `--care-*` |
| Port + fake để AI viết test | `libs/portal/domain-tickets` (sau buổi 1) |
| Angular MCP server | `npx ng mcp` (cấu hình cho trợ lý AI đọc tài liệu Angular đúng phiên bản) |

## Cần chuẩn bị trước khi soạn chi tiết

- [ ] Hỏi VNPT chính sách AI: công cụ nào được dùng, có được gửi mã nguồn không. Đề cương yêu cầu đơn vị tổ chức chuẩn bị chính sách AI.
- [ ] Diff có lỗi cài sẵn cho Bài 4 (ít nhất 1 lỗi bảo mật, 1 lỗi hiệu năng, 1 lỗi i18n).
- [ ] Mẫu AI review và báo cáo năng suất: `course/_templates/ai-review.md`.

## Tài liệu

| | |
|---|---|
| Slide | `slides/` (chưa soạn) |
| Lab | `lab/` (chưa soạn) |
| Đáp án | `solution/` (chưa soạn) |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) |
| Bài tập về nhà | `../bai-tap-ve-nha/buoi-08-<chu-de>.html` (chưa soạn) |
