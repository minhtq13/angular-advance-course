# Chuẩn bị trước khóa học Angular nâng cao

Chào các bạn,

Trước buổi học đầu tiên, mỗi bạn cần chuẩn bị sẵn môi trường trên máy của mình. Việc này mất khoảng **20–30 phút**, phần lớn là thời gian tải. Các bạn nên làm **trước buổi học**, ở nhà hoặc ở công ty, vì mạng lớp học không đủ để cả lớp cùng tải một lúc.

Khóa học tập trung vào **Angular**. Phần backend và cơ sở dữ liệu đã được đóng gói sẵn, các bạn **không cần cài Java** và không cần biết Spring.

## 1. Máy tính cần có

- Windows 10/11, macOS hoặc Linux.
- RAM từ 8 GB trở lên (khuyến nghị 16 GB), vì Docker chạy nền.
- Còn trống khoảng **3 GB** ổ đĩa (image Docker và thư viện).
- Có quyền cài phần mềm. Nếu máy công ty bị khóa quyền cài đặt, các bạn báo sớm cho giảng viên, **đừng đợi đến buổi học**.

## 2. Cài 3 phần mềm

| Phần mềm | Phiên bản | Kiểm tra bằng lệnh |
|---|---|---|
| **Git** | bất kỳ | `git --version` |
| **Docker Desktop** | 4.x trở lên | `docker compose version` |
| **Node.js** | **24.x** (tối thiểu 22.22) | `node -v` |

Lưu ý riêng:
- **Windows:** Docker Desktop cần bật **WSL 2** (trình cài đặt sẽ hỏi). Sau khi cài xong nên khởi động lại máy.
- **Node.js:** nên cài qua `nvm` (macOS/Linux) hoặc `nvm-windows`/`fnm` (Windows). Nếu máy đã có Node cũ hơn 22.22, Angular 22 sẽ không chạy.
- Mở Docker Desktop và đợi biểu tượng chuyển sang trạng thái "đang chạy" trước khi làm bước tiếp theo.

Nên cài thêm **VS Code** với các extension: *Angular Language Service*, *Nx Console*, *ESLint*, *Prettier*.

## 3. Tải mã nguồn và chạy thử

```bash
git clone <địa chỉ repo do giảng viên gửi> angular-advance-course
cd angular-advance-course

# Backend + cơ sở dữ liệu (lần đầu mất 3–5 phút để tải và build, các lần sau khoảng 10 giây)
docker compose -f infra/docker-compose.yml up -d

# Frontend
cd frontend
nvm use          # chuyển sang Node 24 (bỏ qua nếu không dùng nvm)
npm ci           # chỉ cần chạy lần đầu
npm start
```

Mở trình duyệt vào http://localhost:4200 và đăng nhập bằng `agent1` / `agent1`.

## 4. Kiểm tra: đủ 3 ô là sẵn sàng

- [ ] http://localhost:4200 đăng nhập được và thấy danh sách thuê bao (200.000 kết quả)
- [ ] http://localhost:8081/swagger-ui.html hiện danh sách API
- [ ] Trong thư mục `frontend`, lệnh `npx nx run-many -t lint test` báo **Successfully**

Sau khi xong, các bạn **chụp màn hình 3 ô trên gửi cho giảng viên** trước buổi học.

## 5. Nếu gặp lỗi

| Hiện tượng | Cách xử lý |
|---|---|
| Báo cần Node phiên bản cao hơn | Đang dùng Node cũ. Chạy `nvm use` trong thư mục `frontend`, hoặc cài Node 24 |
| `port is already allocated` (cổng 5433, 8081, 8088) | Có phần mềm khác đang dùng cổng đó. Tắt nó đi, hoặc báo giảng viên để đổi cổng |
| Đăng nhập báo "Không đăng nhập được" | Backend chưa khởi động xong. Chạy `docker compose -f infra/docker-compose.yml ps`, đợi dòng `api` báo `healthy` rồi thử lại |
| Lần đầu `docker compose up` rất lâu hoặc báo lỗi tải | Đang tải image và thư viện, cần có internet. Nếu mạng công ty có proxy, xem mục dưới |
| Không cài được Docker trên máy công ty | Báo giảng viên trước buổi học. Lớp sẽ có phương án dùng chung một máy chủ backend |

**Nếu mạng công ty có proxy**, chạy hai lệnh sau (thay địa chỉ proxy của công ty):

```bash
npm config set proxy http://proxy.cong-ty:8080
npm config set https-proxy http://proxy.cong-ty:8080
```

Với Docker, cấu hình proxy trong Docker Desktop: *Settings → Resources → Proxies*. Nếu công ty có registry npm nội bộ (Nexus/Artifactory), các bạn hỏi bộ phận IT địa chỉ rồi chạy `npm config set registry <địa chỉ>`.

## 6. Sau mỗi buổi học

Mỗi buổi có một **bài tập về nhà** khoảng 30 phút trong thư mục `course/bai-tap-ve-nha/`. Các bạn mở file `.html` của buổi bằng trình duyệt (từ repo đã clone, không xem trên GitHub) và nộp trước buổi kế tiếp.

## 7. Mang theo buổi học

- Laptop đã cài sẵn như trên, **sạc đầy pin** và mang theo dây sạc.
- Docker Desktop đã khởi động và chạy thử thành công.
- Tài khoản đăng nhập mẫu (mật khẩu trùng tên đăng nhập): `agent1`, `supervisor1`, `admin1`.

Cần hỗ trợ, các bạn gửi **ảnh chụp màn hình lỗi** (kèm lệnh đã chạy) cho giảng viên. Việc này giúp xử lý nhanh hơn nhiều so với mô tả bằng lời.

Hẹn gặp các bạn ở buổi học đầu tiên!
