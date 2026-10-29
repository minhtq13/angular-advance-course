/**
 * Loi nghiep vu ma man hinh can xu ly rieng. Adapter chuyen loi HTTP thanh cac loi nay,
 * nen feature khong can biet ma HTTP hay hinh dang ProblemDetail.
 */

/** Du lieu da bi nguoi khac thay doi, hoac trang thai khong cho phep thao tac (HTTP 409). */
export class TicketConflictError extends Error {
  override readonly name = 'TicketConflictError';
}

/** Du lieu gui len khong hop le (HTTP 400). fieldErrors: ten truong -> thong bao da dich. */
export class TicketValidationError extends Error {
  override readonly name = 'TicketValidationError';

  constructor(
    message: string,
    readonly fieldErrors: Readonly<Record<string, string>>,
  ) {
    super(message);
  }
}
