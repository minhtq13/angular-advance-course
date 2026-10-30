---
paths:
  - "course/**"
  - "docs/**"
---
# Tài liệu khóa học

## Chuẩn và đối tượng

- Đề cương PDF 40 giờ là chuẩn cho thứ tự, nội dung, use case/lab và sản phẩm đầu ra của từng buổi (đã chép vào `course/session-XX/README.md`, mục "Theo đề cương").
- Lịch mỗi buổi 4 giờ: 20' review + use case, 40' khái niệm, 30' live demo, 10' nghỉ, **120' lab**, 20' review chéo.
- Người đọc là học viên VNPT (dev Angular). Mỗi buổi dùng **một lỗi thật, tái hiện được** trên Care Portal làm use case, không dùng ví dụ bịa.
- Ví dụ lấy từ repo; số đo và output lỗi trích từ lần chạy thật, không viết từ trí nhớ.

## Một buổi gồm

| File | Nội dung |
|---|---|
| `README.md` | Theo đề cương, mục tiêu, use case, bảng lab, liên kết code, những gì đã chuẩn bị ở `-start` |
| `slides/slides.md` + `.pptx` + `.pdf` | Marp. Sửa `slides.md` rồi xuất lại cả hai (PPTX là ảnh). Skill `xuat-slide` |
| `lab/README.md` | 5 bài, tổng 120 phút, lệnh chuẩn bị, sản phẩm nộp |
| `solution/README.md` + `*.patch` | Đáp án, kết quả đo thật, bảng "thử phá", điểm chấm; patch theo thứ tự áp |
| `instructor-notes.md` | Chuẩn bị, timeline khớp số slide, kịch bản demo, câu hỏi hay gặp, lỗi thường gặp |
| `note-cho-giang-vien.md` | Thứ tự đọc tài liệu, cách chạy, lưu ý |
| `../bai-tap-ve-nha/buoi-XX-<chu-de>.html` | Bài tập về nhà (skill `bai-tap-ve-nha`) |

Cập nhật bảng buổi trong `course/README.md` và `handoff.md` khi soạn xong.

## Đáp án và patch

- Mỗi bài: **viết test đỏ trước** trên code chưa sửa, rồi sửa cho xanh. Một patch cho mỗi bài; ghi vào `solution/README.md` thứ tự áp và gỡ.
- Sau **từng** patch: lint + test + build pass; áp và gỡ khớp hoàn toàn với `sessionXX-start` / `sessionXX-end`.
- Dòng sửa nằm trong context của patch thì phải sửa cả dòng đó trong file patch. Luôn thử `git apply` rồi `git apply -R`.
- Comment trong patch phải khớp với comment trong code (cùng quy ước ngôn ngữ và thuật ngữ).

## ADR và mẫu

- ADR (`docs/adr/NNNN-*.md`) theo `course/_templates/adr.md`; **không sửa ADR đã chấp nhận**, muốn đổi thì viết ADR mới và ghi "Thay thế bởi" vào ADR cũ.
- Dùng mẫu trong `course/_templates/` (adr, benchmark, test-matrix, ai-review, release-checklist, instructor-notes).

## Chỉ sửa file của mình

Trước khi sửa file trong `course/`, chạy `git status`: file người dùng đang sửa dở (vd slide buổi 1, `course/react-to-angular/`) thì không đụng, không commit.
