# Buổi 10 — Nâng cấp hiện đại hóa và bảo vệ dự án cuối khóa

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Trạng thái tài liệu:** đã có khung theo đề cương; chưa soạn slide, lab chi tiết, đáp án.

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Inventory dependency và compatibility; nâng từng major, CLI migration, standalone và control flow; đánh giá zoneless, regression và chiến lược thay thế dần dự án cũ. |
| Use case và lab | Nâng fixture Angular 21 lên 22 theo checkpoint; hoàn thiện dự án tích lũy, demo các ca thành công và thất bại, review chéo theo rubric. |
| Sản phẩm đầu ra | Migration plan có rollback, capstone có evidence và kế hoạch áp dụng vào một feature thực tế. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Lập inventory dependency: phiên bản, mức tương thích với Angular/Node/TypeScript, thư viện bị bỏ rơi, license.
2. Nâng từng major với `ng update`, đọc và chạy CLI migration; chuyển NgModule → standalone, `*ngIf/*ngFor` → control flow, `@Input` → `input()`.
3. Đánh giá zoneless: điều kiện, rủi ro, cách đo; quyết định bằng ADR.
4. Thiết kế checkpoint và rollback cho mỗi bước nâng cấp; chống regression bằng bộ test đã xây.
5. Chiến lược thay thế dần dự án cũ (strangler): route mới bằng code mới, route cũ giữ nguyên.

## Use case trên Care Portal

- Fixture `fixtures/legacy-a21/`: app Angular 21 nhỏ dùng NgModule, `*ngIf`, `BehaviorSubject`, zone.js, có test.
  Nâng lên 22 theo checkpoint: mỗi checkpoint build + test xanh, một commit, có lệnh rollback.
- **Capstone**: mỗi nhóm hoàn thiện Care Portal tích lũy qua 9 buổi, demo cả ca thành công và ca thất bại
  (401/403/409, mạng chậm, triển khai lỗi rồi rollback). Tính năng mới ở mức đề xuất phải tách khỏi phần đã triển khai.

## Dự kiến lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Inventory dependency của fixture, migration plan có checkpoint và rollback | 20 |
| 2 | Nâng fixture 21 → 22, chạy migration standalone, control flow; test sau mỗi checkpoint | 40 |
| 3 | Hoàn thiện capstone: kiểm tra điều kiện bắt buộc (build, API từ chối sai quyền, không có bí mật trong client) | 30 |
| 4 | Demo theo nhóm và review chéo theo rubric | 30 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Toàn bộ dự án tích lũy | `frontend/`, `backend/`, `docs/adr/` |
| Rubric chấm | `course/README.md` mục Đánh giá |

## Cần chuẩn bị trước khi soạn chi tiết

- [ ] Tạo fixture Angular 21 (`fixtures/legacy-a21/`), khóa lockfile, có test; kiểm tra `ng update` chạy được khi mạng có proxy hoặc Nexus.
- [ ] Hỏi VNPT phiên bản Angular họ đang dùng để chọn ví dụ thay thế dần phù hợp.
- [ ] Phiếu chấm theo rubric, mẫu kế hoạch áp dụng vào feature thực tế.

## Tài liệu

| | |
|---|---|
| Slide | `slides/` (chưa soạn) |
| Lab | `lab/` (chưa soạn) |
| Đáp án | `solution/` (chưa soạn) |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) |
| Bài tập về nhà | `../bai-tap-ve-nha/buoi-10-<chu-de>.html` (chưa soạn) |
