# Capstone Care Portal: bằng chứng

Buổi 10, Bài 5. Bản mẫu do giảng viên chạy trên `session09-end` (2026-10-31, backend riêng cổng 8091, seed 500 phiếu). Mỗi nhóm điền số của mình.

## 1. Điều kiện bắt buộc (không đạt một mục là chưa đạt khóa)

| Điều kiện | Lệnh | Kết quả |
|---|---|---|
| Build thành công | `cd frontend && npx nx run-many -t lint test build` | 16 project xanh |
| API từ chối khi không đăng nhập | `curl -s -o /dev/null -w '%{http_code}' localhost:8081/api/tickets` | `401` |
| API từ chối sai quyền | `agent1` gọi `PATCH /api/tickets/1` với `{"status":"CLOSED"}` | `403` |
| | `agent1` gọi `GET /api/admin/stats` | `403` (`admin1`: `200`) |
| Không có secretKey trong client | `grep -rlE 'care-dev-secret\|jwt-secret\|JWT_SECRET\|secretKey\|client_secret' frontend/dist/apps` | 0 file |
| | Cùng lệnh trên `frontend/apps/portal frontend/apps/admin frontend/libs` | 0 file (1 kết quả ở `apps/portal-e2e`: test chạy trong Node, không vào bundle) |
| Client SSO không có secret | `infra/keycloak/care-realm.json` | `"publicClient": true` (PKCE, buổi 7) |

Lấy token để thử bằng `curl`:

```bash
TOKEN=$(curl -s -XPOST localhost:8081/api/auth/login -H 'Content-Type: application/json' \
  -d '{"username":"agent1","password":"agent1"}' | jq -r .accessToken)
curl -s -o /dev/null -w '%{http_code}\n' -XPATCH localhost:8081/api/tickets/1 -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"status":"CLOSED","version":0}'
```

## 2. Bằng chứng theo rubric

| Nội dung (điểm) | Bằng chứng trong repo | Cách trình bày khi demo |
|---|---|---|
| Kiến trúc (20) | `docs/adr/0001`–`0004`, `frontend/eslint.config.mjs` (luật lib), `TicketPort` | Thêm import sai lớp → lint đỏ |
| State (15) | `docs/adr/0003`, `docs/ma-tran-state.md`, `ticket-list.store.ts` | F5, Back giữ bộ lọc; 409 khi hai người duyệt cùng version |
| Hiệu năng (15) | `docs/benchmark-buoi-05.md` | Số đo trước/sau, không nói "nhanh hơn" chung chung |
| Bảo mật (20) | `docs/ma-tran-bao-mat.md`, `docs/vong-doi-phien.md`, `docs/checklist-sso.md`, mục 1 ở trên | Ca thất bại: 401 → refresh một lần; 403 hiện trang "Không có quyền" |
| Kiểm thử (15) | `docs/bao-cao-kiem-thu.md`, bảng thử phá các buổi 3–10 | Một lỗi có chủ đích, test nào đỏ |
| Build, phát hành (10) | `.github/workflows/ci.yml`, `docs/release-checklist-1.1.0.md`, `docs/quy-trinh-rollback.md` | Smoke đỏ với 1.1.0 → rollback 1.0.0 |
| AI (5) | `docs/ai-review-pr-bo-loc-loai-yeu-cau.md`, `docs/bao-cao-nang-suat-ai.md` | Một finding đúng, một finding sai đã xác minh |

## 3. Kịch bản demo (8 phút mỗi nhóm)

1. Luồng thành công: agent tạo phiếu → supervisor duyệt → agent thấy phiếu đã đóng (E2E `journeys/`).
2. Ca thất bại có chủ đích, mỗi ca một câu "hệ thống phản ứng thế nào": 403 (agent đóng phiếu), 409 (duyệt trùng), mạng chậm
   (DevTools "Slow 4G", hủy request cũ), triển khai lỗi rồi rollback (buổi 9).
3. Một quyết định có ADR và phương án đã loại.

## 4. Kế hoạch áp dụng vào một feature thật

| | |
|---|---|
| Feature, dự án | (vd: màn hình tra cứu thuê bao của hệ thống đang làm) |
| Vấn đề hiện tại có số đo | (vd: tải 2,1 giây, 3 lỗi 409 bị nuốt tháng trước) |
| Kỹ thuật áp dụng (buổi nào) | (vd: URL là nguồn sự thật cho bộ lọc, buổi 4; hủy request cũ, buổi 3) |
| Checkpoint và rollback | (mỗi bước một commit, test gì xanh) |
| Cách đo thành công | (số đo trước/sau, test) |
| Ngày xem lại | |

Tính năng mới ở mức đề xuất ghi riêng ở mục này, tách khỏi phần đã triển khai (yêu cầu của đề cương).
