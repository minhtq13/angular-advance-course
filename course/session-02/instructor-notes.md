# Buổi 02 — Ghi chú giảng viên

## Chuẩn bị trước buổi
- [ ] Checkout tag `session02-start`, chạy `docker compose -f infra/docker-compose.yml up -d` và `npm start`
- [ ] Mở sẵn: slide, VS Code tại `frontend/`, trình duyệt (portal), Swagger
- [ ] Thu sản phẩm buổi 01 và bài tập về nhà để dùng trong 20 phút đầu

## Timeline (4 giờ)

| Thời gian | Nội dung | Hình thức |
|---|---|---|
| 0:00–0:20 | Review bài trước (bài tập về nhà, sản phẩm buổi trước) và phân tích use case | Thảo luận |
| 0:20–1:00 | Khái niệm cần thiết gắn với đoạn mã | Trình bày |
| 1:00–1:30 | Live demo và phân tích lỗi | Demo |
| 1:30–1:40 | Nghỉ | |
| 1:40–3:40 | Lab theo bước và kiểm tra kết quả | Thực hành |
| 3:40–4:00 | Review chéo và chốt quyết định | Thảo luận |

## Điểm cần nhấn mạnh

- Component hiển thị không biết dữ liệu đến từ đâu: chỉ input/output. Kiểm chứng bằng luật `type:ui` từ buổi 1.
- Validation client là để trải nghiệm, validation server là để đúng. Tiêu đề khoảng trắng phải bị chặn ở cả hai.
- Disable nút không thay được idempotency: mạng chập chờn, retry tự động, hai tab vẫn gửi trùng.
- 409 là tình huống nghiệp vụ, không phải lỗi hệ thống: thiết kế UI cho nó.

## Kịch bản demo

(Chưa soạn.)

## Câu hỏi học viên hay hỏi

(Chưa soạn.)

## Lỗi thường gặp khi làm lab

(Chưa soạn.)
