---
name: soat-ngon-ngu
description: Quét repo tìm comment tiếng Việt không dấu và thuật ngữ kỹ thuật bị dịch sang tiếng Việt (bí mật, thu hồi, xoay vòng...). Dùng sau khi soạn code/tài liệu mới, trước khi báo xong.
---

# Soát ngôn ngữ và thuật ngữ

Quy ước nằm ở `.claude/rules/ngon-ngu-va-thuat-ngu.md`. Skill này kiểm tra tự động, **chỉ báo cáo, không sửa file**.

## Chạy

```bash
python3 -I .claude/skills/soat-ngon-ngu/scan.py                 # toàn repo
python3 -I .claude/skills/soat-ngon-ngu/scan.py course/session-07 frontend/libs   # chỉ vài đường dẫn
```

Thoát mã 0 nếu sạch, 1 nếu có vấn đề. Mỗi dòng báo dạng `đường/dẫn:số dòng: [loại] nội dung`.

| Loại | Nghĩa | Cách sửa |
|---|---|---|
| `comment không dấu` | Comment tiếng Việt viết không dấu | Viết lại có dấu, giữ thuật ngữ tiếng Anh |
| `thuật ngữ -> X` | Dùng từ tiếng Việt đã chốt đổi sang `X` | Thay bằng `X` (xem bảng trong rule) |

## Khi sửa

1. **Chỉ sửa phần comment/prose.** Không đổi chuỗi trong code, tên test, key i18n, chữ UI.
2. Sửa comment trong code thì sửa **cùng nội dung** trong mọi `*.patch` của buổi đó (cả dòng context, `+`, `-`), không thì `git apply` hỏng.
   Sau đó chạy lại chuỗi patch (skill `kiem-tra-gate`).
3. Sửa `slides.md` thì xuất lại PPTX và PDF (skill `xuat-slide`).
4. Không sửa migration Flyway đã áp (V1–V4 và file đã commit): script đã bỏ qua chúng.

## Giới hạn

- Heuristic theo danh sách từ: comment rất ngắn hoặc chỉ có từ lạ có thể lọt. Đọc lướt thêm các file mới.
- Không báo "phiên", "vai trò", "luồng" (chưa quyết có đổi sang session/role/stream hay không).
- Bỏ qua: UI string (`vi.json`, `messages*.properties`), patch và nhánh buổi 1–5 đã push, file người dùng đang sửa dở (`course/react-to-angular*`).
- Báo nhầm thì sửa danh sách `SKIP_*`, `VI_WORDS`, `TERMS` trong `scan.py` (đừng tắt cả rule).
