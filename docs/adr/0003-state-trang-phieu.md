# ADR-0003: State trang Phiếu yêu cầu: URL là nguồn sự thật, SignalStore theo màn hình

- **Trạng thái:** Đã chấp nhận
- **Ngày:** <ngày học buổi 4>
- **Người quyết định:** <nhóm>

## Bối cảnh

Bộ lọc (trạng thái, ưu tiên, "của tôi"), trang và sort của danh sách phiếu nằm trong `signal` của component. Quan sát được:
- F5 mất bộ lọc; gửi link cho đồng nghiệp không mở đúng danh sách.
- Back sau khi đổi bộ lọc rời khỏi trang thay vì về bộ lọc trước.
- Logic bộ lọc, phân trang, tải dữ liệu, xử lý lỗi dồn trong component; khó test riêng.

## Các phương án đã xem xét

| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| Giữ signal trong component | Ít code | Không giải quyết F5, link, Back |
| Store `providedIn: 'root'` giữ bộ lọc | Giữ khi chuyển màn hình | Vẫn mất khi F5; không chia sẻ được; phải tự xóa khi đổi phiên |
| Đồng bộ hai chiều signal ↔ URL (effect ghi URL, subscribe URL ghi signal) | Giữ nguyên code cũ | Hai nguồn sự thật, dễ vòng lặp và lệch nhau |
| NgRx Global Store + router-store | Truy vết đầy đủ, DevTools | Nhiều code (action, reducer, selector, effect) cho một màn hình |
| **URL là nguồn sự thật; `TicketListStore` (SignalStore) cung cấp ở component đọc URL, điều hướng để đổi** | Một nguồn sự thật; F5, link, Back/Forward đúng; store test riêng được | Mọi thay đổi bộ lọc đi qua router (bất đồng bộ); phải kiểm tra giá trị URL |

## Quyết định

- Bộ lọc, trang, sort nằm trên query params (`status`, `priority`, `mine`, `page` đếm từ 1, `size`, `sort`); giá trị mặc định không ghi lên URL.
- `TicketListStore` (SignalStore, `providers: [TicketListStore]` ở `TicketListPage`): `filters`/`page` là `computed` từ URL;
  `setFilters`/`setPage` gọi `router.navigate` (mỗi lần đổi là một mục lịch sử); server state (`items`, `total`, `status`) tải bằng
  `rxMethod` + `switchMap`.
- Giá trị URL không hợp lệ bị bỏ qua (`ticket-url.ts`): URL là input người dùng sửa tay được.
- State UI cục bộ (thông báo, đang duyệt) vẫn là `signal` trong component.

## Hệ quả

- **Tốt:** F5, link chia sẻ, Back/Forward đều ra đúng danh sách; store và hàm đọc URL có test riêng (`ticket-list.store.spec.ts`,
  `ticket-url.spec.ts`, `ticket-list.url.spec.ts`).
- **Phải chấp nhận:** đổi bộ lọc tạo mục lịch sử mới; nếu người dùng thấy Back "quá nhiều bước" thì cân nhắc `replaceUrl` cho thay đổi trang.
- **Cách kiểm chứng:** test tính nhất quán bộ lọc (URL → request, đổi bộ lọc → URL, Back/Forward, URL sai).

## Khi nào xem lại

Khi nhiều màn hình cần cùng một bộ lọc, hoặc cần audit/time-travel trên thay đổi state: cân nhắc Global Store.
