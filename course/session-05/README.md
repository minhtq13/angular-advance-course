# Buổi 05 — Hiệu năng và quản lý bộ nhớ

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Điểm bắt đầu:** `git checkout session05-start` · **Đáp án:** 4 patch trong `solution/`, bản đầy đủ ở nhánh `session05-end`

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Chrome Performance, Angular DevTools, OnPush, tracking theo id, zoneless, lazy loading và defer; phân biệt phân trang server với virtual scroll; heap snapshot và retained object. |
| Use case và lab | Đo baseline trên cùng thiết bị và dữ liệu; so sánh DOM thường với virtual scroll, quan sát payload và kiểm tra heap sau 20 lần điều hướng. |
| Sản phẩm đầu ra | Bảng benchmark có dữ liệu thô, profile trước và sau, kết luận nêu điều kiện áp dụng. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Đo trước khi sửa: Chrome Performance, Angular DevTools Profiler, Lighthouse; đo lặp lại trên cùng thiết bị và dữ liệu.
2. Giảm công việc render: `OnPush`, `track` theo id, zoneless (dự án đã zoneless; so sánh với bản có zone), `@defer`, lazy loading.
3. Chọn giữa phân trang server và virtual scroll theo dữ liệu, thao tác và payload.
4. Đọc heap snapshot: so sánh snapshot, tìm retained object và đường giữ (retainer path).
5. Viết kết luận có điều kiện áp dụng, không chỉ "nhanh hơn".

## Use case trên Care Portal

Màn hình **Báo cáo thuê bao** (`/subscribers/report`, có sẵn ở điểm bắt đầu) tải 1.000–10.000 thuê bao vào một bảng HTML thường, kèm
đồng hồ ca trực cập nhật mỗi giây. Màn hình có 4 vấn đề hiệu năng thật: `track` theo object, gọi method trong template cho từng dòng
(`toLocaleDateString`), đồng hồ làm cả trang kiểm tra lại mỗi giây, listener `resize` và `setInterval` không gỡ (rò bộ nhớ).
Backend cần `MAX_PAGE_SIZE=10000` để tải nhiều dòng.

Số đo baseline (máy giảng viên, dev build, CPU 4×): lần đầu 3.394 ms, tải lại 3,7–4,5 giây, 100.167 node DOM, heap +46,5 MB sau 20 lần
điều hướng. Sau khi sửa: tải lại khoảng 150 ms, 357 node DOM, heap +2 MB. Chi tiết: `docs/benchmark-buoi-05.md` (nhánh `session05-end`).

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Baseline: điều kiện đo, Console (`NG0956`), Performance, Performance monitor, Network; ghi dữ liệu thô | 25 |
| 2 | Virtual scroll bằng CDK (lưới CSS + role bảng); so với DOM thường và phân trang server | 35 |
| 3 | Change detection: Angular DevTools Profiler, tách `ShiftClock`, view model tính sẵn, `trackBy` id | 25 |
| 4 | Heap snapshot 3 bước, retainer path, gỡ listener bằng `toSignal`; test `removeEventListener` | 25 |
| 5 | `docs/benchmark-buoi-05.md`: dữ liệu thô, profile trước/sau, kết luận có điều kiện | 10 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Màn hình đo (điểm bắt đầu) | `frontend/libs/portal/feature-subscribers/src/lib/subscriber-report/` |
| Phân trang server (đối chiếu) | `frontend/libs/portal/feature-subscribers/src/lib/subscriber-list/` |
| Giới hạn kích thước trang | `backend/src/main/resources/application.yml` (`MAX_PAGE_SIZE`), `infra/docker-compose.yml` |
| Kịch bản đo lặp lại được (đáp án) | `frontend/apps/portal-e2e/src/perf/report.perf.spec.ts` (`PERF=1`, `THROTTLE=4`) |
| Mẫu bảng benchmark | `course/_templates/benchmark.md` |

## Đã chuẩn bị ở `session05-start`

- Đáp án buổi 4 đã áp (`session04-end`).
- Backend: `max-page-size` đọc từ `MAX_PAGE_SIZE` (mặc định 200).
- Frontend: màn hình **Báo cáo thuê bao** (route `subscribers/report`, nút **Báo cáo** ở trang Thuê bao), key i18n `report.*`, test cơ bản.

## Tài liệu

| | |
|---|---|
| Slide | [slides/slides.md](slides/slides.md) (nguồn Marp) · `buoi-05-hieu-nang-va-bo-nho.pptx` · `buoi-05-hieu-nang-va-bo-nho.pdf` |
| Lab | [lab/README.md](lab/README.md) |
| Đáp án | [solution/README.md](solution/README.md) + 4 file `.patch` |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) · [note-cho-giang-vien.md](note-cho-giang-vien.md) |
| Bài tập về nhà | [../bai-tap-ve-nha/buoi-05-hieu-nang-va-bo-nho.html](../bai-tap-ve-nha/buoi-05-hieu-nang-va-bo-nho.html) |

## Sửa slide

```bash
cd course/session-05/slides
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-05-hieu-nang-va-bo-nho.pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-05-hieu-nang-va-bo-nho.pdf
```
