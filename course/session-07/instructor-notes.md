# Buổi 07 — Ghi chú giảng viên

## Chuẩn bị trước buổi
- [ ] Checkout nhánh `session07-start`, chạy `docker compose -f infra/docker-compose.yml up -d` --profile sso và `npm start`
- [ ] Mở sẵn: slide, VS Code tại `frontend/`, trình duyệt (portal), Swagger
- [ ] Thu sản phẩm buổi 06 và bài tập về nhà để dùng trong 20 phút đầu

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

- PKCE bắt buộc cho SPA: client public không giữ được secret.
- BFF an toàn hơn về token nhưng cần thêm server và xử lý CSRF; chọn theo rủi ro, ghi ADR.
- E2E đắt: chỉ dùng cho hành trình quan trọng. Quy tắc nghiệp vụ test ở tầng unit.
- Test quyền phải đi thẳng vào API. Test UI ẩn nút không chứng minh gì về bảo mật.

## Kịch bản demo

(Chưa soạn.)

## Câu hỏi học viên hay hỏi

(Chưa soạn.)

## Lỗi thường gặp khi làm lab

(Chưa soạn.)
