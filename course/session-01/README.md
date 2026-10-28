# Buổi 01 — Kiến trúc dự án lớn, khởi tạo dự án mẫu

**Thời lượng:** 3,5 giờ (lý thuyết + demo 75 phút, lab 90 phút, chữa bài và hỏi đáp 30 phút)

## Mục tiêu

Sau buổi học, học viên có thể:
1. Giải thích vì sao dự án lớn cần tổ chức lại code, và so sánh được monorepo với polyrepo.
2. Đọc và mở rộng Nx workspace: apps, libs, tags, đồ thị phụ thuộc, generators.
3. Áp dụng 4 loại lib (feature / ui / data-access / util) và module boundaries.
4. Tách bundle theo nghiệp vụ bằng lazy loading, và kiểm chứng qua output build.
5. Dùng runtime config để build một lần, deploy nhiều môi trường.

## Tài liệu

| | |
|---|---|
| Slide | [slides/slides.md](slides/slides.md) (nguồn Marp) · `buoi-01-kien-truc.pptx` · `buoi-01-kien-truc.pdf` |
| Lab | [lab/README.md](lab/README.md) |
| Bài tập về nhà (giao cuối buổi) | [../bai-tap-ve-nha/buoi-01-bon-loai-lib-va-luat-phu-thuoc.html](../bai-tap-ve-nha/buoi-01-bon-loai-lib-va-luat-phu-thuoc.html) |
| Đáp án | [solution/README.md](solution/README.md) + 2 file `.patch` |
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
| Backend package-by-feature | `backend/src/main/java/com/careportal/api/` |

## Sửa slide

```bash
cd course/session-01/slides
npx @marp-team/marp-cli@4 slides.md --pptx --allow-local-files -o buoi-01-kien-truc.pptx
npx @marp-team/marp-cli@4 slides.md --pdf  --allow-local-files -o buoi-01-kien-truc.pdf
```

Có thể dùng extension **Marp for VS Code** để xem trước slide khi đang sửa.
