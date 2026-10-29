# Buổi 1 — Ghi chú đọc tài liệu (dành cho giảng viên)

**Buổi 1:** Kiến trúc Angular cho dự án lớn · 4 giờ · Angular 22, Nx 24, Spring Boot 3.5

Toàn bộ tài liệu của buổi nằm trong thư mục `course/session-01/`. Tài liệu gồm slide, lab có đáp án và ghi chú giảng viên.

## 1. Thứ tự nên đọc

| # | File | Nội dung | Thời gian |
|---|---|---|---|
| 1 | `README.md` | Nội dung theo đề cương, mục tiêu, danh sách tài liệu, bảng "khái niệm nào nằm ở file code nào" | 3 phút |
| 2 | `slides/buoi-01-kien-truc.pdf` (hoặc `.pptx`) | 34 slide: monorepo, Nx, loại lib, module boundaries, lazy loading, Clean Architecture, phạm vi DI, port/adapter, fake, luật CI, ADR | 20 phút |
| 3 | `lab/README.md` | Đề lab 5 bài, 120 phút, cộng review chéo ADR. Nên tự làm thử trước khi xem đáp án | 120 phút |
| 4 | `solution/README.md` | Đáp án từng bài, thông báo lỗi lint thật và điểm chấm | 15 phút |
| 5 | `instructor-notes.md` | Timeline 4 giờ, kịch bản 3 demo, câu hỏi học viên hay hỏi, lỗi thường gặp khi làm lab | 15 phút |

**Bài tập về nhà** giao cuối buổi: `course/bai-tap-ve-nha/buoi-01-bon-loai-lib-va-luat-phu-thuoc.html` (học viên mở bằng trình duyệt, khoảng 30 phút, nộp trước buổi 2). Bài không lặp lại lab trên lớp: có quiz tự chấm, bài kiểm tra import và một bài thiết kế lib cho nghiệp vụ mới (Quản lý hợp đồng doanh nghiệp). Bài tập dùng 4 loại lib gốc, chưa có `type:domain`; giảng viên nhắc lớp điều này khi giao bài. Câu hỏi thảo luận ở phần 4 dùng để mở đầu buổi 2.

Ngoài ra còn hai chỗ khác:
- `course/setup/environment.md`: hướng dẫn cài môi trường, **gửi cho học viên trước buổi học** (cần Node 24 và Docker, không cần cài Java).
- `course/_templates/adr.md` và `docs/adr/0001-...md`: mẫu ADR và một ADR thật làm ví dụ.

## 2. Nội dung 5 bài lab

| Bài | Nội dung | Thời gian |
|---|---|---|
| 1 | Khám phá workspace, vẽ sơ đồ phụ thuộc của màn hình Phiếu | 15 phút |
| 2 | Thêm màn hình **Gói cước** bằng generator của Nx, nối vào menu bằng lazy loading | 30 phút |
| 3 | Tách `TicketListPage`: **TicketPort** (lib `type:domain`) + **HttpTicketAdapter** (lib `type:data-access`), nối ở route của app | 40 phút |
| 4 | **Fake adapter** `InMemoryTicketAdapter`, test màn hình không cần HTTP | 20 phút |
| 5 | Luật import mới (`type:domain`, cấm HttpClient trong feature, cấm `TicketApi`), phá luật, job CI | 15 phút |
| Review chéo | Sơ đồ trước/sau và ADR-0002 | 20 phút |
| Mở rộng | Nhãn môi trường đọc từ `config.json` (làm ở nhà) | |

## 3. Cách chạy dự án để demo

```bash
docker compose -f infra/docker-compose.yml up -d    # backend + cơ sở dữ liệu (đã có sẵn 200.000 thuê bao)
cd frontend && nvm use && npm ci && npm start       # http://localhost:4200
```

Tài khoản đăng nhập (mật khẩu trùng tên đăng nhập): `agent1`, `supervisor1` (vai trò Manager của đề cương), `admin1`.

Nhánh `main` đã đi tiếp sang các buổi sau. Để về điểm bắt đầu lab buổi 1 (chưa có Gói cước, `TicketListPage` còn gọi `TicketApi` trực tiếp): `git checkout session01-start`. Bản đã làm xong là tag `session01-end`, hoặc áp đáp án lên `session01-start`:

```bash
git apply course/session-01/solution/bai2-goi-cuoc.patch
git apply course/session-01/solution/bai3-5-ticket-port.patch
git apply course/session-01/solution/mo-rong-runtime-config.patch   # tùy chọn
```

Muốn quay về trạng thái bắt đầu, chạy ngược thứ tự (xem hướng dẫn đầu `solution/README.md`).

## 4. Cần lưu ý

- **Slide:** file `.pptx` là ảnh của từng slide, không sửa chữ trực tiếp được. Muốn đổi nội dung thì sửa file nguồn `slides/slides.md`, rồi xuất lại PPTX và PDF (cách làm ở cuối `README.md` của buổi).
- **Tên dự án:** đề cương gọi là *Service Portal* với vai trò Agent và Manager. Repo giữ tên Care Portal; nói rõ ánh xạ ở slide 4.
- **Hỏi VNPT trước buổi học:**
  - Máy học viên có cài được Docker Desktop không.
  - Mạng có proxy không, có Nexus hoặc registry npm nội bộ không.
  - Dùng GitHub hay GitLab: lab Bài 5 có sẵn cả hai dạng job CI.
  - Nếu không cài được Docker, cần một máy chủ chung chạy backend; cách cấu hình nằm trong `instructor-notes.md`.
- **Phạm vi nội dung hiện có:** slide chưa có ảnh minh họa chế độ tối và giao diện tiếng Anh, dù ứng dụng đã hỗ trợ cả hai.
- **Tag git:** `session01-start` (điểm bắt đầu lab) và `session01-end` (đã áp 3 patch, cũng là `session02-start` về phía frontend).
