# ADR-0001: Dùng ng-zorro-antd thay PrimeNG làm thư viện UI

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-27
- **Người quyết định:** Nhóm phát triển Care Portal

## Bối cảnh

Care Portal cần bảng dữ liệu có phân trang server, form nhiều bước, chọn ngày và theme sáng/tối. Dự án dự kiến dùng
PrimeNG. Khi kiểm tra license, các bản PrimeNG từ 19.1.4 đến 22.x dùng license thương mại PrimeUI, tính phí theo số
lập trình viên; tổ chức quy mô như VNPT phải mua license.

## Các phương án đã xem xét

| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| PrimeNG (bản thương mại) | Nhiều component, đội ngũ quen | Chi phí license theo đầu người, phải theo dõi điều khoản |
| PrimeNG bản cũ còn MIT | Miễn phí | Kẹt ở Angular cũ, không có bản vá |
| Angular Material | Chính chủ, MIT | Thiếu component nghiệp vụ (bảng có lọc/sort phức tạp, tree select) |
| **ng-zorro-antd** | MIT, đủ component nghiệp vụ, theo kịp Angular 22, có theme tối | Cần chỉnh màu để đạt tương phản WCAG AA; CSS khá lớn (~577 kB) |

## Quyết định

Dùng **ng-zorro-antd** (MIT). Màu chính đổi sang `#0958d9` để đạt tương phản ≥ 4.5:1; mọi màu trong component lấy
từ token `var(--care-*)`.

## Hệ quả

- **Tốt:** không phát sinh chi phí license; nâng Angular major cùng nhịp với thư viện.
- **Phải chấp nhận:** CSS ng-zorro chiếm phần lớn bundle ban đầu, theo dõi bằng budget ở buổi 5 và buổi 9.
- **Cách kiểm chứng:** `npm ls` trong pipeline không được xuất hiện `primeng`; kiểm tra tương phản ở cả hai theme.

## Khi nào xem lại

Khi ng-zorro chậm hỗ trợ Angular major mới quá 3 tháng, hoặc tổ chức đã có license PrimeNG dùng chung.
