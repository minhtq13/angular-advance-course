# Đáp án lab buổi 5

## Áp đáp án vào code

Trong thư mục gốc repo, từ `session05-start`:

```bash
git apply course/session-05/solution/bai2-virtual-scroll.patch
git apply course/session-05/solution/bai3-change-detection.patch
git apply course/session-05/solution/bai4-ro-bo-nho.patch
git apply course/session-05/solution/bai1-5-quy-trinh-do-va-benchmark.patch
```

Gỡ theo thứ tự ngược lại. Bản đã áp đủ là nhánh `session05-end`.

Đã kiểm tra: sau **từng** patch, `nx run-many -t lint test build` pass (16 project); áp đủ ra đúng `session05-end`, gỡ ra về đúng
`session05-start`. Mọi số đo dưới đây đo thật trên trình duyệt với backend thật, bằng `apps/portal-e2e/src/perf/report.perf.spec.ts`.

---

## Bài 1 — Baseline

Số đo của giảng viên (Apple M4, Chromium headless, **dev build**, 10.000 dòng, payload 2,93 MB):

| | 1× | 4× |
|---|---|---|
| Lần đầu chọn 10.000 dòng | 1.181 ms | 3.394 ms |
| Tải lại (3 lần) | 933 / 1.104 / 1.046 ms | 3.746 / 4.467 / 4.120 ms |
| Node DOM | 100.167 | 100.167 |
| Ngồi yên 5 giây (script) | 150 ms | 247 ms |
| Heap trước → sau 20 lần điều hướng | 50,3 → 96,8 MB | |

Console dev mode: `NG0956: The configured tracking expression (track by identity) caused re-creation of the entire collection of size 10000`.

Số của học viên sẽ khác (máy, Chrome có giao diện, DevTools mở). Điểm chấm là **quy trình**: điều kiện ghi đủ, đo lặp lại, ghi dữ liệu thô.

## Bài 2 — Virtual scroll

| File | Thay đổi |
|---|---|
| `subscriber-report.page.html` | Tiêu đề ngoài viewport; `cdk-virtual-scroll-viewport` + `*cdkVirtualFor`; `role="table/row/cell"`, `aria-rowcount`, `aria-rowindex` |
| `subscriber-report.page.scss` | Lưới CSS, `$row-height: 33px`, viewport có chiều cao, biến thể `.compact` |
| `subscriber-report.page.ts` | `ScrollingModule`, `rowHeight = 33` |
| `subscriber-report.page.spec.ts` | `aria-rowcount` = 1001, số dòng trong DOM < 100 |

Kết quả (4×): lần đầu 473 ms, tải lại 138–166 ms, DOM 357 node. Payload **không đổi** (vẫn 2,93 MB).

## Bài 3 — Change detection

- `shift-clock.ts`: `toSignal(interval(1000).pipe(map(() => new Date())))`, tự hủy.
- `report-row.ts`: `toReportRow`, `ageOn` (hàm thuần, test `it.each`); trang dùng `rows = computed(...)` map một lần.
- Template: `s.age`, `s.typeKey | transloco`, `s.statusKey | transloco`, `s.activatedAt | translocoDate: dateFormat`; `trackBy: trackById`.

Kết quả sau virtual scroll: ngồi yên 5 giây 6–9 → 4 ms (nhỏ vì chỉ còn ~20 dòng).

**Đối chứng** (bảng DOM thường + chỉ sửa đổi Bài 3, đo riêng để rút kết luận có điều kiện):

| | 1× | 4× |
|---|---|---|
| Ngồi yên 5 giây | 150 → **9 ms** | 247 → **6 ms** |
| Tải lại | 917–967 ms (gần như không đổi) | 3.518–3.563 ms |
| Lần đầu | 2.780 ms (**chậm hơn** 1.181) | 9.213 ms |

Giải thích: tách đồng hồ loại bỏ việc kiểm tra cả trang mỗi giây. `track` theo id không làm tải lại nhanh hơn vì chi phí chính là kiểm tra
lại 10.000 dòng binding/pipe. Pipe `translocoDate` ở từng dòng đắt khi vẽ đủ 10.000 dòng: nếu buộc vẽ đủ, tính sẵn chuỗi ngày trong view model.

## Bài 4 — Rò bộ nhớ

Retainer path mong đợi: `Window` → (event listeners) → handler `resize` (closure của `debounceTime`/subscriber) → `SubscriberReportPage`
→ `result`/`rows` → mảng thuê bao; với bảng DOM thường thêm `Detached HTMLTableRowElement` hàng nghìn.

```ts
protected readonly compact = toSignal(
  fromEvent(window, 'resize').pipe(debounceTime(200), map(() => window.innerWidth < 1200)),
  { initialValue: window.innerWidth < 1200 },
);
```

Heap sau 20 lần điều hướng: +11 MB (sau Bài 2–3) → **+2 MB** (24,7 → 26,7 MB, nhiễu/cache).

Lưu ý: `setInterval` của đồng hồ cũng là rò (giữ trang qua closure). Bài 3 đã xử lý bằng `toSignal(interval(...))`. Nếu học viên làm Bài 4
trước Bài 3, phải sửa cả hai mới thấy heap ngừng tăng.

## Bài 5 — Kết luận

Bản mẫu: `docs/benchmark-buoi-05.md` (trong patch cuối), gồm điều kiện đo, bảng dữ liệu thô 10 dòng (cả đối chứng) và 5 kết luận có điều kiện.

Điểm chấm:
- Mỗi kết luận có **điều kiện** ("khi…", "không áp dụng khi…").
- Có ít nhất một kết luận "thay đổi này **không** giúp" có số đo chứng minh (vd `track` theo id với tải lại).
- Không suy từ một lần đo; không so sánh số đo ở hai điều kiện khác nhau.
