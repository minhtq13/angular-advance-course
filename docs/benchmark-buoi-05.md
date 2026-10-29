# Benchmark buổi 5: màn hình Báo cáo thuê bao

**Câu hỏi:** tải và hiển thị 10.000 thuê bao trên một màn hình tốn bao nhiêu, và mỗi thay đổi giúp được bao nhiêu, trong điều kiện nào?

## Điều kiện đo

| | |
|---|---|
| Thiết bị | Apple M4, 10 nhân, 16 GB RAM, macOS 26.7.1 |
| Trình duyệt | Chromium headless của Playwright 1.64.1 (bản 1248) |
| CPU throttle | 1× (không làm chậm) và 4× (giả lập máy yếu), qua Chrome DevTools Protocol |
| Build | **Development** (`nx serve`), đo trên máy giảng viên. Bản production nhanh hơn; xu hướng giữ nguyên |
| Dữ liệu | 10.000 thuê bao đầu tiên theo id (dump 200.000 thuê bao), payload JSON 2,93 MB (chưa nén) |
| Backend | Docker cục bộ, `MAX_PAGE_SIZE=10000` |
| Thao tác đo | (1) Lần đầu chọn 10.000 dòng: từ lúc bấm tới khi hiện "10.000 thuê bao" + 2 frame. (2) "Tải lại" 3 lần: từ lúc bấm tới khi có response + 4 frame. (3) Ngồi yên 5 giây: `ScriptDuration`, `RecalcStyleDuration`, `LayoutDuration`. (4) Heap (`JSHeapUsedSize` sau 2 lần GC) trước và sau 20 lần Báo cáo ↔ Danh sách |
| Công cụ | `apps/portal-e2e/src/perf/report.perf.spec.ts` (`PERF=1`), lặp lại được |

## Dữ liệu thô

| Phiên bản | CPU | Lần đầu (ms) | Tải lại 1/2/3 (ms) | Node DOM | Ngồi yên 5 giây: script / style (ms) | Heap trước → sau 20 lần (MB) |
|---|---|---|---|---|---|---|
| Điểm bắt đầu (bảng DOM thường) | 1× | 1.181 | 933 / 1.104 / 1.046 | 100.167 | 150 / 0 | 50,3 → 96,8 |
| Điểm bắt đầu | 4× | 3.394 | 3.746 / 4.467 / 4.120 | 100.167 | 247 / 0 | 50,3 → 96,8 |
| + Bài 2 (virtual scroll) | 1× | 446 | 151 / 150 / 150 | 357 | 6 / 2 | 31,6 → 42,6 |
| + Bài 2 | 4× | 473 | 151 / 166 / 138 | 357 | 9 / 1 | 31,6 → 42,6 |
| + Bài 3 (tách đồng hồ, view model, `track` id) | 1× | 381 | 150 / 150 / 134 | 357 | 4 / 4 | 31,3 → 42,6 |
| + Bài 3 | 4× | 490 | 167 / 166 / 150 | 357 | 4 / 1 | 31,2 → 42,6 |
| + Bài 4 (gỡ listener `resize`) | 1× | 447 | 150 / 133 / 133 | 357 | 3 / 4 | 24,7 → 26,7 |
| + Bài 4 | 4× | 458 | 167 / 150 / 150 | 357 | 4 / 3 | 24,7 → 26,7 |
| *Đối chứng: bảng DOM thường + chỉ Bài 3* | 1× | 2.780 | 967 / 933 / 917 | 100.167 | 9 / 0 | 55,7 → 109,5 |
| *Đối chứng: bảng DOM thường + chỉ Bài 3* | 4× | 9.213 | 3.563 / 3.532 / 3.518 | 100.167 | 6 / 0 | 55,7 → 109,5 |

Số đo một lần chạy cho mỗi dòng (3 lần cho "tải lại"). Chênh lệch dưới khoảng 20 ms coi là nhiễu.

## Kết luận và điều kiện áp dụng

1. **Virtual scroll là thay đổi lớn nhất** khi người dùng chỉ *xem* danh sách dài: tải lại 10.000 dòng từ khoảng 1 giây (4 giây trên máy yếu)
   xuống khoảng 150 ms, DOM từ 100.167 xuống 357 node. **Điều kiện:** các dòng cùng chiều cao; chấp nhận không có `Ctrl+F` của trình duyệt
   trên dòng chưa vẽ; vẫn tải đủ 2,93 MB. Nếu người dùng không cần cuộn qua hàng nghìn dòng thì **phân trang server** (trang Thuê bao)
   còn rẻ hơn: payload vài chục kB.
2. **Tách phần cập nhật liên tục ra component riêng** (đồng hồ) giảm CPU khi ngồi yên với DOM lớn từ 150 ms xuống 9 ms mỗi 5 giây
   (đối chứng). Sau khi đã virtual scroll, lợi ích còn nhỏ (6 → 4 ms) vì chỉ còn khoảng 20 dòng.
3. **`track` theo id một mình không làm tải lại nhanh hơn** khi vẫn vẽ 10.000 dòng (đối chứng: 917–967 ms so với 933–1.104 ms): chi phí
   chính là kiểm tra lại 10.000 dòng có pipe `transloco` không thuần, không phải dựng lại DOM. Angular vẫn cảnh báo `NG0956` cho
   `track` theo object; nên sửa vì đúng, không phải vì nhanh hơn trong trường hợp này.
4. **Định dạng ngày theo ngôn ngữ bằng pipe ở từng dòng có giá:** đối chứng vẽ đủ 10.000 dòng chậm hơn ở lần đầu (2.780 so với 1.181 ms).
   Với virtual scroll thì không đáng kể. Nếu buộc phải vẽ đủ (in, xuất), tính sẵn chuỗi ngày trong view model theo ngôn ngữ đang chọn.
5. **Rò bộ nhớ:** listener `resize` không gỡ giữ trang và dữ liệu sau mỗi lần điều hướng: +46,5 MB (bảng DOM, giữ cả node DOM đã tách)
   và +11 MB (virtual scroll) sau 20 lần. Sau khi gỡ: +2 MB (nhiễu, cache). Heap snapshot: đường giữ đi từ `Window` → listener →
   `SubscriberReportPage` → mảng dữ liệu.
