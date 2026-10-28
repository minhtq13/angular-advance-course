# Notes

- Người học là **học viên VNPT**, không phải người soạn (người soạn là trợ giảng của khóa). Workspace này dùng skill `teach` để soạn **bài tập về nhà sau mỗi buổi học** (yêu cầu của người soạn ngày 2026-10-28), bổ sung cho slide/lab trong `course/session-XX/`.
- Bài đặt tên `buoi-XX-<chu-de>.html` ở thư mục gốc workspace (`course/bai-tap-ve-nha/`), không dùng thư mục `lessons/` và cách đánh số `0001-` mặc định của skill.
- Học viên đã học buổi tương ứng trên lớp, nên bài bắt đầu bằng phần nhớ lại (không xem tài liệu), phần ôn kiến thức để thu gọn sau đó. Không lặp lại bài lab trên lớp; thay bằng bài vận dụng vào nghiệp vụ mới. Mỗi bài có mục Nộp bài (hạn: trước buổi kế tiếp).
- Vì người học không trò chuyện trực tiếp với agent, chưa có bằng chứng học tập để ghi `learning-records/`. Chỉ tạo learning record khi có phản hồi thật từ lớp (kết quả quiz, câu hỏi học viên hay hỏi).
- `GLOSSARY.md` ở đây là từ vựng chuẩn của khóa (do người soạn chốt), không phải bản ghi "học viên đã hiểu".
- Viết tiếng Việt có dấu. Mã, tên lib, lệnh để nguyên tiếng Anh.
- Mọi ví dụ lấy từ dự án Care Portal trong repo; trích lỗi lint/thông báo bằng output chạy thật.
- Các trang Nx mâu thuẫn nhau về ma trận phụ thuộc. Bài học dạy luật của repo (chặt hơn) và nói rõ đó là lựa chọn của team, kèm trích dẫn cả hai phía.
- Quan sát cần cân nhắc khi soạn bài sau: `shared-util-i18n` (type:util) chứa `LanguageService` có trạng thái, và `shared-ui-layout` (type:ui) chứa `ThemeService` có trạng thái — lệch với định nghĩa "util/ui không giữ trạng thái" của Nx. Bài tập buổi 1 dùng điểm này làm câu hỏi thảo luận (phần 4).
