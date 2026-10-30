# Release checklist: <version>

## Trước khi phát hành
- [ ] Artifact build từ commit/tag `...`, version ghi trong image và trong log lỗi
- [ ] Gate xanh: lint (gồm luật import), test, build, budget
- [ ] `npm ci` với lockfile; Node theo `.nvmrc`
- [ ] Cấu hình môi trường (`config.json`) đã duyệt; không có secretKey trong client
- [ ] Migration dữ liệu (nếu có) có cách lùi
- [ ] Version trước đó (`...`) còn sẵn để rollback

## Smoke test sau triển khai
- [ ] Trang chủ và deep link (`/tickets?status=NEW`) mở được, tải lại không 404
- [ ] Đăng nhập Agent, Manager
- [ ] Một thao tác ghi (tạo phiếu) thành công
- [ ] Hành động sai quyền bị API từ chối (403)
- [ ] `index.html`, `config.json` không bị cache; asset có hash cache dài
- [ ] Header bảo mật có mặt (CSP, `X-Content-Type-Options`, `frame-ancestors`)
- [ ] Không có lỗi mới trên kênh quan sát lỗi, lọc theo version

Bằng chứng: ảnh, log, kết quả lệnh.

## Rollback
- Điều kiện kích hoạt: ...
- Lệnh: ...
- Người quyết định: ...
- Đã diễn tập ngày: ...
