# Buổi 03 — Signals và RxJS cho luồng dữ liệu

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Điểm bắt đầu:** `git checkout session03-start` · **Đáp án:** 3 patch trong `solution/`, bản đầy đủ ở nhánh `session03-end`

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

Form tạo phiếu (buổi 2) bắt gõ **mã thuê bao** dạng số. Buổi 3 thay bằng **ô chọn thuê bao có tìm kiếm** (`care-subscriber-picker`,
cài `ControlValueAccessor`). Giao diện nối sẵn ở `session03-start`; logic nằm trong hàm `lookup()` và có 4 vấn đề cố ý:

| # | Vấn đề | Bài |
|---|---|---|
| 1 | `mergeMap`: kết quả từ khóa cũ về muộn ghi đè kết quả mới | 2–3 |
| 2 | Không `trim`, `distinctUntilChanged`, độ dài tối thiểu, trạng thái đang tìm | 3 |
| 3 | `catchError` ngoài: lỗi một lần, luồng chết | 4 |
| 4 | `subscribe()` trần trong constructor: rời màn hình không hủy | 5 |

Tái hiện trên trình duyệt bằng chế độ demo của backend: `DEMO_SLOW_SHORT_QUERY=true` làm từ khóa tìm thuê bao dưới 5 ký tự chậm 2 giây.

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Đọc pipeline, vẽ marble, dự đoán 4 vấn đề; so sánh với `rxResource` ở trang Thuê bao | 15 |
| 2 | Tái hiện truy vấn cũ về muộn trên trình duyệt; viết test marble đỏ | 30 |
| 3 | `switchMap`, `trim`, `distinctUntilChanged`, độ dài tối thiểu, `loading`; test hủy; `docs/bang-chon-operator.md` | 30 |
| 4 | `catchError` trong `switchMap`; test lỗi rồi gõ tiếp | 25 |
| 5 | `toSignal` thay `subscribe()`; test `observed` sau khi hủy component | 20 |

## Liên kết code

| Khái niệm | File |
|---|---|
| Pipeline tìm kiếm (trọng tâm lab) | `frontend/libs/portal/feature-tickets/src/lib/subscriber-picker/lookup.ts` + `lookup.spec.ts` |
| Ô chọn thuê bao, `ControlValueAccessor` | `frontend/libs/portal/feature-tickets/src/lib/subscriber-picker/subscriber-picker.ts` |
| `rxResource` + `linkedSignal` (đối chiếu) | `frontend/libs/portal/feature-subscribers/src/lib/subscriber-list/subscriber-list.page.ts` |
| Debounce bằng `toSignal(toObservable(...))` | cùng file trên, `debouncedKeyword` |
| Chế độ demo chậm | `backend/.../subscriber/SubscriberService.java`, `application.yml` (`care.demo.slow-short-query`), `infra/docker-compose.yml` |

## Đã chuẩn bị ở `session03-start`

- Đáp án buổi 2 đã áp (`session02-end`).
- Backend: `care.demo.slow-short-query` (biến môi trường `DEMO_SLOW_SHORT_QUERY`, mặc định tắt).
- Frontend: `SubscriberPicker` thay ô nhập mã thuê bao trong form tạo phiếu; `lookup()` có 4 vấn đề cố ý; key i18n vi/en cho ô chọn;
  test form và spec E2E `ticket-flow` đã cập nhật theo ô chọn mới.

## Tài liệu

| | |
|---|---|
| Slide | [slides/slides.md](slides/slides.md) (nguồn Marp) · `buoi-03-signals-va-rxjs.pptx` · `buoi-03-signals-va-rxjs.pdf` |
| Lab | [lab/README.md](lab/README.md) |
| Đáp án | [solution/README.md](solution/README.md) + 3 file `.patch` |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) · [note-cho-giang-vien.md](note-cho-giang-vien.md) |
| Bài tập về nhà | [../bai-tap-ve-nha/buoi-03-signals-va-rxjs.html](../bai-tap-ve-nha/buoi-03-signals-va-rxjs.html) |

## Sửa slide

```bash
cd course/session-03/slides
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-03-signals-va-rxjs.pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-03-signals-va-rxjs.pdf
```
