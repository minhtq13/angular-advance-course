# Buổi 05 — Ghi chú giảng viên

## Trước buổi học

**Vài ngày trước:**
- Nhắc học viên cài **Angular DevTools** (Chrome Web Store) và build lại `api` (lệnh dưới).
- Thu ma trận state và ADR-0003 của buổi 4.

**Ngày học:**
- [ ] `git checkout session05-start`
- [ ] `MAX_PAGE_SIZE=10000 docker compose -f infra/docker-compose.yml up -d --build api`
- [ ] `cd frontend && npm ci && npm start`, đăng nhập `agent1`, bấm **Báo cáo** ở trang Thuê bao, chọn 10.000 dòng: phải tải được
- [ ] Chrome cửa sổ ẩn danh, tắt extension khác (trừ Angular DevTools); DevTools mở sẵn Performance (CPU 4×), Memory
- [ ] Nhánh `session05-end` để chuyển sang ở bước 5 của demo
- [ ] Sau buổi: `docker compose -f infra/docker-compose.yml up -d api` (về giới hạn 200)

## Timeline (4 giờ)

| Thời gian | Nội dung | Slide | Ghi chú |
|---|---|---|---|
| 0:00–0:20 | Review buổi 4, use case | 1–4 | Hỏi lớp: "Trong dự án của anh chị, màn hình nào chậm nhất? Đã đo chưa?" |
| 0:20–1:00 | Khái niệm | 5–18 | Quy trình đo và công cụ (5–7), change detection (8–10), DOM lớn (11–13), bộ nhớ (14–16), số đo và kết luận (17–18) |
| 1:00–1:30 | Live demo | 19 | 5 bước, cho lớp dự đoán trước mỗi bước |
| 1:30–1:40 | **Nghỉ** | | |
| 1:40–3:40 | **Lab** 5 bài | 20–21 | Mốc nhắc: 2:05 sang Bài 2, 2:40 sang Bài 3, 3:05 sang Bài 4, 3:30 sang Bài 5 |
| 3:40–4:00 | Review chéo | 22 | Câu hỏi chốt: "Đo máy khác thì kết luận còn đúng không?"; giao bài tập về nhà |

## Kịch bản demo

1. **Console (2 phút).** Chọn 10.000 dòng, bấm **Tải lại**: `NG0956`. Hỏi: "Angular đang nói gì?"
2. **Performance (8 phút).** CPU 4×. Record "Tải lại": long task vài giây. Mở Bottom-Up: phần lớn là scripting của Angular
   (tạo view, binding) và rendering. Chỉ `toLocaleDateString` trong danh sách hàm tốn thời gian.
3. **Angular DevTools Profiler (7 phút).** Record, ngồi yên 3 giây: mỗi giây một cột, `SubscriberReportPage` chiếm gần hết.
   Hỏi lớp: "Tại sao một cái đồng hồ lại làm cả trang chạy lại?"
4. **Memory (8 phút).** Quy trình 3 snapshot (slide 15). Lọc `SubscriberReportPage`: `# New` = 20. Mở Retainers, dò ngược tới `Window`.
   Tìm `Detached HTMLTableRowElement`.
5. **Sau khi sửa (5 phút).** `git checkout session05-end`, làm lại 2–4: tải lại khoảng 150 ms, Profiler phẳng, heap không tăng theo số lần.
   Trả về `session05-start` trước lab.

## Điểm cần nhấn mạnh

- **Đo trước khi sửa, mỗi lần đổi một thứ.** Không có số đo thì không có tối ưu; một lần đo không phải số đo.
- **Zoneless + `OnPush` chưa đủ.** Kiểm tra một view nghĩa là đánh giá lại mọi binding trong view đó: phần cập nhật liên tục phải ở view nhỏ riêng.
- **Virtual scroll giảm DOM, không giảm payload.** Phân trang server vẫn là mặc định.
- **Kết luận có điều kiện.** Dùng dòng "đối chứng" trong bảng: `track` theo id không làm tải lại nhanh hơn khi vẫn vẽ 10.000 dòng. Số đo bác bỏ trực giác là bài học quan trọng nhất của buổi.
- **Rò bộ nhớ tích lũy.** CSKH mở báo cáo cả ngày; mỗi lần +2 MB là +200 MB sau 100 lần.

## Câu hỏi học viên hay hỏi

| Câu hỏi | Gợi ý trả lời |
|---|---|
| Dự án em còn Zone.js, có khác không? | Có: mọi sự kiện, timer, request đều kích hoạt change detection từ gốc. `OnPush` càng quan trọng. Buổi 10 đánh giá chuyển sang zoneless. |
| `nzVirtualScroll` của nz-table thay CDK được không? | Được, nz-table dùng CDK bên dưới. Lab dùng CDK trực tiếp để thấy rõ cơ chế và giữ được ngữ nghĩa bảng. |
| Pipe thuần có cache không? | Pipe thuần chỉ chạy lại khi input đổi. Pipe `transloco` không thuần (phải theo ngôn ngữ), nên chạy mỗi lần kiểm tra view. |
| Web Worker để xử lý 10.000 dòng? | Hợp với tính toán nặng (lọc, tổng hợp). Ở đây chi phí chính là DOM và binding trên main thread, worker không giúp. |
| Số đo trên máy dev có ý nghĩa với người dùng không? | Có ý nghĩa **tương đối** (trước/sau). Số tuyệt đối phải đo bằng production build trên thiết bị gần người dùng (CPU throttle 4×). |
| Khi nào lo bundle size? | Khi đo thấy tải trang đầu chậm. Buổi 9 đặt budget trên CI; CSS ng-zorro ~577 kB là ứng viên đầu tiên. |

## Lỗi thường gặp khi làm lab

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Chọn 10.000 dòng: lỗi "Không tải được báo cáo" | `api` chưa chạy với `MAX_PAGE_SIZE=10000` | Chạy lại lệnh `--build api` với biến môi trường |
| Virtual scroll trắng | Viewport không có chiều cao | `height: calc(100vh - 320px)` |
| Dòng chồng nhau, cuộn nhảy | `itemSize` khác chiều cao CSS thật | Cố định `height` của `.report-row` = `rowHeight` |
| Tiêu đề cột cuộn mất | Đặt trong viewport | Đưa ra ngoài, dùng chung lưới cột |
| Test virtual scroll đếm 0 dòng | jsdom không có kích thước viewport | Kiểm tra `aria-rowcount` và "ít hơn 100 dòng", không đếm chính xác |
| Profiler vẫn thấy trang chạy mỗi giây | Còn đọc `now()` trong template trang | Chỉ `ShiftClock` đọc thời gian |
| Heap vẫn tăng sau khi sửa resize | Còn `setInterval` của đồng hồ (làm Bài 4 trước Bài 3) | Sửa cả hai |
| Heap snapshot không thấy gì | F5 giữa các lần điều hướng; chưa bấm GC | Điều hướng bằng nút trong app; GC trước mỗi snapshot |
| Số đo dao động mạnh | Đo khi DevTools Profiler đang record; máy đang build | Đo từng công cụ riêng; chờ dev server build xong |

## Sau buổi học

- Giao bài tập về nhà: [../bai-tap-ve-nha/buoi-05-hieu-nang-va-bo-nho.html](../bai-tap-ve-nha/buoi-05-hieu-nang-va-bo-nho.html) (khoảng 30 phút, nộp trước buổi 6).
- Thu `docs/benchmark-buoi-05.md` và ảnh profile/heap của các nhóm.
- Buổi 6 bắt đầu từ `session06-start` = `session05-end` + phần chuẩn bị.
