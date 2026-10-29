# Lab buổi 3 — Signals và RxJS cho luồng dữ liệu

**Thời gian:** 120 phút · **Điểm xuất phát:** `git checkout session03-start`

**Use case.** Form tạo phiếu giờ có ô chọn thuê bao có tìm kiếm (`care-subscriber-picker`). Giao diện đã nối sẵn; toàn bộ logic tìm kiếm nằm
trong hàm `lookup()` (`libs/portal/feature-tickets/src/lib/subscriber-picker/lookup.ts`) và đang có **4 vấn đề cố ý**. Lab này
tái hiện từng vấn đề, viết test đỏ trước, rồi sửa.

**Sản phẩm nộp cuối buổi:** pipeline tìm kiếm có hủy, bộ test marble theo trình tự sự kiện, file `docs/bang-chon-operator.md`.

Trước khi bắt đầu:
```bash
git checkout session03-start
# Bật chế độ demo: từ khóa tìm thuê bao dưới 5 ký tự trả về chậm 2 giây
DEMO_SLOW_SHORT_QUERY=true docker compose -f infra/docker-compose.yml up -d --build api
cd frontend && npm ci && npm start
```
Đăng nhập `agent1`, mở **Phiếu yêu cầu → Tạo phiếu**. Tất cả lệnh `nx` chạy trong `frontend/`.
Chạy test của lib: `npx nx test portal-feature-tickets` (thêm `--watch` khi đang sửa).

> Sau buổi học, tắt chế độ demo: `docker compose -f infra/docker-compose.yml up -d api` (không có biến môi trường).

---

## Bài 1 — Đọc pipeline và vẽ marble (15 phút)

1. Đọc `lookup.ts` và hàm khởi tạo trong `subscriber-picker.ts`.
2. Trên giấy, vẽ marble cho tình huống: gõ `0900`, sau 400ms gõ tiếp thành `0900123`. Biết `0900` mất 2 giây, `0900123` mất 100ms.
   Vẽ 4 dòng: từ khóa, sau `debounceTime`, request `0900`, request `0900123`, và dòng **kết quả ra** với code hiện tại.
3. Ghi ra 4 vấn đề bạn thấy (gợi ý: thứ tự kết quả, request thừa, lỗi, vòng đời subscription). Mỗi vấn đề: hậu quả người dùng thấy là gì.
4. So sánh với trang **Thuê bao** (`subscriber-list.page.ts`): trang đó dùng `rxResource`. Đổi bộ lọc liên tục, request cũ có bị hủy không?
   Vì sao ô chọn thuê bao không dùng luôn `rxResource`?

---

## Bài 2 — Tái hiện truy vấn cũ trả về muộn (30 phút)

### 2.1 Trên trình duyệt

1. DevTools → Network, lọc `subscribers`.
2. Trong ô Thuê bao: gõ `0900`, dừng khoảng nửa giây, gõ tiếp `123`.
3. Đợi 3 giây. Danh sách hiện thuê bao bắt đầu bằng gì? Trong tab Network, hai request `?q=0900` và `?q=0900123` kết thúc theo thứ tự nào,
   status bao nhiêu? Chụp màn hình.

### 2.2 Bằng test (viết test đỏ)

Mở `lookup.spec.ts`. Đã có một test mẫu dùng `TestScheduler`. Thêm test:

```ts
it('tu khoa cu tra ve muon khong ghi de ket qua moi, va request cu bi huy', () => {
  scheduler.run(({ cold, hot, expectObservable, expectSubscriptions }) => {
    const slow = cold('1000ms (r|)', { r: ['0901'] });
    const fast = cold('100ms (r|)', { r: ['09012345'] });
    const search = (term: string) => (term === '0901' ? slow : fast);
    const terms = hot('a 400ms b', { a: '0901', b: '09012345' });

    expectObservable(terms.pipe(lookup(search))).toBe(/* bạn tính */);
    expectSubscriptions(slow.subscriptions).toBe(/* bạn tính */);
  });
});
```

- Tự tính chuỗi marble mong đợi từ hình vẽ ở Bài 1: mỗi giá trị chiếm 1ms; `'300ms x 400ms y'` nghĩa là `x` ở 300ms, `y` ở 701ms.
- Kết quả mong đợi sau khi sửa (Bài 3) gồm trạng thái `loading` rồi `done`, nên test này **đỏ** ngay bây giờ. Đọc thông báo lỗi:
  có giá trị `done('0901')` ở 1300ms, và `slow` không bao giờ bị hủy.

> Tạo `cold(...)` **trước** rồi trả về cùng instance trong `search`. Nếu `search` tạo `cold` mới mỗi lần gọi thì `slow.subscriptions` luôn rỗng.

---

