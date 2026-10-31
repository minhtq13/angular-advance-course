# ADR-0004: Hiện đại hóa app cũ trên major đang chạy, nâng major sau, bỏ zone.js khi test chứng minh được

- **Trạng thái:** Đã chấp nhận
- **Ngày:** 2026-10-31
- **Người quyết định:** Nhóm frontend (buổi 10)

## Bối cảnh

`fixtures/legacy-a21` là app Angular 21 viết kiểu cũ (`NgModule`, `*ngIf`, `@Input`, zone.js, `ngx-toastr`, `ngx-pipes`), 7 test. Cần lên Angular 22. Đã thử
"nâng thẳng" trên một bản sao:

- `ng update` dừng: `ngx-toastr` 20.0.5 chỉ nhận `@angular/core ^21.0.0`, không phát hành từ 2026-02-06.
- `--force` qua được trên máy, nhưng `npm ci` từ lockfile báo `ERESOLVE`: CI và máy đồng nghiệp hỏng.
- Lên 22 xong, `ng build` xanh nhưng `ng test` không biên dịch (NG8001, NG8002, NG8004 cho mọi component trong `NgModule`); thêm `import './app-module'`
  vào một spec thì 7/7 xanh lại: builder test của Angular 22 chỉ biên dịch những gì spec import tới.
- Angular 22 đổi mặc định sang `OnPush`. Nâng bằng tay (bỏ migration thêm `ChangeDetectionStrategy.Eager`): dòng "Đã duyệt" không tự ẩn, test đỏ.

## Các phương án đã xem xét

| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| Nâng thẳng 21 → 22 với `--force`, sửa sau | Nhanh trên máy một người | `npm ci` hỏng; test không biên dịch; sửa nhiều thứ cùng lúc, khó biết lỗi từ đâu |
| Hiện đại hóa trên 21 (bỏ thư viện chặn, standalone, control flow, signal), rồi `ng update` | Mỗi checkpoint nhỏ, test xanh, rollback bằng một commit; `ng update` lên 22 không cần `--force` | Nhiều bước hơn; phải sửa spec bằng tay sau migration standalone |
| Giữ Angular 21 | Không tốn công | Hết hỗ trợ theo lịch của Angular; thư viện mới yêu cầu 22 (`ng2-charts` 11, `ngx-mask` 22...) |

## Quyết định

Chọn phương án 2. Zoneless là checkpoint riêng, sau khi đã lên 22: chỉ bỏ zone.js khi có test kiểm hành vi **không gọi `detectChanges`**
(test "tự ẩn dòng Đã duyệt" đỏ khi bỏ zone mà `lastApproved` còn là field thường, xanh khi đổi sang `signal`).

## Hệ quả

- **Tốt:** `ng update` 27 giây, không `--force`, `npm ci` sạch. Bundle ban đầu 377,59 kB (bản cũ) → 297,44 kB (22, zoneless, không `ngx-toastr`).
  Không còn `NgModule`; component tự khai báo `imports`, test biên dịch độc lập.
- **Phải chấp nhận:** tự duy trì `NotificationService` (khoảng 30 dòng); `ngx-pipes` (bỏ rơi từ 2023) vẫn còn, ghi là rủi ro.
- **Cách kiểm chứng:** mỗi checkpoint một commit có test và build xanh; sau `ng update` chạy `rm -rf node_modules && npm ci`; test thông báo và test
  "tự ẩn" chạy không có zone.

## Khi nào xem lại

Khi `ngx-pipes` có vấn đề với Angular 23, hoặc khi áp dụng cách này cho một app thật lớn hơn (có thể cần chia checkpoint theo route, kiểu strangler).
