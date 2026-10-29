# Buổi 04 — Ghi chú giảng viên

## Chuẩn bị trước buổi
- [ ] Checkout nhánh `session04-start`, chạy `docker compose -f infra/docker-compose.yml up -d` và `npm start`
- [ ] Mở sẵn: slide, VS Code tại `frontend/`, trình duyệt (portal), Swagger
- [ ] Thu sản phẩm buổi 03 và bài tập về nhà để dùng trong 20 phút đầu

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

- Không phải state nào cũng cần store. Bắt đầu từ ma trận, không bắt đầu từ thư viện.
- URL là state: thứ gì người dùng muốn chia sẻ hay Back/Forward được thì để trên URL.
- Server state có vòng đời riêng (cache, làm mới, vô hiệu): đừng trộn với UI state.
- Store đặt ở route thì chết theo route; đặt ở root thì phải tự xóa khi đổi phiên.

## Kịch bản demo

(Chưa soạn.)

## Câu hỏi học viên hay hỏi

(Chưa soạn.)

## Lỗi thường gặp khi làm lab

(Chưa soạn.)