## Bài 3 — `switchMap` và lọc sự kiện thừa (30 phút)

1. Sửa `lookup()`:
   - `map((term) => term.trim())` → `debounceTime(debounceMs)` → `distinctUntilChanged()` → `switchMap(...)`.
   - Đổi tham số thứ hai thành object `{ debounceMs = 300, minLength = 3 }: LookupOptions = {}`.
   - Trong `switchMap`: từ khóa ngắn hơn `minLength` → `of(idleLookup(term))` (vẫn phát, để **hủy** request đang chạy và xóa kết quả cũ);
     ngược lại `search(term)` + `map` sang `done` + `startWith(loading)`.
2. Test phải xanh. Thêm 2 test:
   - `'0901'` rồi `' 0901 '` (cách 400ms) → chỉ gọi `search` **một** lần.
   - `'09'` → phát `idle`, không gọi `search` (dùng `vi.fn()`).
3. Cập nhật test mẫu ban đầu: giờ có thêm `loading` trước `done`.
4. Kiểm tra lại trên trình duyệt: request `?q=0900` hiện *(canceled)*, danh sách đúng từ khóa cuối.
5. Viết `docs/bang-chon-operator.md`: bảng 4 dòng (`switchMap`, `concatMap`, `exhaustMap`, `mergeMap`) × 4 cột
   (*sự kiện mới đến khi request cũ chưa xong*, *dùng cho*, *rủi ro nếu chọn sai*, *ví dụ trong Care Portal*).

---

## Bài 4 — Luồng sống sau lỗi (25 phút)

1. **Thấy lỗi:** DevTools → Network → **Offline**. Gõ một từ khóa (≥ 3 ký tự). Bật lại **No throttling**, gõ từ khóa khác.
   Danh sách có cập nhật không? Có request mới không?
2. **Test đỏ:** thêm test: `search('0901')` trả về `cold('50ms #')` (lỗi), `search('0902')` trả về kết quả; từ khóa `0901` rồi 400ms sau `0902`.
   Mong đợi: `loading(0901)`, `error(0901)`, `loading(0902)`, `done(0902)`. Với `catchError` ở ngoài, test đỏ: luồng hoàn tất sau lỗi.
3. **Sửa:** chuyển `catchError` vào **trong** `switchMap` (sau `startWith`), trả về `{ status: 'error', term, items: [] }` (giữ `term`).
4. Kiểm tra lại bằng Offline/Online trên trình duyệt. Ô chọn hiện "Không tìm được. Gõ tiếp để thử lại."

Câu hỏi: nên thêm `retry` không? Nếu có, đặt ở đâu, thử mấy lần, và vì sao **không** retry lệnh tạo phiếu theo cách này?

---

## Bài 5 — Teardown khi rời màn hình (20 phút)

1. **Test đỏ:** tạo `subscriber-picker.spec.ts`:
   - Host component `<care-subscriber-picker [formControl]="control" />`.
   - `SubscriberApi` giả: `search()` trả về một `Subject` mới và lưu vào mảng `pending` (test tự quyết định khi nào "server" trả lời).
   - Sau `await fixture.whenStable()`, bật `vi.useFakeTimers()`; gọi `onSearch('0901')`; `vi.advanceTimersByTime(300)`;
     `expect(pending[0].observed).toBe(true)`; `fixture.destroy()`; `expect(pending[0].observed).toBe(false)`.
   - Thêm một test chọn kết quả → `control.value` là id thuê bao.

   Với `subscribe()` trần trong constructor, assertion cuối đỏ: request vẫn có người lắng nghe sau khi component bị hủy.
2. **Sửa:** bỏ constructor, đổi `state` thành
   ```ts
   protected readonly state = toSignal(this.terms.pipe(lookup((term) => this.search(term))), {
     initialValue: idleLookup<SubscriberOption>(),
   });
   ```
3. **Kiểm tra trên trình duyệt:** gõ `0900` (chậm 2 giây), bấm **Hủy** ngay → request chuyển *(canceled)*.

> `toSignal` phải gọi trong injection context (khai báo field hoặc constructor). Gọi trong method sẽ báo `NG0203`.

---

## Kiểm tra cuối lab

```bash
npx nx run-many -t lint test build
```

## Review chéo (20 phút)

Mỗi nhóm trình bày 5 phút:
1. Marble vẽ tay ở Bài 1 so với chuỗi marble trong test: chỗ nào vẽ sai?
2. Bảng chọn operator: một ví dụ từ **dự án thật** của nhóm cho mỗi operator.
3. Ảnh Network trước/sau (request *(canceled)*) và câu trả lời về `retry`.

## Đáp án

Đáp án nằm trong [`../solution/`](../solution/). Chỉ mở sau khi đã tự làm.
