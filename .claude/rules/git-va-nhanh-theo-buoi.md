# Git và nhánh theo buổi

- **Chỉ commit, tag, push khi người dùng bảo rõ.** Sự đồng ý ở lần trước không áp dụng cho lần sau. Soạn xong thì để thay đổi chưa commit
  và nêu những commit/nhánh dự định tạo.
- Mỗi buổi có 2 nhánh: `sessionXX-start` (điểm học viên bắt đầu lab) và `sessionXX-end` (đã áp đáp án). `session(XX+1)-start` = `sessionXX-end` + một commit chuẩn bị.
  `main` = tài liệu mới nhất + code ở điểm bắt đầu của buổi mới nhất. **Không dùng tag.**
- Commit message tiếng Việt có dấu, theo mẫu đang dùng:
  `Soạn buổi N: <tên buổi>` (main), `Chuẩn bị điểm bắt đầu buổi N (sessionNN-start)`, `Áp đáp án buổi N (sessionNN-end)`.
  Thêm dòng attribution theo hướng dẫn của hệ thống.
- Không force-push, không viết lại nhánh đã push. Không `git add -A` mù: loại thay đổi riêng của người dùng khỏi commit `main`.
- Commit tạm trong worktree (scratchpad) không lên origin; nhánh chính thức dựng từ cây của trạng thái đã kiểm tra, để tác giả đúng.
- Skill `commit-theo-buoi` mô tả từng bước; chỉ chạy khi được yêu cầu.
