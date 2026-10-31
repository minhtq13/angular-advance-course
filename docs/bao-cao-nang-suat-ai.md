# Báo cáo năng suất khi dùng AI: bộ lọc "Loại yêu cầu"

Mỗi nhóm điền bằng **số đo của chính nhóm** (đồng hồ bấm giờ, lịch sử chat, `git log`). Không ước lượng sau khi xong.
Mục đích: biết AI tiết kiệm được gì **sau khi** tính thời gian kiểm tra, không phải chứng minh AI nhanh.

## Bối cảnh

| | |
|---|---|
| Công cụ, model, phiên bản | |
| Được phép dùng theo chính sách đơn vị? Gửi mã nguồn ra ngoài? | |
| Hướng dẫn repository đã dùng | `AGENTS.md`, `.github/copilot-instructions.md` (Bài 1) |
| Prompt (dán nguyên văn) | |

## Thời gian (phút)

| Hoạt động | Có AI | Tự làm (nhóm khác hoặc lần làm trước) |
|---|---|---|
| Đọc yêu cầu, viết prompt / thiết kế | | |
| AI sinh code / tự viết code | | |
| Đọc và review diff | | |
| Xác minh: chạy test, curl, trình duyệt | | |
| Sửa lỗi sau review | | |
| Viết negative test, thử phá | | |
| **Tổng** | | |

## Chất lượng

| | Có AI |
|---|---|
| Số dòng diff AI sinh / số dòng giữ lại | |
| Số finding của AI khi review / số đúng / số sai | |
| Lỗi AI sinh ra mà test bắt được / chỉ người review bắt được | |
| Thử phá M1–M5: số chỗ phá bị test bắt | |

## Kết luận

- Phần nào AI làm tốt (ví dụ: test bảng, cập nhật spec cũ hàng loạt)?
- Phần nào phải kiểm kỹ (hợp đồng API, fake adapter, i18n, phạm vi)?
- Lần sau đổi gì trong prompt hoặc hướng dẫn repository?
