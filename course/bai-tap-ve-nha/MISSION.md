# Mission: Kiến trúc dự án Angular lớn với Nx

## Why
Học viên là dev Angular ở VNPT, làm các hệ thống nhiều team, nhiều app dùng chung code. Sau khóa học, họ cần tổ chức được code để dự án lớn thêm mà không rối: biết đặt code vào đâu, chặn được import sai bằng công cụ thay vì nhắc nhau khi review.

## Success looks like
- Giải thích được cho đồng nghiệp vì sao một import bị cấm (ví dụ: feature không được import feature khác), dẫn được luật cụ thể.
- Nhìn một nghiệp vụ mới là chia được thành các lib, gán đúng tag `scope:*` và `type:*`.
- Dùng Nx không cần tra cứu: generator tạo lib, `nx graph`, `nx lint`, đọc và sửa `depConstraints`.
- Áp dụng cách tổ chức này vào một dự án Angular thật ở công ty.

## Constraints
- Mỗi buổi học 3–4 giờ, 10 buổi; buổi 1 là kiến trúc dự án lớn. Sau mỗi buổi có bài tập về nhà khoảng 30 phút, nộp trước buổi kế tiếp.
- Thực hành trên dự án mẫu Care Portal trong repo này (Angular 22, Nx 24). Học viên chỉ cài Node 24 + Docker.
- Tài liệu bằng tiếng Việt có dấu. Học viên có thể đang quen Angular bản cũ (NgModule) ở dự án hiện tại (chưa xác nhận).

## Out of scope
- Backend (Spring Boot): chỉ dùng như hộp đen chạy trong Docker.
- Micro-frontend / Module Federation: chỉ nhắc ở mức "khi nào cần", không thực hành.
- Nx Cloud, remote cache, Conformance (gói trả phí).
