# Buổi 10 — Ghi chú đọc tài liệu (dành cho giảng viên)

**Buổi 10:** Nâng cấp, hiện đại hóa và bảo vệ dự án cuối khóa · 4 giờ

Toàn bộ tài liệu nằm trong `course/session-10/`; fixture ở `fixtures/legacy-a21/` (gốc repo).

## 1. Thứ tự nên đọc

| # | File | Nội dung | Thời gian |
|---|---|---|---|
| 1 | `README.md` | Nội dung theo đề cương, use case "nâng lên 22 cho kịp", số đo nâng thẳng, phần đã chuẩn bị | 3 phút |
| 2 | `slides/buoi-10-nang-cap-va-capstone.pdf` (hoặc `.pptx`) | 22 slide: inventory, `--force`, checkpoint, migration và phần bỏ sót, Angular 22 (`OnPush` mặc định, `FetchBackend`), zoneless, strangler, capstone | 20 phút |
| 3 | `lab/README.md` + `lab/phieu-cham.md` | Đề lab 5 bài, 120 phút; phiếu chấm chéo theo rubric | 120 phút |
| 4 | `solution/README.md` | Đáp án theo từng lệnh migration, bảng thử phá M1–M6, số đo capstone, điểm chấm | 15 phút |
| 5 | `instructor-notes.md` | Chuẩn bị bản sao demo, timeline, kịch bản demo 5 bước, câu hỏi hay gặp, lỗi thường gặp | 15 phút |
| 6 | `docs/nang-cap-angular-22.md`, `docs/adr/0004-...md`, `docs/capstone-bang-chung.md`, fixture đã nâng (nhánh `session10-end`) | Bản mẫu sản phẩm đầu ra | 15 phút |

**Bài tập sau khóa:** `course/bai-tap-ve-nha/buoi-10-nang-cap-va-capstone.html` (khoảng 30 phút, trong 1 tuần).

## 2. Cách chạy

```bash
git checkout session10-start
cd fixtures/legacy-a21 && nvm use && npm ci
npx ng test --watch=false && npx ng build && npx ng serve --port 4400
```

Bản đã nâng: `git checkout session10-end`, rồi `npm ci` lại trong `fixtures/legacy-a21` (lockfile Angular 22).

## 3. Cần lưu ý

- Fixture là **dự án npm riêng** (không thuộc Nx workspace `frontend/`): mọi lệnh `ng` chạy trong `fixtures/legacy-a21/`.
- Cần mạng ra npm registry (hoặc mirror nội bộ) cho cả Angular 21 và 22. Hỏi VNPT trước.
- `ngx-toastr` 20.0.5 chỉ nhận Angular `^21.0.0` tại thời điểm soạn (2026-10-31). Nếu thư viện đã ra bản hỗ trợ 22 vào ngày dạy, cố định `20.0.5`
  (lockfile đã khóa) và nói rõ với lớp: bài học là cách xử lý thư viện chặn, không phải riêng thư viện này.
- Số đo (thời gian `ng update`, kích thước bundle) từ máy Apple Silicon; máy học viên sẽ khác.
- Buổi 10 không đổi `frontend/`, `backend/`. Capstone dùng Care Portal tích lũy tới buổi 9.
