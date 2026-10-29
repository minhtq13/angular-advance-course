# Lab buổi 5 — Hiệu năng và quản lý bộ nhớ

**Thời gian:** 120 phút · **Điểm xuất phát:** `git checkout session05-start`

**Use case.** Trưởng nhóm CSKH dùng màn hình **Báo cáo thuê bao** (`/subscribers/report`, nút **Báo cáo** ở trang Thuê bao) để xem
1.000–10.000 thuê bao. Phàn nàn: chọn 10.000 dòng phải chờ, bấm Tải lại cũng chờ, mở báo cáo vài lần thì trình duyệt ì.
Lab này **đo trước**, sửa từng thứ một, đo lại, và viết kết luận có điều kiện.

**Sản phẩm nộp cuối buổi:** `docs/benchmark-buoi-05.md` (điều kiện đo, dữ liệu thô, kết luận có điều kiện), ảnh profile trước/sau
(Performance và Angular DevTools), ảnh heap snapshot trước/sau.

Trước khi bắt đầu:
```bash
git checkout session05-start
# Cho phép tải 10.000 dòng một lần (mặc định server giới hạn 200)
MAX_PAGE_SIZE=10000 docker compose -f infra/docker-compose.yml up -d --build api
cd frontend && npm ci && npm start
```
Cài **Angular DevTools** (Chrome Web Store) trước buổi học. Dùng Chrome, cửa sổ ẩn danh, tắt các extension khác khi đo.

> Sau buổi học: `docker compose -f infra/docker-compose.yml up -d api` để về giới hạn 200.

---

## Bài 1 — Baseline (25 phút)

1. Mở `docs/benchmark-buoi-05.md` (tạo mới theo mẫu `course/_templates/benchmark.md`). Điền **điều kiện đo**: máy, Chrome, CPU throttle,
   build (dev), dữ liệu (10.000 dòng đầu theo id), thao tác bắt đầu/kết thúc.
2. **Console:** chọn 10.000 dòng, bấm **Tải lại**. Ghi lại cảnh báo `NG0956`.
3. **Performance** (DevTools → Performance, CPU **4× slowdown**): record từ lúc bấm **Tải lại** tới khi bảng vẽ xong, 3 lần. Ghi thời gian
   long task và phần scripting/rendering. Chụp màn hình một lần.
4. **Performance monitor** (DevTools → ⋮ → More tools): ghi số **DOM Nodes** khi có 10.000 dòng; ngồi yên 5 giây, quan sát
   **CPU usage** và **Style recalcs/sec**.
5. **Network:** ghi kích thước response `?size=10000` (cả "transferred" và "resource").
6. Ghi tất cả vào bảng dữ liệu thô. Không làm tròn, không bỏ lần đo "xấu".

> Tùy chọn: đáp án có kịch bản đo tự động `apps/portal-e2e/src/perf/report.perf.spec.ts` (nhánh `session05-end`). Chạy được trên điểm bắt
> đầu bằng cách chép file sang.

---

## Bài 2 — Virtual scroll (35 phút)

1. Thay `<table>` bằng `cdk-virtual-scroll-viewport` (`@angular/cdk/scrolling`, đã cài cùng ng-zorro):
   - Một dòng tiêu đề **ngoài** viewport; các dòng dữ liệu là `div.report-row` với `*cdkVirtualFor`.
   - Lưới CSS (`display: grid`) cho cột; mọi dòng **cùng chiều cao** 33px; `[itemSize]="rowHeight"` với `rowHeight = 33` trong component.
   - Viewport có chiều cao (`calc(100vh - 320px)`).
   - Giữ ngữ nghĩa bảng: `role="table"` + `aria-rowcount` ở khung ngoài, `role="row"` + `aria-rowindex`, `role="columnheader"`, `role="cell"`.
