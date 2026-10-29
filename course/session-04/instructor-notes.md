# Buổi 04 — Ghi chú giảng viên

## Trước buổi học

**Vài ngày trước:**
- Thu bài tập về nhà buổi 3 và `docs/bang-chon-operator.md` của các nhóm. Chọn một ví dụ dự án thật hay để mở đầu.

**Ngày học:**
- [ ] `git checkout session04-start`, `docker compose -f infra/docker-compose.yml up -d`, `cd frontend && npm ci && npm start`
- [ ] Nếu buổi 3 bật chế độ demo chậm: `docker compose -f infra/docker-compose.yml up -d api` để tắt
- [ ] Hai cửa sổ: một cửa sổ thường, một ẩn danh (để "gửi link cho trưởng nhóm")
- [ ] Nhánh `session04-end` để chuyển sang ở bước 4 của demo
- [ ] VS Code mở sẵn `ticket-list.page.ts` (bản cũ có signal bộ lọc, `linkedSignal`, `rxResource`)

## Timeline (4 giờ)

| Thời gian | Nội dung | Slide | Ghi chú |
|---|---|---|---|
| 0:00–0:20 | Review buổi 3, use case | 1–4 | Đọc 4 lời phàn nàn, hỏi lớp đã gặp chưa |
| 0:20–1:00 | Khái niệm | 5–17 | Loại state và ma trận (5–6), SignalStore (7–10), URL (11–13), làm mới sau ghi (14), session (15), Global Store (16–17) |
| 1:00–1:30 | Live demo | 18 | Làm đủ 4 bước, cho lớp dự đoán trước mỗi bước |
| 1:30–1:40 | **Nghỉ** | | |
| 1:40–3:40 | **Lab** 5 bài | 19–20 | Mốc nhắc: 1:55 sang Bài 2, 2:30 sang Bài 3, 3:05 sang Bài 4, 3:20 sang Bài 5 |
| 3:40–4:00 | Review chéo, chốt ADR-0003 | 21 | Giao bài tập về nhà |

## Kịch bản demo

1. **F5 và link chia sẻ (5 phút).** Lọc **Đã xử lý** + **Cao**, trang 3. F5 → mất hết. Copy URL sang cửa sổ ẩn danh → danh sách khác.
2. **Back (3 phút).** Đổi bộ lọc 3 lần, bấm Back: rời khỏi trang Phiếu. Hỏi: "Người dùng mong gì khi bấm Back?"
3. **Rò dữ liệu khi đổi phiên (7 phút).** agent1 mở `/subscribers/5` và `/subscribers/12`, bấm menu **Thuê bao** (không F5): dòng
   *Xem gần đây*. Đăng xuất, đăng nhập `supervisor1` → vẫn thấy. **Dừng lại, hỏi lớp:** "Ở VNPT, chuyện này có phải sự cố không?"
   (Câu trả lời mong đợi: có, lộ dữ liệu cá nhân của khách hàng giữa hai nhân viên.)
4. **Sau khi sửa (10 phút).** `git checkout session04-end` (dev server tự build lại). Làm lại 1–3: URL `/tickets?status=RESOLVED&priority=HIGH&page=3`,
   F5 giữ, link mở đúng, Back về bộ lọc trước, supervisor1 không thấy thuê bao của agent1. Mở `ticket-list.store.ts` đọc lướt 4 khối.
5. Trả về `session04-start` trước khi học viên làm lab.

## Điểm cần nhấn mạnh

- **Hỏi trước, chọn công cụ sau.** Ma trận state là công cụ thảo luận với PM/Lead, không chỉ của dev.
- **URL là state.** Thứ gì người dùng muốn F5, chia sẻ, Back được thì để trên URL. Đọc URL như đọc input: không tin.
- **Một nguồn sự thật.** Đồng bộ hai chiều signal ↔ URL là nguồn lỗi kinh điển (vòng lặp, lệch nhau).
- **Phạm vi DI = vòng đời.** Store theo component tự dọn. Store root chứa dữ liệu người dùng: phải trả lời "đăng xuất thì ai xóa?".
- **Server state là bản sao.** Làm mới sau ghi: đúng chỗ, đúng một lần.
- **Global Store không phải mặc định.** Chọn khi cần truy vết và quy ước chặt; ghi lý do vào ADR.

