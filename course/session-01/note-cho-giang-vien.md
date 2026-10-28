# Buổi 1 — Ghi chú đọc tài liệu (dành cho giảng viên)

**Buổi 1:** Kiến trúc dự án lớn, khởi tạo dự án mẫu · 3,5 giờ · Angular 22, Nx 24, Spring Boot 3.5

Toàn bộ tài liệu của buổi nằm trong thư mục `course/session-01/`. Tài liệu gồm slide, lab có đáp án và ghi chú giảng viên.

## 1. Thứ tự nên đọc

| # | File | Nội dung | Thời gian |
|---|---|---|---|
| 1 | `README.md` | Mục tiêu buổi học, danh sách tài liệu, bảng "khái niệm nào nằm ở file code nào" | 3 phút |
| 2 | `slides/buoi-01-kien-truc.pdf` (hoặc `.pptx`) | 26 slide: monorepo, Nx, 4 loại lib, module boundaries, lazy loading, runtime config | 15 phút |
| 3 | `lab/README.md` | Đề lab 4 bài, 90 phút. Nên tự làm thử trước khi xem đáp án | 90 phút |
| 4 | `solution/README.md` | Đáp án từng bài và điểm chấm | 15 phút |
| 5 | `instructor-notes.md` | Timeline cả buổi, kịch bản 2 demo, câu hỏi học viên hay hỏi, lỗi thường gặp khi làm lab | 15 phút |

**Bài tập về nhà** giao cuối buổi: `course/bai-tap-ve-nha/buoi-01-bon-loai-lib-va-luat-phu-thuoc.html` (học viên mở bằng trình duyệt, khoảng 30 phút, nộp trước buổi 2). Bài không lặp lại lab trên lớp: có quiz tự chấm, bài kiểm tra import và một bài thiết kế lib cho nghiệp vụ mới (Quản lý hợp đồng doanh nghiệp). Câu hỏi thảo luận ở phần 4 dùng để mở đầu buổi 2.

Ngoài ra còn một file ở thư mục khác: `course/setup/environment.md`. Đây là hướng dẫn cài môi trường, **gửi cho học viên trước buổi học** (cần Node 24 và Docker, không cần cài Java).

## 2. Nội dung 4 bài lab

| Bài | Nội dung | Thời gian |
|---|---|---|
| 1 | Khám phá workspace: đồ thị phụ thuộc, tags, lazy chunk | 15 phút |
| 2 | Thêm màn hình **Gói cước** bằng generator của Nx, nối vào menu bằng lazy loading | 45 phút |
| 3 | Cố tình vi phạm luật phụ thuộc giữa các lib, đọc lỗi ESLint, thảo luận cách tách lib | 15 phút |
| 4 | Nhãn môi trường đọc từ `config.json`, đổi mà không cần build lại | 15 phút |

## 3. Cách chạy dự án để demo

```bash
docker compose -f infra/docker-compose.yml up -d    # backend + cơ sở dữ liệu (đã có sẵn 200.000 thuê bao)
cd frontend && nvm use && npm ci && npm start       # http://localhost:4200
```

Tài khoản đăng nhập (mật khẩu trùng tên đăng nhập): `agent1`, `supervisor1`, `admin1`.

Mã nguồn trong `frontend/` đang ở **trạng thái bắt đầu lab**, nên chưa có màn hình Gói cước. Muốn xem bản đã làm xong, áp đáp án:

```bash
git apply course/session-01/solution/bai2-goi-cuoc.patch
git apply course/session-01/solution/bai4-runtime-config.patch
```

Muốn quay về trạng thái bắt đầu, chạy ngược thứ tự (xem hướng dẫn đầu `solution/README.md`).

## 4. Cần lưu ý

- **Slide:** file `.pptx` là ảnh của từng slide, không sửa chữ trực tiếp được. Muốn đổi nội dung thì sửa file nguồn `slides/slides.md`, rồi xuất lại PPTX và PDF (cách làm ở cuối `README.md` của buổi).
- **Hỏi VNPT trước buổi học:**
  - Máy học viên có cài được Docker Desktop không.
  - Mạng có proxy không, có Nexus hoặc registry npm nội bộ không.
  - Nếu không cài được Docker, cần một máy chủ chung chạy backend; cách cấu hình nằm trong `instructor-notes.md`.
- **Phạm vi nội dung hiện có:** slide chưa có ảnh minh họa chế độ tối và giao diện tiếng Anh, dù ứng dụng đã hỗ trợ cả hai.
- **Tag git:** chưa có tag `session01-start` và `session01-end`. Học viên cần hai tag này để checkout đúng điểm bắt đầu lab.
