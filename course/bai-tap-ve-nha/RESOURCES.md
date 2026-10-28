# Kiến trúc Angular + Nx — Resources

## Knowledge

- [Nx docs: "Enforce Module Boundaries"](https://nx.dev/docs/features/enforce-module-boundaries)
  Nguồn chính của bài 1. Tag là gì, rule `@nx/enforce-module-boundaries`, `depConstraints`, project không có tag thì không được phụ thuộc ai, vi phạm báo lỗi khi lint. Use for: mọi thứ về tag và luật phụ thuộc.
- [Nx docs: "Tag in Multiple Dimensions"](https://nx.dev/docs/guides/enforce-module-boundaries/tag-multiple-dimensions)
  Gắn hai chiều tag `scope:*` + `type:*`; ví dụ "`feature` cannot depend on app or another feature"; `allSourceTags`. Lưu ý: phần chữ nói ui chỉ phụ thuộc ui, nhưng cấu hình mẫu cho ui phụ thuộc cả util. Use for: thiết kế tag cho workspace nhiều app.
- [Nx docs (KB): "Monorepo Folder Structure"](https://nx.dev/docs/kb/folder-structure)
  Bảng 4 loại lib (feature, ui, data-access, util) và "Can depend on", tự gọi là "starting-point policy". Trang này cho feature phụ thuộc "Any type", lỏng hơn luật của repo Care Portal. Use for: định nghĩa 4 loại lib, cách đặt tên thư mục.
- [Angular docs: "Route Loading Strategies"](https://angular.dev/guide/routing/loading-strategies)
  `loadComponent` / `loadChildren`. Chưa đọc trực tiếp, mới thấy qua kết quả tìm kiếm. Use for: bài lazy loading (dự kiến).
- Repo Care Portal: `frontend/eslint.config.mjs` (luật thật đang chạy), `frontend/libs/**/project.json` (tag thật), lỗi lint thật ghi trong `course/session-01/solution/README.md`; nội dung từng buổi trong `course/session-XX/`.
  Use for: mọi ví dụ trong bài; luôn ưu tiên ví dụ từ repo hơn ví dụ tự nghĩ ra.

## Wisdom (Communities)

- [Nx Community (Discord chính thức)](https://nx.dev/community)
  Nơi hỏi đáp của người dùng Nx. Use for: câu hỏi về cách chia lib, luật phụ thuộc trong dự án thật.
- [Angular (Discord, liên kết ở mục Social Media trên angular.dev)](https://angular.dev/)
  Cộng đồng Angular chính thức. Use for: câu hỏi Angular nói chung.

## Gaps

- Chưa có nguồn tiếng Việt chất lượng cao về Nx.
- Trang Nx cũ về loại lib (`nx.dev/structure/library-types`, `nx.dev/docs/concepts/decisions/project-dependency-rules`) trả 404 khi kiểm tra ngày 2026-10-28; bảng loại lib hiện chỉ lấy từ trang KB "Monorepo Folder Structure".
