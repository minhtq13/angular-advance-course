# Tài liệu khóa học

Mỗi buổi (3–4 giờ) nằm trong `session-XX/`:

```
session-XX/
  README.md               Mục tiêu, nội dung, liên kết tới code trong dự án
  slides/                 Slide
  lab/                    Đề bài lab và hướng dẫn
  solution/               Đáp án lab (hoặc trỏ tới git tag)
  instructor-notes.md     Ghi chú giảng viên: timeline, câu hỏi hay gặp, lỗi thường gặp
```

Quy ước git tag: `sessionXX-start` (điểm học viên bắt đầu lab) và `sessionXX-end` (đáp án đầy đủ, build và test đều pass).

| Buổi | Chủ đề | Phần dự án liên quan |
|---|---|---|
| 01 | Kiến trúc dự án lớn, khởi tạo dự án mẫu | Nx monorepo, tags và module boundaries, lazy routes, runtime config |
| 02 | State management (Signals, RxJS, NgRx) | signal/computed/linkedSignal/rxResource ở trang danh sách; NgRx SignalStore cho phiếu yêu cầu |
| 03 | Tối ưu hiệu năng, dữ liệu lớn | Seed 1–5 triệu thuê bao, phân trang server, virtual scroll, index/trigram, bundle budget (CSS ng-zorro 577 kB) |
| 04 | Màn hình nghiệp vụ phức tạp (form, bảng) | Wizard đăng ký thuê bao (typed reactive forms, async validator SĐT), tạo/cập nhật phiếu |
| 05 | Bảo mật: auth, JWT, SSO | JWT do backend phát (`/api/auth/login`), refresh token, nơi lưu token, interceptor xử lý 401, guard theo role, RBAC phía backend; SSO trình bày ở mức khái niệm |
| 06 | Testing và code quality | Vitest, Testing Library, Playwright, Testcontainers, ESLint, Sonar |
| 07 | Build, CI/CD, triển khai | Docker multi-stage + Nginx, GitLab CI, `nx affected`, cấu hình theo môi trường |
| 08 | Nâng cấp và hiện đại hóa Angular | Branch `legacy` (NgModule, *ngIf, BehaviorSubject) → standalone, control flow, signals |
| 09 | Ứng dụng AI trong phát triển | Chatbot CSKH (Spring AI + RAG), Angular MCP server, AI sinh test/refactor |
| 10 | Hoàn thiện dự án, review, tổng kết | Đồ án nhóm: module gói cước, checklist code review, demo |
