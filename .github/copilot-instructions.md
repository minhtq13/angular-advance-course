# Copilot: hướng dẫn cho repository Care Portal

Quy ước đầy đủ ở [AGENTS.md](../AGENTS.md) (gốc repo). Tóm tắt những điểm hay sai nhất:

- Angular 22 standalone, zoneless, `OnPush`: dùng `input()`, `output()`, `signal`, `@if`/`@for (...; track x.id)`, `inject()`.
  Không dùng `@Input`/`@Output`, `*ngIf`/`*ngFor`, `NgModule`, `CommonModule`.
- Lib `type:feature` không gọi HTTP; màn hình phiếu dùng `TicketPort`. Tham số API lấy từ Swagger (`/v3/api-docs`), không đoán.
- Chữ trên UI qua Transloco, thêm key ở cả `vi.json` và `en.json`. Màu chỉ `var(--care-*)`.
- Giá trị đọc từ URL phải qua whitelist. Subscribe phải có teardown (`takeUntilDestroyed`).
- Fake `InMemoryTicketAdapter` phải lọc giống backend; test có negative case và assertion trên dữ liệu.
- Không sửa `eslint.config.mjs` hay tag Nx để qua lint. Chỉ sửa file trong phạm vi yêu cầu.
- Chạy `npx nx run-many -t lint test build` trước khi đề xuất.
