# Buổi 06 — Ghi chú giảng viên

## Chuẩn bị trước buổi
- [ ] Checkout nhánh `session06-start`, chạy `docker compose -f infra/docker-compose.yml up -d` và `npm start`
- [ ] Mở sẵn: slide, VS Code tại `frontend/`, trình duyệt (portal), Swagger
- [ ] Thu sản phẩm buổi 05 và bài tập về nhà để dùng trong 20 phút đầu

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

- Ẩn nút không phải là phân quyền. Mọi kiểm tra quyền phải có ở API và có test chứng minh.
- Refresh đồng thời là bài toán thật: không chia sẻ thì N request sinh N refresh, và với rotation thì N−1 cái bị coi là tái sử dụng.
- Token trong storage đọc được bằng JS: XSS là đủ để lộ. Cookie HttpOnly đổi rủi ro XSS lấy rủi ro CSRF.
- Không bao giờ đặt bí mật (client secret, khóa ký) trong code client: điều kiện bắt buộc của bài cuối khóa.

## Kịch bản demo

(Chưa soạn.)

## Câu hỏi học viên hay hỏi

(Chưa soạn.)

## Lỗi thường gặp khi làm lab

(Chưa soạn.)
