# Bài tập về nhà

Sau mỗi buổi học có một bài tập về nhà, làm trong khoảng 30 phút và **nộp trước buổi tiếp theo**.

| Buổi | Bài tập | Chủ đề |
|---|---|---|
| 01 | [buoi-01-bon-loai-lib-va-luat-phu-thuoc.html](buoi-01-bon-loai-lib-va-luat-phu-thuoc.html) | Bốn loại lib và luật phụ thuộc |
| 02 | [buoi-02-hop-dong-component-va-form.html](buoi-02-hop-dong-component-va-form.html) | Hợp đồng component và form nghiệp vụ |
| 03 | [buoi-03-signals-va-rxjs.html](buoi-03-signals-va-rxjs.html) | Signals và RxJS |
| 04 | [buoi-04-state-va-ngrx.html](buoi-04-state-va-ngrx.html) | State và NgRx |
| 05 | [buoi-05-hieu-nang-va-bo-nho.html](buoi-05-hieu-nang-va-bo-nho.html) | Hiệu năng và bộ nhớ |
| 06 | [buoi-06-xac-thuc-va-bao-mat-api.html](buoi-06-xac-thuc-va-bao-mat-api.html) | Xác thực và bảo mật API |
| 07 | [buoi-07-sso-va-kiem-thu.html](buoi-07-sso-va-kiem-thu.html) | SSO và chiến lược kiểm thử |
| 08 | [buoi-08-ai-va-copilot.html](buoi-08-ai-va-copilot.html) | AI và Copilot trong phát triển Angular |
| 09 | [buoi-09-build-va-cicd.html](buoi-09-build-va-cicd.html) | Build và CI/CD triển khai ứng dụng |
| 10 | [buoi-10-nang-cap-va-capstone.html](buoi-10-nang-cap-va-capstone.html) | Nâng cấp, hiện đại hóa, capstone (bài sau khóa) |

## Cách làm

1. Mở file `.html` của buổi bằng trình duyệt, từ repo đã clone về máy. Trên GitHub file chỉ hiện mã nguồn, không chạy được bài tập.
2. Làm lần lượt từng phần. Phần trắc nghiệm và phần kiểm tra import tự chấm ngay khi bạn chọn đáp án.
3. Nộp cho giảng viên theo mục **Nộp bài** ở cuối mỗi bài.

Một ngày trước buổi kế tiếp, làm lại phần luyện tập mà không xem lại tài liệu. Nhớ lại sau vài ngày giúp nhớ lâu hơn đọc lại nhiều lần.

## Tài liệu dùng kèm

- [reference/](reference/): bảng tra cứu một trang, in được.
- [GLOSSARY.md](GLOSSARY.md): từ vựng thống nhất của khóa học.

---

### Dành cho người soạn bài

Thư mục này là workspace của skill `teach`. Mỗi bài dùng lại style và component trong `assets/`:

| Component | Dùng để |
|---|---|
| `assets/lesson.css` | Style chung (sáng/tối, bản in) |
| `assets/quiz.js` | Trắc nghiệm chấm ngay (`data-quiz`) |
| `assets/boundary-checker.js` | Bài tập "import được phép hay bị chặn" theo đúng logic `@nx/enforce-module-boundaries` (`data-boundary-checker`; thêm `data-allow-add` để học viên tự thêm lib) |

Quy ước: file bài đặt tên `buoi-XX-<chu-de>.html`. Bài phải dựa trên nội dung buổi tương ứng trong `course/session-XX/`, **không lặp lại bài lab đã làm trên lớp**. Mỗi bài cần có: phần nhớ lại trước khi ôn, phần luyện tập có phản hồi ngay, một bài vận dụng vào tình huống mới, và mục **Nộp bài**.
Mục tiêu, nguồn tham khảo và ghi chú soạn bài: [MISSION.md](MISSION.md), [RESOURCES.md](RESOURCES.md), [NOTES.md](NOTES.md).
