# Phiếu chấm chéo capstone

**Nhóm được chấm:** ............ · **Nhóm chấm:** ............ · **Ngày:** ............

Chấm theo **bằng chứng thấy được trong buổi demo hoặc trong repo**: số đo, test, ADR, log pipeline. Không có bằng chứng thì không cho điểm mục đó.

## Điều kiện bắt buộc (một mục "Không" là chưa đạt khóa)

| Điều kiện | Có / Không | Bằng chứng đã xem |
|---|---|---|
| Build thành công (`nx run-many -t lint test build`) | | |
| API từ chối hành động sai quyền (401, 403 bằng `curl` hoặc test API) | | |
| Không có secretKey trong client (`grep` trên `dist`) | | |

## Rubric (mức đạt đề xuất 70/100)

| Nội dung | Tối đa | Điểm | Bằng chứng (file, lệnh, số đo) | Câu hỏi phản biện đã hỏi |
|---|---|---|---|---|
| Kiến trúc và quyết định thiết kế (ADR, luật import) | 20 | | | |
| State và luồng dữ liệu | 15 | | | |
| Hiệu năng có số đo | 15 | | | |
| Bảo mật và quyền API | 20 | | | |
| Kiểm thử và chất lượng mã | 15 | | | |
| Build và phát hành | 10 | | | |
| AI có review và bằng chứng | 5 | | | |
| **Tổng** | 100 | | | |

## Demo

| Mục | Đạt / Chưa | Ghi chú |
|---|---|---|
| Luồng thành công chạy trọn | | |
| Ít nhất 3 ca thất bại, mỗi ca giải thích hệ thống phản ứng thế nào | | |
| Tính năng ở mức đề xuất được tách khỏi phần đã triển khai | | |
| Kế hoạch áp dụng có vấn đề với số đo hiện tại và cách đo thành công | | |

**Một điểm mạnh:** ............................................................

**Một rủi ro nhóm nên xử lý trước khi áp dụng thật:** ............................................................