## Câu hỏi học viên hay hỏi

| Câu hỏi | Gợi ý trả lời |
|---|---|
| Dự án em dùng NgRx Store rồi, có nên chuyển sang SignalStore? | Không cần chuyển hàng loạt. State mới theo màn hình có thể dùng SignalStore; state toàn cục đang chạy tốt thì giữ. `@ngrx/store` có `selectSignal` để đọc bằng signal. |
| SignalStore với service có `signal` khác gì? | Về bản chất gần nhau. SignalStore cho quy ước sẵn (state/computed/methods/hooks, `patchState`, thành viên riêng tư, plugin như `withEntities`, `withDevtools` của cộng đồng). Service tự viết linh hoạt hơn nhưng mỗi người viết một kiểu. |
| Sao không lưu bộ lọc vào `localStorage`? | Được nếu chỉ cần giữ cho **một người** trên **một máy**. Không chia sẻ link được, không có Back/Forward. |
| `replaceUrl` khi nào? | Khi thay đổi không đáng thành một bước Back (vd gõ từng ký tự ô tìm kiếm, đổi trang liên tục). Ghi quyết định vào ADR. |
| Có `@ngrx/router-store` sao không dùng? | Hợp khi đã dùng Global Store và muốn router state trong store. Với SignalStore, đọc `ActivatedRoute` qua `toSignal` là đủ. |
| `effect` trong store có vi phạm "không dùng effect để đồng bộ state" không? | Không: effect ở đây phản ứng với **sự kiện ngoài store** (đổi phiên) để dọn dữ liệu, không suy ra giá trị. |

## Lỗi thường gặp khi làm lab

| Hiện tượng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Test store: `port.calls` rỗng | Quên `TestBed.tick()` sau `TestBed.inject(store)` | `rxMethod` nhận signal chạy qua effect; cần tick |
| `NG0203 inject() must be called from an injection context` | `inject`/`toSignal` trong method | Đưa vào `withProps`/`withComputed`/factory của `withHooks` |
| Đổi bộ lọc, gọi API 2 lần | `page` không có `equal: samePage`, hoặc `setPage` không so trùng | Thêm `equal`, so `samePage` trước khi điều hướng |
| URL có `?page=1&size=20&sort=id,desc` | `toQueryParams` không bỏ mặc định | Chỉ ghi giá trị khác mặc định |
| Test Back: URL không đổi | Thiếu `router.initialNavigation()` | Gọi sau `RouterTestingHarness.create()` |
| Test Back: assertion chạy trước khi điều hướng xong | Chỉ `await whenStable()` | Chờ `NavigationEnd` |
| Test cũ của trang danh sách lỗi `No provider for ActivatedRoute` | Test không có router | Thêm `provideRouter([])` (đã có trong spec mẫu) |
| Tạo phiếu xong về trang chủ `/` | `safeReturnUrl` trả `/` khi URL không hợp lệ | Hàm `backToList` mặc định `/tickets` |
| Test `RecentSubscribers` lỗi thiếu `HttpClient` | Store giờ `inject(AuthService)` thật | Cung cấp `AuthService` giả có `username` |
| Thử tay "đổi phiên" vẫn thấy rỗng ngay cả ở điểm bắt đầu | Dùng F5 hoặc gõ URL (tải lại cả trang, mất state trong bộ nhớ) | Điều hướng bằng menu trong app |

## Sau buổi học

- Giao bài tập về nhà: [../bai-tap-ve-nha/buoi-04-state-va-ngrx.html](../bai-tap-ve-nha/buoi-04-state-va-ngrx.html) (khoảng 30 phút, nộp trước buổi 5).
- Thu ma trận state và ADR-0003 của các nhóm.
- Buổi 5 bắt đầu từ `session05-start` = `session04-end` + phần chuẩn bị.
