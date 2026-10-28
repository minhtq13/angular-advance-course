# Benchmark: <câu hỏi cần trả lời>

## Điều kiện đo

| | |
|---|---|
| Thiết bị, CPU, RAM | |
| Trình duyệt, phiên bản | |
| CPU throttle / mạng | ví dụ 4× slowdown, Fast 3G |
| Build | production, commit `...` |
| Dữ liệu | số bản ghi, kích thước trang |
| Thao tác đo | bắt đầu và kết thúc ở đâu |
| Số lần lặp | tối thiểu 5, bỏ lần khởi động |

## Dữ liệu thô

| Phương án | Lần | Scripting (ms) | Rendering (ms) | Tổng (ms) | Payload (kB) | Số node DOM | Heap sau GC (MB) |
|---|---|---|---|---|---|---|---|
| A | 1 | | | | | | |
| A | 2 | | | | | | |
| B | 1 | | | | | | |

## Tổng hợp (trung vị)

| Phương án | Tổng (ms) | Payload (kB) | Heap (MB) |
|---|---|---|---|

Profile trước/sau: đính kèm file `.json` của Chrome Performance hoặc ảnh chụp.

## Kết luận và điều kiện áp dụng

Phương án ... nhanh hơn ... **khi** dữ liệu ..., thiết bị ..., thao tác .... Không áp dụng khi ....
