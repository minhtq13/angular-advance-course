# Buổi 05 — Hiệu năng và quản lý bộ nhớ

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Trạng thái tài liệu:** đã có khung theo đề cương; chưa soạn slide, lab chi tiết, đáp án.

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

- Trang Thuê bao trên 200.000 bản ghi (tăng lên 1–5 triệu bằng seed): đo thời gian từ đổi bộ lọc tới vẽ xong bảng.
- So sánh 3 cách: phân trang server 20/100 dòng, tải 10.000 dòng render DOM thường, 10.000 dòng với virtual scroll
  (`cdk-virtual-scroll-viewport` hoặc `nzVirtualScroll`). Ghi payload (kB), thời gian scripting/rendering, bộ nhớ.
- Bundle ban đầu ~1,29 MB, riêng CSS ng-zorro ~577 kB: đo, đặt budget, thử import CSS theo component.
- Rò bộ nhớ có chủ đích (subscription `interval` không hủy, listener `window` không gỡ): điều hướng 20 lần, so sánh heap.

## Dự kiến lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Baseline: quy trình đo (thiết bị, CPU throttle, dữ liệu, số lần lặp), ghi dữ liệu thô | 25 |
| 2 | DOM thường so với virtual scroll so với phân trang server; ghi payload và profile | 35 |
| 3 | Change detection: Angular DevTools Profiler, `OnPush`, `track`, `@defer` cho panel chi tiết | 25 |
| 4 | Heap sau 20 lần điều hướng: tìm retained object, sửa, đo lại | 25 |
| 5 | Hoàn thiện bảng benchmark và kết luận có điều kiện | 10 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Phân trang server và bảng thuê bao | `frontend/libs/portal/feature-subscribers/` |
| Budget build | `frontend/apps/portal/project.json` (`budgets`) |
| Chỉ đăng ký icon dùng tới | `frontend/libs/shared/ui-layout/src/lib/provide-ui.ts` |
| Seed dữ liệu lớn | `backend/src/main/resources/application.yml` (`SEED_SUBSCRIBERS`), `README.md` mục Tăng lượng dữ liệu |
| Index và trigram | `backend/src/main/resources/db/migration/` |

## Cần chuẩn bị trước khi soạn chi tiết

- [ ] Endpoint hoặc chế độ trả nhiều dòng (ví dụ `size=10000`, có giới hạn trên) chỉ dùng cho bài so sánh.
- [ ] Commit có rò bộ nhớ cố ý làm điểm xuất phát Bài 4.
- [ ] Mẫu bảng benchmark: `course/_templates/benchmark.md`.
- [ ] Cảnh báo học viên: máy yếu thì giảm xuống 1 triệu bản ghi; mọi so sánh phải trên cùng máy.

## Tài liệu

| | |
|---|---|
| Slide | `slides/` (chưa soạn) |
| Lab | `lab/` (chưa soạn) |
| Đáp án | `solution/` (chưa soạn) |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) |
| Bài tập về nhà | `../bai-tap-ve-nha/buoi-05-<chu-de>.html` (chưa soạn) |
