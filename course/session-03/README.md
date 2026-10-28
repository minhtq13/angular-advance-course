# Buổi 03 — Signals và RxJS cho luồng dữ liệu

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Trạng thái tài liệu:** đã có khung theo đề cương; chưa soạn slide, lab chi tiết, đáp án.

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Writable signal, computed, effect và interop với Observable; debounce, distinctUntilChanged, switchMap, concatMap, exhaustMap và mergeMap; teardown, cache và xử lý lỗi trong luồng. |
| Use case và lab | Tái hiện truy vấn cũ trả về muộn, khôi phục hủy request, kiểm thử luồng vẫn hoạt động sau lỗi và kiểm tra subscription khi rời màn hình. |
| Sản phẩm đầu ra | Pipeline tìm kiếm có hủy, test theo trình tự sự kiện và bảng lựa chọn operator. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Chọn đúng công cụ: `signal`, `computed`, `linkedSignal`, `effect`, `resource`/`rxResource`, và khi nào cần Observable.
2. Chuyển đổi hai chiều bằng `toSignal`, `toObservable`, `takeUntilDestroyed`; hiểu teardown của từng cách.
3. Chọn operator làm phẳng theo ngữ nghĩa: `switchMap` (tìm kiếm), `concatMap` (ghi tuần tự), `exhaustMap` (nút gửi), `mergeMap` (song song có giới hạn).
4. Xử lý lỗi bên trong luồng để luồng không chết sau lỗi đầu tiên; cache kết quả có kiểm soát (`shareReplay` với `refCount`).
5. Viết test theo trình tự sự kiện bằng fake timers hoặc `TestScheduler` (marble).

## Use case trên Care Portal

- **Tìm kiếm thuê bao** (`SubscriberListPage`) dùng ô tìm kiếm có debounce trên 200.000 bản ghi. Gõ `091` rồi `0912`:
  nếu request `091` về **sau** `0912`, bảng hiện sai kết quả. Tái hiện bằng độ trễ khác nhau theo query.
- Thay `switchMap` bằng `mergeMap` để thấy lỗi, rồi khôi phục hủy request (tab Network hiện *canceled*).
- Cho API trả 500 một lần: luồng phải tiếp tục nhận từ khóa mới.
- Rời màn hình khi request đang chạy: không còn subscription, không còn log sau khi destroy.

## Dự kiến lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Đo hiện trạng: đọc pipeline tìm kiếm, vẽ sơ đồ sự kiện (marble) trên giấy | 15 |
| 2 | Tái hiện truy vấn cũ trả về muộn bằng fake adapter có độ trễ theo query; đổi sang `mergeMap` để thấy lỗi | 30 |
| 3 | Khôi phục hủy request, test theo trình tự sự kiện (fake timers / `TestScheduler`) | 30 |
| 4 | Luồng sống sau lỗi: `catchError` đặt đúng chỗ, test lỗi rồi gõ tiếp | 25 |
| 5 | Subscription khi rời màn hình: `takeUntilDestroyed`, `toSignal`; kiểm tra bằng test và DevTools | 20 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Interop signal ↔ RxJS ở trang thuê bao | `frontend/libs/portal/feature-subscribers/src/lib/subscriber-list/subscriber-list.page.ts` |
| `rxResource` + `linkedSignal` phân trang | `frontend/libs/portal/feature-tickets/src/lib/ticket-list/ticket-list.page.ts` |
| Fake adapter (thêm độ trễ) | `libs/portal/domain-tickets/src/testing.ts` (sau buổi 1) |
| Tìm kiếm phía server (tiền tố SĐT, CCCD, tên) | `backend/.../subscriber/SubscriberSpecs.java` |

## Cần chuẩn bị trước khi soạn chi tiết

- [ ] Fake adapter cho thuê bao (hoặc tham số dev-only `?delayMs=` ở backend) để điều khiển độ trễ theo từng query.
- [ ] Bảng lựa chọn operator mẫu trong `solution/` (ngữ nghĩa, khi nào dùng, rủi ro).
- [ ] Một commit cố ý dùng `mergeMap` và `subscribe` không hủy để làm điểm xuất phát lab.

## Tài liệu

| | |
|---|---|
| Slide | `slides/` (chưa soạn) |
| Lab | `lab/` (chưa soạn) |
| Đáp án | `solution/` (chưa soạn) |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) |
| Bài tập về nhà | `../bai-tap-ve-nha/buoi-03-<chu-de>.html` (chưa soạn) |
