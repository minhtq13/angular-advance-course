# Bảng chọn operator làm phẳng (flattening)

Dùng khi mỗi sự kiện bên ngoài (gõ phím, bấm nút, đổi bộ lọc) sinh ra một Observable bên trong (thường là một request HTTP).
Câu hỏi để chọn: **khi sự kiện mới đến mà request cũ chưa xong, muốn chuyện gì xảy ra?**

| Operator | Request cũ chưa xong, sự kiện mới đến | Dùng cho | Rủi ro nếu chọn sai |
|---|---|---|---|
| `switchMap` | **Hủy** request cũ, chạy request mới | Tìm kiếm, gợi ý, đổi bộ lọc, tải chi tiết theo id trên URL: chỉ kết quả mới nhất có ý nghĩa | Dùng cho lệnh ghi: hủy giữa chừng, server có thể đã ghi nhưng client không biết |
| `concatMap` | **Xếp hàng**, chạy lần lượt theo thứ tự | Lệnh ghi cần đúng thứ tự: lưu nháp tự động, cập nhật tuần tự cùng một bản ghi | Hàng đợi dài ra nếu sự kiện đến nhanh hơn server xử lý |
| `exhaustMap` | **Bỏ qua** sự kiện mới cho tới khi request cũ xong | Nút gửi form, đăng nhập, làm mới token: lần bấm thêm là vô nghĩa | Bỏ qua cả sự kiện có ý nghĩa (người dùng đổi dữ liệu rồi bấm lại) |
| `mergeMap` | **Chạy song song**, kết quả về theo thứ tự hoàn thành | Tác vụ độc lập: tải nhiều ảnh, gửi nhiều thông báo. Giới hạn song song bằng tham số thứ hai | Kết quả cũ về muộn ghi đè kết quả mới (lỗi buổi 3); quá tải server khi không giới hạn |

## Áp dụng trong Care Portal

| Chỗ | Operator | Lý do |
|---|---|---|
| Ô chọn thuê bao (`lookup`) | `switchMap` | Chỉ kết quả của từ khóa mới nhất có ý nghĩa; hủy request cũ còn giảm tải server |
| Bảng thuê bao, bảng phiếu (`rxResource`) | tương đương `switchMap` | `rxResource` tự hủy stream cũ khi `params` đổi |
| Nút "Tạo phiếu" | `exhaustMap` hoặc cờ `submitting()` | Lần bấm thứ hai khi đang gửi là vô nghĩa; idempotency phía server lo phần còn lại (buổi 2) |
| Làm mới token khi nhiều request cùng nhận 401 (buổi 6) | `exhaustMap` / chia sẻ một refresh | Chỉ một lần refresh, các request khác chờ kết quả đó |

## Xử lý lỗi và hủy

- `catchError` đặt **bên trong** operator làm phẳng: lỗi của một request chỉ kết thúc request đó, luồng ngoài vẫn sống.
  Đặt ngoài: lỗi đầu tiên làm cả luồng hoàn tất, người dùng gõ tiếp cũng không có gì xảy ra.
- Hủy đăng ký (`unsubscribe`) Observable của `HttpClient` = hủy XHR. Tab Network hiện *(canceled)*.
- Đăng ký trong component phải gắn với vòng đời: `toSignal(...)` hoặc `takeUntilDestroyed()`. `subscribe()` trần trong constructor
  sống tiếp sau khi rời màn hình.
