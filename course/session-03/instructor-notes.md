# Buổi 03 — Ghi chú giảng viên

## Trước buổi học

**Vài ngày trước:**
- Thu bài tập về nhà buổi 2. Chọn 2 bài phần 3 (màn hình Đổi gói cước) có cách xử lý timeout khác nhau để mở đầu.
- Nhắc học viên build lại `api` với chế độ demo (lệnh dưới). Lần build đầu mất vài phút.

**Ngày học:**
- [ ] `git checkout session03-start`
- [ ] `DEMO_SLOW_SHORT_QUERY=true docker compose -f infra/docker-compose.yml up -d --build api`
- [ ] Kiểm tra: `curl` hoặc trình duyệt, tìm thuê bao `0900` chậm khoảng 2 giây, `0900123` nhanh
- [ ] `cd frontend && npm ci && npm start`, đăng nhập `agent1`, mở **Tạo phiếu**
- [ ] VS Code mở sẵn `lookup.ts`, `lookup.spec.ts`; terminal chạy `npx nx test portal-feature-tickets --watch`
- [ ] Nhánh dự phòng `session03-end` để chuyển sang nếu demo hỏng
- [ ] Sau buổi: `docker compose -f infra/docker-compose.yml up -d api` để tắt chế độ demo

## Timeline (4 giờ)

| Thời gian | Nội dung | Slide | Ghi chú |
|---|---|---|---|
| 0:00–0:20 | Review buổi 2, use case | 1–6 | Slide 5: cho lớp 3 phút tự tìm vấn đề trước khi lật slide 6 |
| 0:20–1:00 | Khái niệm | 7–22 | Signals và interop (7–10), marble và operator (11–15), test marble (16–17), lỗi (18–19), teardown (20–21), cache (22) |
| 1:00–1:30 | Live demo | 23 | **Demo 1** (truy vấn cũ về muộn), **Demo 2** (test đỏ → xanh), **Demo 3** (Offline) |
| 1:30–1:40 | **Nghỉ** | | |
| 1:40–3:40 | **Lab** 5 bài | 24–25 | Mốc nhắc: 1:55 sang Bài 2, 2:25 sang Bài 3, 2:55 sang Bài 4, 3:20 sang Bài 5 |
| 3:40–4:00 | Review chéo | 26 | Mỗi nhóm 5 phút theo 3 câu trong lab; giao bài tập về nhà |

## Kịch bản demo

### Demo 1 — Truy vấn cũ trả về muộn (khoảng 10 phút)

1. Màn hình chiếu: trang Tạo phiếu bên trái, DevTools Network (lọc `subscribers`) bên phải.
2. Gõ `0900`, dừng nửa giây, gõ `123`. **Dừng lại, hỏi lớp:** "Sau 2 giây, danh sách sẽ hiện gì?" Cho vài người trả lời.
3. Danh sách hiện `0900200000…`. Chỉ vào Network: hai request đều *200*, `?q=0900` kết thúc **sau**.
4. Mở `lookup.ts`, đổi `mergeMap` → `switchMap` (dev server tự build lại), làm lại: `?q=0900` thành *(canceled)*.

### Demo 2 — Test marble đỏ rồi xanh (khoảng 12 phút)

1. Trả code về `mergeMap`. Viết test "từ khóa cũ về muộn" **trước mặt lớp**, tính chuỗi marble mong đợi cùng lớp (slide 17).
2. Test đỏ. Đọc diff của Vitest: có thêm `done('0901')` lúc 1300ms; `slow.subscriptions` không có `!`.
3. Đổi sang `switchMap` (chưa thêm `startWith`) → vẫn đỏ vì chưa có `loading`. Thêm `startWith` → xanh.
   Nhấn mạnh: test mô tả **hành vi mong muốn**, code đuổi theo test.

### Demo 3 — Luồng chết sau lỗi (khoảng 5 phút)

1. Network → **Offline**, gõ `0900123`. Bật lại mạng, gõ `0900124`: không có request nào.
2. Hỏi lớp: "Vì sao?" Chỉ vào `catchError` ở ngoài. Không sửa ngay: đây là Bài 4.

## Điểm cần nhấn mạnh

