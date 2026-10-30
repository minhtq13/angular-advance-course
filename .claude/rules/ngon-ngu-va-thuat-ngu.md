# Ngôn ngữ và thuật ngữ

Áp dụng cho mọi nơi: câu trả lời, comment trong code, tài liệu khóa học, commit message.

## Ngôn ngữ

- Viết **tiếng Việt có dấu**. Không viết không dấu trong comment, tài liệu, câu trả lời.
- Mã, tên lib, lệnh, tên file, identifier giữ nguyên.
- Comment ngắn, giải thích **vì sao** (ràng buộc, bẫy, quyết định), không lặp lại code làm gì.

## Thuật ngữ kỹ thuật giữ tiếng Anh

Người dùng yêu cầu (2026-10-30): "Không bao giờ đặt secretKey trong code client", không dịch thuật ngữ code sang tiếng Việt.

| Giữ tiếng Anh | Không viết |
|---|---|
| secret, `secretKey` (cụm "... trong code client / repo frontend") | bí mật |
| signing key, key, private key, public key | khóa ký, khóa (mã hóa) |
| signature | chữ ký (của JWT, của hàm) |
| revoke | thu hồi |
| rotation | xoay vòng |
| reuse (refresh token) | tái sử dụng (token) |
| token family | họ token |
| clock skew | lệch đồng hồ |
| lock (dòng DB) | khóa dòng |
| resource | tài nguyên |
| unsubscribe / subscribe | hủy đăng ký / đăng ký (RxJS) |
| fake timers | đồng hồ giả |
| frame (marble) | khung thời gian |

Khi gặp thuật ngữ kỹ thuật mới không có trong bảng, giữ tiếng Anh nếu nó là tên khái niệm hoặc identifier trong code
(vd `revokeFamily`, `jti`, `noRollbackFor`).

## Không áp dụng cho

- **Chữ hiển thị cho người dùng:** `frontend/libs/shared/util-i18n/src/assets/i18n/vi.json`, `backend/src/main/resources/messages*.properties`,
  thông báo trên UI. Bản `vi` viết tiếng Việt tự nhiên ("Phiên đăng nhập đã hết hạn"), bản `en` tiếng Anh.
- **Thuật ngữ miền nghiệp vụ:** thuê bao, phiếu, gói cước, CSKH.
- **Từ tiếng Việt thông thường** chưa chốt đổi: "phiên", "vai trò", "luồng". Chưa quyết, đừng tự đổi hàng loạt.
- **Migration Flyway đã áp (V1–V4 và file đã commit):** không sửa nội dung kể cả comment (lệch checksum).
- **Nhánh và patch của buổi 1–5** đã push: giữ nguyên.

Quét tự động: skill `soat-ngon-ngu`.
