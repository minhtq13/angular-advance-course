# Buổi 04 — State Management và lựa chọn NgRx

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Trạng thái tài liệu:** đã có khung theo đề cương; chưa soạn slide, lab chi tiết, đáp án.

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Phân biệt local UI, feature, session, URL và server state; xây SignalStore với state, computed và methods; so sánh action, reducer, selector và cách tổ chức Global Store. |
| Use case và lab | Bổ sung reload cùng query, đồng bộ bộ lọc với URL, kiểm tra Back và Forward, làm mới dữ liệu sau thao tác ghi và xóa state khi đổi phiên. |
| Sản phẩm đầu ra | Ma trận lựa chọn state, ADR giải pháp và test tính nhất quán của bộ lọc. |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Phân loại state theo phạm vi, vòng đời, số nơi cập nhật, yêu cầu truy vết: local UI, feature, session, URL, server.
2. Xây `signalStore` (`@ngrx/signals`) với `withState`, `withComputed`, `withMethods`, `rxMethod`, `withHooks`; đặt store ở đúng phạm vi DI.
3. So sánh với Global Store (`@ngrx/store`): action, reducer, selector, effect, DevTools; biết khi nào chi phí đó đáng.
4. Đồng bộ bộ lọc với URL (query params) để reload, chia sẻ link, Back/Forward hoạt động đúng.
5. Làm mới server state sau thao tác ghi; xóa state khi đăng xuất hoặc đổi tài khoản.

## Use case trên Care Portal

- Bộ lọc phiếu (`status`, `priority`, `onlyMine`, trang, sort) hiện nằm trong signal của component: reload là mất,
  gửi link cho đồng nghiệp không mở đúng bộ lọc.
- Chuyển sang `TicketListStore` (SignalStore, provide ở route `tickets`), nguồn sự thật cho bộ lọc là **URL**.
- Sau khi Manager duyệt phiếu (buổi 2), danh sách phải làm mới mà không mất bộ lọc.
- `agent1` đăng xuất, `supervisor1` đăng nhập trên cùng tab: không được thấy "Chỉ phiếu của tôi" của agent1 hay dữ liệu cache cũ.

## Dự kiến lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Ma trận lựa chọn state cho các state hiện có trong Care Portal | 15 |
| 2 | Xây `TicketListStore` (state, computed, methods, `rxMethod`), test store độc lập với fake adapter | 35 |
| 3 | Đồng bộ bộ lọc với URL, reload cùng query, kiểm tra Back/Forward (test + thao tác tay) | 30 |
| 4 | Làm mới sau thao tác ghi (duyệt phiếu), tránh gọi API trùng | 20 |
| 5 | Xóa state khi đổi phiên; so sánh nhanh cùng tính năng viết bằng Global Store | 20 |

## Liên kết code

| Khái niệm | File |
|---|---|
| State hiện tại trong component | `frontend/libs/portal/feature-tickets/src/lib/ticket-list/ticket-list.page.ts` |
| Session state | `frontend/libs/shared/data-access-auth/src/lib/auth.service.ts` |
| NgRx đã cài sẵn | `frontend/package.json` (`@ngrx/signals`, `@ngrx/store`, `@ngrx/effects`, `@ngrx/store-devtools`) |
| Router input binding | `frontend/apps/portal/src/app/app.config.ts` (`withComponentInputBinding`) |

## Cần chuẩn bị trước khi soạn chi tiết

- [ ] Mẫu ma trận lựa chọn state (cột: phạm vi, vòng đời, số nơi cập nhật, cần truy vết, cần chia sẻ link, công cụ).
- [ ] Sự kiện "đổi phiên" từ `AuthService` (ví dụ signal `sessionId` hoặc hook logout) để store tự reset.
- [ ] Bản Global Store tương đương để so sánh số file và số dòng (chỉ demo, không bắt làm).

## Tài liệu

| | |
|---|---|
| Slide | `slides/` (chưa soạn) |
| Lab | `lab/` (chưa soạn) |
| Đáp án | `solution/` (chưa soạn) |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) |
| Bài tập về nhà | `../bai-tap-ve-nha/buoi-04-<chu-de>.html` (chưa soạn) |
