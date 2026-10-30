---
name: xuat-slide
description: Xuất slide Marp của một buổi ra PPTX và PDF, render ảnh để soát tràn chữ. Dùng mỗi khi sửa course/session-XX/slides/slides.md.
argument-hint: "<số buổi, vd 06>"
---

# Xuất slide Marp (buổi $ARGUMENTS)

Nguồn là `course/session-$ARGUMENTS/slides/slides.md`. **PPTX chỉ là ảnh**: muốn sửa chữ thì sửa `slides.md` rồi xuất lại cả PPTX và PDF. Tên file: `buoi-$ARGUMENTS-<chu-de>.pptx|pdf`
(giữ tên đã có trong thư mục).

## Trước khi xuất

- PPTX đang mở trong PowerPoint thì **không ghi đè**: kiểm tra `pgrep -l PowerPoint` và `find course/session-$ARGUMENTS/slides -name '~$*'` (lock file Office).
  Không dùng `ls ~$*` trong zsh (báo lỗi khi không có file).
- Dùng Node đúng bản: `source ~/.nvm/nvm.sh && nvm use` (Marp chạy bằng `npx`, tải qua mạng lần đầu).

## Xuất

```bash
cd course/session-XX/slides
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-XX-<chu-de>.pdf
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-XX-<chu-de>.pptx
```

PPTX mất 1–2 phút; đặt `timeout` 600000 hoặc chạy nền, đừng chạy hai bản copy cùng lúc.

## Soát tràn chữ (bắt buộc sau khi sửa nội dung)

```bash
npx @marp-team/marp-cli@4 slides.md --images png --allow-local-files -o <scratchpad>/slidesXX/s.png
```

Mở các ảnh (nhất là slide có bảng, khối code, hoặc nhiều chữ có dấu) và kiểm tra: chữ không bị cắt ở mép dưới, số trang không đè nội dung, không còn dòng bị ngắt giữa câu.

Bẫy đã gặp:
- Marp xuống dòng ở **mỗi dấu xuống dòng đơn** trong đoạn văn: viết một đoạn trên một dòng, không bẻ dòng giữa câu.
- Khối code: giữ dòng ≤ ~95 ký tự và ≤ ~16 dòng/slide; comment cuối dòng dễ bị cắt.
- Slide nhiều bảng: giảm chữ thay vì giảm cỡ font.

## Sau khi xuất

- `timeline` trong `instructor-notes.md` ghi theo **số slide**: thêm/bớt slide thì cập nhật lại.
- Báo người dùng số slide và những slide đã soát.
