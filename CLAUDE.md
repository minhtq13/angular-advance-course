# Care Portal: khóa Angular nâng cao cho VNPT

Repo này vừa là **dự án mẫu** (Angular + Spring Boot) vừa là **bộ tài liệu khóa học** 40 giờ (10 buổi × 4 giờ). Người dùng là trợ giảng
soạn tài liệu; học viên là dev VNPT chỉ cài Node + Docker (không Java). Dự án xuyên suốt là **Care Portal** (CSKH + quản lý thuê bao viễn thông);
đề cương PDF gọi là *Service Portal* (ticket = phiếu yêu cầu, Agent = `agent1`, Manager = `supervisor1`).

**Đọc [handoff.md](handoff.md) trước khi làm**: trạng thái từng buổi, quyết định đã chốt, việc còn dở, bẫy đã gặp.

## Lệnh thường dùng

```bash
docker compose -f infra/docker-compose.yml up -d              # postgres :5433 (có dữ liệu), api :8081, adminer :8088
cd frontend && nvm use && npm ci && npm start                 # portal :4200 (admin: npm run start:admin, :4300)
cd frontend && npx nx run-many -t lint test build             # gate: phải pass mọi project (hiện 16)
docker compose -f infra/docker-compose.yml up -d --build api  # sau khi đổi backend
```

Tài khoản mẫu: `agent1`, `supervisor1`, `admin1` (mật khẩu trùng tên). Node theo `frontend/.nvmrc`. Backend test, e2e với backend riêng, xuất slide:
xem skill [kiem-tra-gate](.claude/skills/kiem-tra-gate/SKILL.md) và [xuat-slide](.claude/skills/xuat-slide/SKILL.md).

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `frontend/` | Nx 24 workspace: Angular 22 (standalone, zoneless, signals, `OnPush`), ng-zorro-antd, Transloco, NgRx SignalStore, Vitest, Playwright |
| `backend/` | Spring Boot 3.5, Java 21, JPA, Flyway, MapStruct, Spring Security (JWT do backend phát), Testcontainers |
| `infra/` | docker-compose, dump dữ liệu mẫu (~200.000 thuê bao, 50.000 phiếu) |
| `course/session-XX/` | Một buổi: `README`, `slides/`, `lab/`, `solution/` (patch), `instructor-notes.md`, `note-cho-giang-vien.md` |
| `course/bai-tap-ve-nha/` | Bài tập về nhà HTML tự chấm (`buoi-XX-<chu-de>.html`) |
| `docs/` | ADR (`docs/adr/`), và các tài liệu là đáp án của các buổi trước |

Đề cương PDF 40 giờ là **chuẩn** cho thứ tự và nội dung 10 buổi (bảng tổng ở `course/README.md`).

## Quy ước bắt buộc

- **Không commit, tag, push khi người dùng chưa bảo rõ.** Soạn xong thì để thay đổi chưa commit, tóm tắt những gì sẽ commit. Skill
  [commit-theo-buoi](.claude/skills/commit-theo-buoi/SKILL.md) chỉ chạy khi được yêu cầu.
- **Không đụng thay đổi riêng của người dùng.** Trước khi sửa file trong `course/`, chạy `git status`: file người dùng đang sửa dở thì để nguyên.
- **Ngôn ngữ:** trả lời, tài liệu, comment viết **tiếng Việt có dấu**; **thuật ngữ kỹ thuật giữ tiếng Anh** (secret, revoke, rotation, reuse,
  signature, clock skew...). Chi tiết: [.claude/rules/ngon-ngu-va-thuat-ngu.md](.claude/rules/ngon-ngu-va-thuat-ngu.md).
- **Git flow theo buổi:** mỗi buổi 2 nhánh `sessionXX-start` (học viên bắt đầu lab) và `sessionXX-end` (đã áp đáp án). Không dùng tag.
- **UI hai ngôn ngữ, hai theme:** mọi chữ trên giao diện qua key Transloco ở cả `vi.json` và `en.json` (vi mặc định); màu chỉ dùng token `var(--care-*)`,
  tương phản ≥ 4.5:1 ở cả theme sáng và tối. Lỗi từ backend dịch theo `Accept-Language`.
- **UI library là ng-zorro-antd** (MIT). Không dùng PrimeNG (license thương mại, ADR-0001).
- **Server quyết định quyền.** Ẩn nút chỉ là trải nghiệm; mọi quyền phải kiểm tra ở API và có test.
- **Không có secretKey trong code client.** Không commit secret thật; key DEV trong `application.yml` chỉ dùng cho máy học viên.
- **Không sửa migration Flyway đã áp** (V1–V4 và mọi file đã commit): đổi nội dung, kể cả comment, làm lệch checksum.
- **Báo cáo trung thực:** test hỏng thì nói kèm output; bước nào bỏ qua thì nói rõ; chỉ nói "xong" khi đã chạy và kiểm tra thật.

## Rules theo vùng (nạp khi làm việc ở đường dẫn tương ứng)

| File | Phạm vi |
|---|---|
| [ngon-ngu-va-thuat-ngu.md](.claude/rules/ngon-ngu-va-thuat-ngu.md) | Mọi nơi: ngôn ngữ, bảng thuật ngữ giữ tiếng Anh |
| [frontend-angular.md](.claude/rules/frontend-angular.md) | `frontend/**` |
| [backend-spring.md](.claude/rules/backend-spring.md) | `backend/**`, `infra/**` |
| [tai-lieu-khoa-hoc.md](.claude/rules/tai-lieu-khoa-hoc.md) | `course/**`, `docs/**` |
| [git-va-nhanh-theo-buoi.md](.claude/rules/git-va-nhanh-theo-buoi.md) | Mọi nơi: nhánh, commit, push |

## Skills (quy trình lặp lại)

| Skill | Dùng khi |
|---|---|
| `soan-buoi-hoc` | Soạn một buổi từ khung đến slide, lab, đáp án, bài tập về nhà |
| `bai-tap-ve-nha` | Viết bài tập về nhà HTML cho một buổi |
| `xuat-slide` | Xuất slide Marp ra PPTX + PDF và soát tràn chữ |
| `kiem-tra-gate` | Chạy gate, test backend, kiểm tra chuỗi patch, e2e với backend riêng |
| `soat-ngon-ngu` | Quét comment không dấu và thuật ngữ bị dịch nhầm |
| `commit-theo-buoi` | Tạo nhánh `sessionXX-start/end` và commit `main` (chỉ khi người dùng bảo) |
