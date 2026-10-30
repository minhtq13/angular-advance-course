/**
 * Lỗi nghiệp vụ mà màn hình cần xử lý riêng. Adapter chuyển lỗi HTTP thành các lỗi này,
 * nên feature không cần biết mã HTTP hay hình dạng ProblemDetail.
 */

/** Dữ liệu đã bị người khác thay đổi, hoặc trạng thái không cho phép thao tác (HTTP 409). */
export class TicketConflictError extends Error {
  override readonly name = 'TicketConflictError';
}

/** Dữ liệu gửi lên không hợp lệ (HTTP 400). fieldErrors: tên trường -> thông báo đã dịch. */
export class TicketValidationError extends Error {
  override readonly name = 'TicketValidationError';

  constructor(
    message: string,
    readonly fieldErrors: Readonly<Record<string, string>>,
  ) {
    super(message);
  }
}
