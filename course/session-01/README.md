# Buổi 01 — Kiến trúc Angular cho dự án lớn

**Thời lượng:** 4 giờ (review và use case 20', khái niệm 40', live demo 30', nghỉ 10', lab 120', review chéo 20')

## Theo đề cương

| | |
|---|---|
| Nội dung chính | Clean Architecture và chiều phụ thuộc; phân chia domain, application, data access và UI; feature boundary, phạm vi DI, lazy route và tổ chức thư viện dùng chung. Thảo luận khi nào cần monorepo hoặc tách thư viện. |
| Use case và lab | Tách màn hình gọi API trực tiếp thành hợp đồng `TicketPort` và HTTP adapter; thay bằng fake adapter để xác nhận khả năng kiểm thử độc lập. |
| Sản phẩm đầu ra | Sơ đồ phụ thuộc, ADR kiến trúc (`docs/adr/0002`) và quy tắc kiểm tra import trên CI (`.github/workflows/ci.yml`). |

## Mục tiêu

Sau buổi học, học viên có thể:
1. Giải thích Clean Architecture và chiều phụ thuộc; ánh xạ domain, application, data access, UI sang lib Nx (`type:domain`, `type:data-access`, `type:feature`, `type:ui`).
2. Đọc và mở rộng Nx workspace: apps, libs, tags, đồ thị phụ thuộc, generators; đặt feature boundary bằng public API và lazy route.
3. Tách port và adapter, nối chúng ở composition root bằng phạm vi DI phù hợp (root, app, route, component).
4. Viết test màn hình chạy trên fake adapter, không cần HTTP.
5. Biến quy tắc kiến trúc thành luật import chạy trên CI, và ghi quyết định bằng ADR.
6. Lập luận khi nào cần monorepo, khi nào tách thư viện ra repo riêng, khi nào micro-frontend.

## Tài liệu

| | |
|---|---|
| Slide | [slides/slides.md](slides/slides.md) (nguồn Marp) · `buoi-01-kien-truc.pptx` · `buoi-01-kien-truc.pdf` |
| Lab | [lab/README.md](lab/README.md) |
| Bài tập về nhà (giao cuối buổi) | [../bai-tap-ve-nha/buoi-01-bon-loai-lib-va-luat-phu-thuoc.html](../bai-tap-ve-nha/buoi-01-bon-loai-lib-va-luat-phu-thuoc.html) |
| Đáp án | [solution/README.md](solution/README.md) + 3 file `.patch` |
| Mẫu ADR · ADR của dự án | [../_templates/adr.md](../_templates/adr.md) · [../../docs/adr/](../../docs/adr/) |
| Ghi chú giảng viên | [instructor-notes.md](instructor-notes.md) |
| Chuẩn bị môi trường (gửi học viên **trước** buổi 1) | [../setup/environment.md](../setup/environment.md) |

## Liên kết code

| Khái niệm | File |
|---|---|
| Cấu trúc và quy ước workspace | `frontend/nx.json`, `frontend/tsconfig.base.json` |
| Module boundaries | `frontend/eslint.config.mjs` |
| Tags của từng project | `frontend/libs/**/project.json` |
| Lazy loading | `frontend/apps/portal/src/app/app.routes.ts` |
| Ghép provider | `frontend/apps/portal/src/app/app.config.ts` |
| Runtime config | `frontend/apps/portal/src/main.ts`, `libs/shared/util-config`, `apps/portal/public/config.json` |
| Màn hình gọi API trực tiếp (điểm xuất phát lab) | `frontend/libs/portal/feature-tickets/src/lib/ticket-list/ticket-list.page.ts` |
| Port, adapter, fake (sau lab) | `libs/portal/domain-tickets`, `libs/portal/data-access-tickets` (trong `solution/bai3-5-ticket-port.patch`) |
| ADR mẫu | `docs/adr/0001-dung-ng-zorro-thay-primeng.md` |
| Backend package-by-feature | `backend/src/main/java/com/careportal/api/` |

## Sửa slide

```bash
cd course/session-01/slides
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-01-kien-truc.pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-01-kien-truc.pdf
```

Có thể dùng extension **Marp for VS Code** để xem trước slide khi đang sửa.
