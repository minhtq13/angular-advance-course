# Tài liệu khóa học

Khóa 40 giờ theo đề cương *Đề cương khóa học Angular nâng cao* (10 buổi × 4 giờ, kể cả 10 phút nghỉ). Mỗi buổi nằm trong `session-XX/`:

```
session-XX/
  README.md               Mục tiêu, nội dung, liên kết tới code trong dự án
  slides/                 Slide
  lab/                    Đề bài lab và hướng dẫn
  solution/               Đáp án lab (patch, hoặc trỏ tới nhánh git)
  instructor-notes.md     Ghi chú giảng viên: timeline, câu hỏi hay gặp, lỗi thường gặp

_templates/
  adr.md, test-matrix.md, benchmark.md, ai-review.md, release-checklist.md, instructor-notes.md

bai-tap-ve-nha/
  buoi-XX-<chu-de>.html   Bài tập về nhà giao cuối mỗi buổi (~30 phút, nộp trước buổi sau), mở bằng trình duyệt
  reference/              Bảng tra cứu in được
```

Quy ước nhánh git: `sessionXX-start` (điểm học viên bắt đầu lab) và `sessionXX-end` (đáp án đầy đủ, build và test đều pass).

## Dự án thực hành và ánh xạ với đề cương

Đề cương gọi dự án là **Service Portal**: cổng xử lý yêu cầu dịch vụ, hai vai trò Agent và Manager, tạo và phê duyệt yêu cầu,
tìm kiếm và phân trang trên 100.000 bản ghi. Repo dùng **Care Portal** với cùng nghiệp vụ:

| Đề cương | Care Portal |
|---|---|
| Yêu cầu dịch vụ | Phiếu yêu cầu (`ticket`), có `@Version` để phát hiện xung đột |
| Agent | `agent1` (role `AGENT`) |
| Manager | `supervisor1` (role `SUPERVISOR`) |
| 100.000 bản ghi mô phỏng | 200.000 thuê bao + 50.000 phiếu có sẵn trong dump; seed lên 1–5 triệu ở buổi 5 |
| SSO | Mặc định JWT do backend phát; Keycloak cục bộ chỉ ở buổi 7 (Docker profile `sso`) |

Các tình huống xuyên suốt: phản hồi API về sai thứ tự (buổi 3), token hết hạn đồng thời (buổi 6), lỗi sai quyền (buổi 6, 7),
xung đột cập nhật 409 (buổi 2), lỗi triển khai và rollback (buổi 9).

## Lịch mỗi buổi (4 giờ)

| Thời gian | Hoạt động |
|---|---|
| 20 phút | Review bài trước và phân tích use case |
| 40 phút | Khái niệm cần thiết gắn với đoạn mã |
| 30 phút | Live demo và phân tích lỗi |
| 10 phút | Nghỉ |
| 120 phút | Lab theo bước và kiểm tra kết quả |
| 20 phút | Review chéo và chốt quyết định |

## Nội dung theo buổi

| Buổi | Chủ đề | Use case và lab | Sản phẩm đầu ra | Trạng thái |
|---|---|---|---|---|
| [01](session-01/) | Kiến trúc Angular cho dự án lớn | Tách `TicketListPage` thành `TicketPort` + HTTP adapter, thay bằng fake adapter; thêm màn hình Gói cước bằng lazy lib | Sơ đồ phụ thuộc, ADR-0002, luật import trên CI | Đã soạn |
| [02](session-02/) | Component dùng lại và màn hình nghiệp vụ phức tạp | Trích `ticket-row`, tiêu đề chỉ khoảng trắng, giữ form khi lỗi, hai người duyệt cùng version | Component có hợp đồng rõ, form có test, xử lý 409 | Đã soạn |
| [03](session-03/) | Signals và RxJS cho luồng dữ liệu | Truy vấn cũ về muộn, khôi phục hủy request, luồng sống sau lỗi, subscription khi rời màn hình | Pipeline tìm kiếm có hủy, test theo trình tự sự kiện, bảng chọn operator | Đã soạn |
| [04](session-04/) | State Management và lựa chọn NgRx | Reload cùng query, bộ lọc trên URL, Back/Forward, làm mới sau ghi, xóa state khi đổi phiên | Ma trận chọn state, ADR, test nhất quán bộ lọc | Đã soạn |
| [05](session-05/) | Hiệu năng và quản lý bộ nhớ | Baseline, DOM thường so với virtual scroll, payload, heap sau 20 lần điều hướng | Bảng benchmark có dữ liệu thô, profile trước/sau, kết luận có điều kiện | Đã soạn |
| [06](session-06/) | Authentication và bảo mật giao tiếp API | 401/403/409, một refresh cho nhiều 401, refresh lỗi, token reuse, chặn Bearer ra ngoài | Ma trận kiểm thử bảo mật, test refresh đồng thời, vòng đời session | Đã soạn |
| [07](session-07/) | SSO và chiến lược kiểm thử hệ thống | Keycloak cục bộ qua thư viện OIDC; TestBed, HTTP testing, Playwright; server từ chối sai quyền | Checklist SSO, test report, regression test | Đã soạn |
| [08](session-08/) | Ứng dụng AI và Copilot trong phát triển Angular | AI làm thay đổi nhỏ, negative test, lỗi có chủ đích để kiểm chứng test, đo thời gian | Prompt, diff đã review, finding đã xác minh, báo cáo năng suất | Khung |
| [09](session-09/) | Build và CI/CD triển khai ứng dụng | Gate như CI, budget fail, Docker + Nginx, deep link, cache, rollback | Pipeline YAML, release checklist, smoke test, quy trình rollback | Khung |
| [10](session-10/) | Nâng cấp, hiện đại hóa và bảo vệ dự án cuối khóa | Nâng fixture Angular 21 → 22 theo checkpoint; demo capstone, review chéo theo rubric | Migration plan có rollback, capstone có evidence, kế hoạch áp dụng | Khung |

## Đánh giá cuối khóa

Bài tổng hợp tích lũy qua các buổi: một luồng nghiệp vụ chạy hoàn chỉnh, ADR, bộ test, benchmark và cấu hình build triển khai.
Mỗi nhóm demo, giải thích lựa chọn kỹ thuật và trả lời phản biện. Tính năng mới ở mức đề xuất phải tách khỏi phần đã triển khai.

| Nội dung đánh giá | Điểm tối đa | Bằng chứng lấy từ buổi |
|---|---|---|
| Kiến trúc và quyết định thiết kế | 20 | 1, 2, 4 (ADR, sơ đồ, luật import) |
| State và luồng dữ liệu | 15 | 3, 4 |
| Hiệu năng có số đo | 15 | 5 |
| Bảo mật và quyền API | 20 | 6, 7 |
| Kiểm thử và chất lượng mã | 15 | 1–7 |
| Build và phát hành | 10 | 9 |
| AI có review và bằng chứng | 5 | 8 |

Mức đạt đề xuất từ 70/100. **Điều kiện bắt buộc:** build thành công, API từ chối hành động sai quyền, không đưa secretKey vào client.
Mỗi học viên xác định một feature phù hợp để áp dụng sau khóa.