2. Cập nhật test: bảng vẫn báo `aria-rowcount="1001"` nhưng số dòng trong DOM nhỏ hơn 100.
3. Đo lại như Bài 1. So sánh với trang **Thuê bao** (phân trang server, 20 dòng): payload, DOM, thời gian.
4. Ghi vào bảng: virtual scroll đổi được gì, **không** đổi được gì (payload?), mất gì (Ctrl+F, in).

---

## Bài 3 — Change detection (25 phút)

1. **Angular DevTools → Profiler:** record, ngồi yên 3 giây, stop. Mỗi giây có một lần change detection; component nào tốn? Chụp màn hình.
2. Sửa:
   - Tách đồng hồ ca trực thành `ShiftClock` (`care-shift-clock`), dùng `toSignal(interval(1000).pipe(map(() => new Date())), ...)`.
     Xóa `setInterval` khỏi trang.
   - Tạo `report-row.ts`: `toReportRow(s, today)` tính sẵn `age`, `typeKey`, `statusKey`; `rows` là `computed` map một lần.
     Template chỉ đọc thuộc tính, không gọi method.
   - Ngày kích hoạt dùng pipe `translocoDate` (đổi ngôn ngữ sang EN để thấy lỗi của bản cũ: `toLocaleDateString('vi-VN')` cứng).
   - `trackBy` theo `id`.
   - Test `ageOn` bằng `it.each` (đúng ngày sinh nhật, ngày mai mới sinh nhật, 29/2).
3. Profile lại: mỗi giây chỉ `ShiftClock` được kiểm tra. Chụp màn hình.

---

## Bài 4 — Rò bộ nhớ (25 phút)

1. **Heap snapshot theo 3 bước** (DevTools → Memory):
   - Ở trang Thuê bao, bấm GC (biểu tượng thùng rác), **Snapshot 1**.
   - Báo cáo ↔ Thuê bao **20 lần**, dùng nút trong app (**không F5**). GC, **Snapshot 2**.
   - Thêm 20 lần, GC, **Snapshot 3**. Chọn Snapshot 3, chế độ **Comparison** với Snapshot 2.
2. Lọc `SubscriberReportPage`: `# New` bao nhiêu? Chọn một instance → **Retainers**: đọc đường giữ ngược tới `Window`. Chụp màn hình.
3. **Test đỏ:** trong `subscriber-report.page.spec.ts`, `vi.spyOn(window, 'removeEventListener')`, tạo component, `fixture.destroy()`,
   mong đợi đã gọi `removeEventListener('resize', ...)`.
4. **Sửa:** `compact = toSignal(fromEvent(window, 'resize').pipe(debounceTime(200), map(...)), { initialValue: ... })`. Xóa constructor.
5. Làm lại bước 1: `SubscriberReportPage` không còn tăng theo số lần điều hướng. Ghi heap trước/sau vào bảng.

---

## Bài 5 — Kết luận có điều kiện (10 phút)

Viết 3–5 kết luận trong `docs/benchmark-buoi-05.md`. Mỗi kết luận theo dạng:
**"[Thay đổi] giảm [chỉ số] từ X xuống Y khi [điều kiện]; không áp dụng khi [điều kiện]."**

Gợi ý câu hỏi:
- Virtual scroll có làm payload nhỏ đi không? Khi nào phân trang server tốt hơn?
- Sau khi đã virtual scroll, tách đồng hồ còn đáng không? Còn nếu buộc phải vẽ đủ 10.000 dòng (in)?
- `track` theo id có làm "Tải lại" nhanh hơn không? Vì sao (gợi ý: đo trên bảng DOM thường)?

---

## Kiểm tra cuối lab

```bash
npx nx run-many -t lint test build
```

## Review chéo (20 phút)

Mỗi nhóm 5 phút: bảng dữ liệu thô (điều kiện đo có đủ không?), một kết luận có điều kiện, ảnh retainer path. Nhóm khác hỏi:
"Nếu đo trên máy khác / dữ liệu khác, kết luận này còn đúng không?"

## Đáp án

Đáp án nằm trong [`../solution/`](../solution/). Chỉ mở sau khi đã tự làm.
