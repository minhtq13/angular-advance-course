# Buổi 04 — State Management và lựa chọn NgRx

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')
**Điểm bắt đầu:** `git checkout session04-start` · **Đáp án:** 5 patch trong `solution/`, bản đầy đủ ở nhánh `session04-end`

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

Bốn lời phàn nàn về trang **Phiếu yêu cầu**: F5 mất bộ lọc; gửi link không mở đúng danh sách; Back văng khỏi trang; tạo phiếu xong
quay về thì mất bộ lọc. Và một lỗi rò dữ liệu: tính năng **Thuê bao xem gần đây** (`providedIn: 'root'`, có sẵn ở điểm bắt đầu) không
xóa khi đổi phiên, người đăng nhập sau thấy khách hàng người trước vừa tra cứu.

## Lab (120 phút)

| Bài | Nội dung | Phút |
|---|---|---|
| 1 | Ma trận lựa chọn state (`docs/ma-tran-state.md`) | 15 |
| 2 | `TicketListStore` (SignalStore: state, computed, methods, `rxMethod`, hooks); test store | 35 |
| 3 | URL là nguồn sự thật: `ticket-url.ts`, store đọc URL, Back/Forward, reload; test nhất quán; ADR-0003 | 35 |
| 4 | Làm mới sau ghi: duyệt → reload đúng chỗ; tạo phiếu → về đúng bộ lọc (`returnUrl` an toàn) | 15 |
| 5 | Xóa state khi đổi phiên: `RecentSubscribers` thành SignalStore root có hook | 20 |

## Liên kết code

| Khái niệm | File |
|---|---|
| State trong component (điểm bắt đầu) | `frontend/libs/portal/feature-tickets/src/lib/ticket-list/ticket-list.page.ts` |
| Session state cố ý chưa xóa | `frontend/libs/portal/feature-subscribers/src/lib/recent/recent-subscribers.ts` |
| Nơi thêm và hiển thị thuê bao xem gần đây | `subscriber-detail.page.ts` (`tap` trong `rxResource`), `subscriber-list.page.html` |
| `safeReturnUrl` (chống open redirect) | `frontend/libs/shared/data-access-auth/src/lib/auth.guard.ts` |
| NgRx đã cài sẵn | `frontend/package.json` (`@ngrx/signals`, `@ngrx/store`, `@ngrx/effects`) |

## Đã chuẩn bị ở `session04-start`

- Đáp án buổi 3 đã áp (`session03-end`).
- Tính năng **Thuê bao xem gần đây**: service `RecentSubscribers` (`providedIn: 'root'`, chưa xóa khi đổi phiên), trang chi tiết thêm vào,
  trang danh sách thuê bao hiển thị; key i18n `subscriber.recent`; class `.recent` trong `_base.scss`.

## Tài liệu

| | |
|---|---|
| Slide | [slides/slides.md](slides/slides.md) (nguồn Marp) · `buoi-04-state-va-ngrx.pptx` · `buoi-04-state-va-ngrx.pdf` |
| Lab | [lab/README.md](lab/README.md) |
| Đáp án | [solution/README.md](solution/README.md) + 5 file `.patch` |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) · [note-cho-giang-vien.md](note-cho-giang-vien.md) |
| Bài tập về nhà | [../bai-tap-ve-nha/buoi-04-state-va-ngrx.html](../bai-tap-ve-nha/buoi-04-state-va-ngrx.html) |

## Sửa slide

```bash
cd course/session-04/slides
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-04-state-va-ngrx.pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-04-state-va-ngrx.pdf
```