- **Signal cho trạng thái, Observable cho sự kiện theo thời gian.** Khi nào thấy debounce, hủy, retry, xếp hàng → RxJS.
- **`effect` không dùng để đồng bộ state.** Hỏi lớp: "Kết quả có ra khỏi Angular không?"
- **Câu hỏi chọn operator:** "Sự kiện mới đến khi request cũ chưa xong thì muốn gì?" Không học thuộc tên, học câu hỏi.
- **`switchMap` cho lệnh ghi là sai.** Nối lại buổi 2: hủy request không có nghĩa server chưa ghi.
- **Test đỏ trước.** Một test chưa từng đỏ chưa chứng minh được gì (nối sang buổi 8: kiểm chứng test do AI viết).
- **Không `subscribe` trần.** Mỗi subscription phải trả lời được: "Ai hủy nó, khi nào?"

## Câu hỏi học viên hay hỏi

| Câu hỏi | Gợi ý trả lời |
|---|---|
| Signals thay hẳn RxJS được không? | Không. Signals không có thời gian và hủy. Angular dùng cả hai: `resource`/`rxResource` là cầu nối. |
| `rxResource` có debounce không? | Không có sẵn. Có thể debounce signal nguồn bằng `toSignal(toObservable(x).pipe(debounceTime(300)))` như trang Thuê bao. |
| Sao không `filter(term => term.length >= 3)`? | `filter` không phát gì → `switchMap` không hủy request đang chạy, kết quả cũ vẫn hiện. Phát `idle` thì hủy và xóa. |
| `shareReplay` có rò bộ nhớ không? | `refCount: false` giữ kết quả và subscription nguồn tới khi service bị hủy. Với service `providedIn: 'root'` là cả vòng đời app. Dùng cho dữ liệu nhỏ, ít đổi. |
| Marble test có quá khó cho team? | Chỉ cần cho logic thời gian (debounce, hủy, retry). Phần còn lại test bình thường. Một file ví dụ tốt là đủ để team chép theo. |
| `takeUntilDestroyed` hay `toSignal`? | Kết quả là state template đọc → `toSignal`. Side effect (gọi API ghi, điều hướng) → `takeUntilDestroyed`. |
| Server có dừng truy vấn khi client hủy không? | Thường không: request đã tới thì backend chạy tới hết. Hủy giúp client không xử lý kết quả cũ và giảm kết nối đang mở. |

## Lỗi thường gặp khi làm lab

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Không thấy request cũ về muộn | Chưa bật `DEMO_SLOW_SHORT_QUERY`, hoặc dừng gõ quá lâu sau `0900` (request kịp về) | Bật chế độ demo; gõ `123` trong vòng 1 giây sau khi dừng |
| `expectSubscriptions` rỗng | `search` tạo `cold` mới mỗi lần | Tạo `slow`/`fast` trước, trả về cùng instance |
| Marble lệch 1ms | Quên mỗi giá trị chiếm 1 khung | `'300ms x 400ms y'`: `y` ở 701, không phải 700 |
| `TypeError: lookup(...) is not a function` trong test cũ | Đổi chữ ký thành object nhưng test gọi `lookup(search, 300)` | `lookup(search, { debounceMs: 300 })` |
| Test lỗi vẫn đỏ sau khi chuyển `catchError` | Đặt `catchError` trước `startWith` | Thứ tự: `map`, `startWith`, `catchError` (lỗi xảy ra sau `loading`) |
| `NG0203: toSignal() can only be used within an injection context` | Gọi `toSignal` trong method | Khai báo ở field hoặc trong constructor |
| Test picker treo hoặc timeout | `vi.useFakeTimers()` trước `whenStable()` | Bật fake timers sau khi render xong |
| `pending[0]` là `undefined` | Quên `vi.advanceTimersByTime(300)` (debounce chưa phát) | Tiến đồng hồ đủ thời gian debounce |

## Sau buổi học

- Giao bài tập về nhà: [../bai-tap-ve-nha/buoi-03-signals-va-rxjs.html](../bai-tap-ve-nha/buoi-03-signals-va-rxjs.html) (khoảng 30 phút, nộp trước buổi 4).
- Thu `docs/bang-chon-operator.md` của các nhóm; chọn ví dụ dự án thật hay nhất để mở đầu buổi 4.
- Buổi 4 bắt đầu từ `session04-start` = `session03-end` + phần chuẩn bị.
