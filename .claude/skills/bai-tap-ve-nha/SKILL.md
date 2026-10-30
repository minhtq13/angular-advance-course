---
name: bai-tap-ve-nha
description: Viết bài tập về nhà HTML tự chấm cho một buổi (khoảng 30 phút, nộp trước buổi sau). Dùng khi soạn xong buổi hoặc khi được yêu cầu bài tập về nhà.
argument-hint: "<số buổi, vd 07>"
---

# Bài tập về nhà buổi $ARGUMENTS

File: `course/bai-tap-ve-nha/buoi-$ARGUMENTS-<chu-de>.html`. Dùng lại style và script trong `course/bai-tap-ve-nha/assets/` (`lesson.css`, `quiz.js`, `boundary-checker.js`).
**Bắt đầu bằng cách sao một bài gần nhất** (vd `buoi-06-xac-thuc-va-bao-mat-api.html`) làm khung, không viết từ đầu.

## Nguyên tắc

- Học viên đã học buổi này trên lớp: **không lặp lại bài lab**. Phần vận dụng là nghiệp vụ mới trong Care Portal (vd tải hóa đơn PDF, lịch sử cước).
- Làm trong khoảng 30 phút, nộp trước buổi sau. Dựa trên `course/session-$ARGUMENTS/`; ví dụ và số liệu lấy từ repo/lần chạy thật.
- Tiếng Việt có dấu; mã, tên lib, lệnh để nguyên; thuật ngữ kỹ thuật giữ tiếng Anh (rule `ngon-ngu-va-thuat-ngu`).
- Không ghi `learning-records/` khi chưa có phản hồi thật từ lớp. `GLOSSARY.md` là từ vựng chuẩn của khóa.

## Cấu trúc (theo đúng thứ tự)

1. `<p class="kicker">`, `<h1>`, `<dl class="homework-meta">` (Làm sau / Hạn nộp / Thời gian / Cần), `<div class="goal">`.
2. **Phần 0 · Khởi động (viết ra giấy, ~4 phút):** 4 câu nhớ lại, kèm `<details><summary>Ôn lại sau khi đã viết xong</summary>` có bảng ý chính.
3. **Phần 1 và 2:** mỗi phần một quiz 5 câu, tự chấm ngay (phần 1 đọc số liệu/phản ứng đúng; phần 2 soi code có vấn đề gì).
4. **Phần 3 · Vận dụng (~10 phút):** tình huống mới, 3 yêu cầu có đánh số (`<ol class="steps">`), đáp án trong `<details>` "chỉ mở sau khi đã viết".
5. **Phần tùy chọn** (đo/soi trên dự án của học viên, không gửi code doanh nghiệp), **Nộp bài** (hạn: trước buổi kế tiếp; nhắc làm lại phần 2 một ngày trước), **Đọc thêm** (nguồn chính + vài nguồn phụ, liên kết thật), `<div class="callout">`, `<footer>`.

## Quiz

```html
<div class="quiz" id="quiz-<ten>" data-quiz>
  <script type="application/json">
    { "questions": [ { "prompt": "...", "options": ["a", "b", "c", "d"], "answer": 1, "explain": "..." } ] }
  </script>
</div>
```

`answer` là chỉ số từ 0. Mỗi câu chỉ chọn một lần. Đáp án sai phải "hợp lý" (lỗi học viên thật hay mắc), `explain` nói vì sao, không chỉ nói đúng/sai.
Chèn JSON bằng tay dễ sai dấu: kiểm tra phân tích được.

## Kiểm tra trước khi giao

```bash
python3 -I - <<'PY'
import re,json,sys
s=open(sys.argv[1],encoding='utf-8').read() if len(sys.argv)>1 else open('course/bai-tap-ve-nha/buoi-XX-....html',encoding='utf-8').read()
[json.loads(b) for b in re.findall(r'<script type="application/json">(.*?)</script>',s,re.S)]
print('json ok')
PY
```

Rồi mở bằng Playwright (`file://...`): **không có lỗi console**, quiz hiện đủ câu, đúng ở cả theme sáng và tối (`page.emulateMedia({ colorScheme: 'dark' })`), chụp ảnh xem.
Cập nhật bảng trong `course/bai-tap-ve-nha/README.md` và liên kết ở `course/session-$ARGUMENTS/README.md`, `note-cho-giang-vien.md`.
