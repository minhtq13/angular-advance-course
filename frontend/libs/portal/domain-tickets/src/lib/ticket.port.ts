import { Observable } from 'rxjs';
import {
  CreateTicketCommand,
  PageQuery,
  TicketPage,
  TicketQuery,
  TicketSummary,
} from './ticket';

/**
 * Hợp đồng (port) mà màn hình phiếu yêu cầu cần. Màn hình chỉ biết lớp này;
 * app quyết định dùng adapter nào (HTTP thật, fake trong test) qua DI.
 * Dùng abstract class thay vì interface để làm luôn DI token.
 */
export abstract class TicketPort {
  abstract search(query: TicketQuery, page: PageQuery): Observable<TicketPage>;

  /**
   * Tạo phiếu. Cùng idempotencyKey -> cùng một phiếu (an toàn khi gửi lại).
   * Lỗi: TicketValidationError (dữ liệu sai).
   */
  abstract create(
    command: CreateTicketCommand,
    idempotencyKey: string,
  ): Observable<TicketSummary>;

  /** Manager duyệt phiếu đã xử lý. Lỗi: TicketConflictError (version cũ, sai trạng thái). */
  abstract approve(id: number, version: number): Observable<TicketSummary>;
}
