# Đáp án lab buổi 3

## Áp đáp án vào code

Trong thư mục gốc repo, từ `session03-start`:

```bash
git apply course/session-03/solution/bai2-3-switchmap-va-test-thu-tu.patch
git apply course/session-03/solution/bai4-luong-song-sau-loi.patch
git apply course/session-03/solution/bai5-huy-dang-ky.patch
```

Gỡ theo thứ tự ngược lại. Bản đã áp đủ là nhánh `session03-end`.

Đã kiểm tra:
- Sau **từng** patch, `nx run-many -t lint test build` pass (16 project).
- Test mới của mỗi bài **đỏ** trên code trước khi sửa và **xanh** sau khi sửa.
- Trên trình duyệt thật với `DEMO_SLOW_SHORT_QUERY=true`: gõ `0900` rồi `0900123`, điểm bắt đầu hiện kết quả `0900200000…`
  (của `0900`), sau Bài 3 hiện `0900123999…` (đúng từ khóa cuối).

---

## Bài 1 — Marble và 4 vấn đề

```
từ khóa     a ──────── b                     a = "0900" (t=0), b = "0900123" (t=401)
debounce    ──300── a ──────── b             a phát lúc 300, b lúc 701
req(a)              └───────2000ms──────── A (2300)
req(b)                         └─100ms─ B (801)
mergeMap    ─────────────────── B ─────────── A      ← A cuối cùng: danh sách sai
switchMap   ─────────────────── B                    ← req(a) bị hủy lúc 701
```

| # | Vấn đề | Hậu quả |
|---|---|---|
| 1 | `mergeMap` | Kết quả của từ khóa cũ về muộn ghi đè kết quả mới |
| 2 | Không `trim`, `distinctUntilChanged`, độ dài tối thiểu | Gọi API thừa; `"09"` quét gần cả bảng, chậm |
| 3 | `catchError` ngoài | Lỗi đầu tiên làm luồng hoàn tất, gõ tiếp không tìm nữa |
| 4 | `subscribe()` trần trong constructor | Rời màn hình khi đang tìm: request vẫn chạy, callback vẫn ghi vào component đã hủy |

Câu 4: `rxResource` của trang Thuê bao **đã** hủy stream cũ khi `params` đổi (hành vi giống `switchMap`). Ô chọn thuê bao cần debounce,
độ dài tối thiểu, trạng thái `idle/loading/done/error` tùy biến và test bằng thời gian ảo, nên viết bằng RxJS rõ ràng hơn.

## Bài 2–3 — `switchMap` và test thứ tự

```ts
return (terms) =>
  terms.pipe(
    map((term) => term.trim()),
    debounceTime(debounceMs),
    distinctUntilChanged(),
    switchMap((term) =>
      term.length < minLength
        ? of(idleLookup<T>(term))
        : search(term).pipe(
            map((items): LookupState<T> => ({ status: 'done', term, items })),
            startWith<LookupState<T>>({ status: 'loading', term, items: [] }),
          ),
    ),
    catchError(...),   // vẫn ở ngoài, sửa ở Bài 4
  );
```

Chuỗi marble mong đợi của test chính:

```ts
expectObservable(terms.pipe(lookup(search))).toBe('300ms x 400ms y 99ms z',
  { x: loading('0901'), y: loading('09012345'), z: done('09012345') });
expectSubscriptions(slow.subscriptions).toBe('300ms ^ 400ms !');
```

Cách tính: `a` ở 0 → debounce phát lúc 300 (`x`). `b` ở 401 (`a` chiếm 1ms + 400ms) → debounce phát lúc 701 (`300ms x` = 301, cộng `400ms`).
`y` ở 701, `fast` trả sau 100ms → `z` ở 801 (`y` chiếm 1ms + `99ms`).

Điểm chấm:
- `trim` đứng trước `distinctUntilChanged`; `debounceTime` đứng trước `switchMap`.
- Từ khóa ngắn vẫn **phát** `idle` (không dùng `filter`), để hủy request đang chạy và xóa kết quả cũ.
- Test viết trước, đỏ đúng lý do (có `done('0901')` lúc 1300ms, `slow` không bị hủy).
- `docs/bang-chon-operator.md` có cột rủi ro, ví dụ trong Care Portal, và mục "xử lý lỗi và hủy". Bản mẫu có trong patch.

## Bài 4 — Luồng sống sau lỗi

```ts
search(term).pipe(
  map((items): LookupState<T> => ({ status: 'done', term, items })),
  startWith<LookupState<T>>({ status: 'loading', term, items: [] }),
  catchError(() => of<LookupState<T>>({ status: 'error', term, items: [] })),
),
```

Test: `'300ms l 49ms e 350ms m 49ms d'` với `l = loading('0901')`, `e = error('0901')`, `m = loading('0902')`, `d = done('0902')`.

Về `retry`: được, đặt **trong** `switchMap` trước `catchError` (vd `retry({ count: 2, delay: 500 })`), chỉ cho lệnh **đọc**.
Lệnh tạo phiếu không retry mù: request có thể đã tới server (buổi 2); nếu retry thì phải giữ cùng `Idempotency-Key`.

## Bài 5 — Teardown

```ts
protected readonly state = toSignal(
  this.terms.pipe(lookup((term) => this.search(term))),
  { initialValue: idleLookup<SubscriberOption>() },
);
```

Assertion chốt của test: sau `fixture.destroy()`, `pending[0].observed` là `false`. Với `subscribe()` trần, giá trị này vẫn là `true`.

Điểm chấm:
- Không còn `subscribe()` nào trong picker ngoài `writeValue` (đã có `takeUntilDestroyed` từ điểm bắt đầu).
- Test dùng `Subject` để điều khiển "server", không dùng `setTimeout` thật.
- `vi.useFakeTimers()` bật **sau** `whenStable()` (render cần timer thật).
