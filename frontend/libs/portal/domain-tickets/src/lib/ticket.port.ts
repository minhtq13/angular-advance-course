import { Observable } from 'rxjs';
import {
  CreateTicketCommand,
  PageQuery,
  TicketPage,
  TicketQuery,
  TicketSummary,
} from './ticket';

/**
 * Hop dong (port) ma man hinh phieu yeu cau can. Man hinh chi biet lop nay;
 * app quyet dinh dung adapter nao (HTTP that, fake trong test) qua DI.
 * Dung abstract class thay vi interface de lam luon DI token.
 */
export abstract class TicketPort {
  abstract search(query: TicketQuery, page: PageQuery): Observable<TicketPage>;

  /**
   * Tao phieu. Cung idempotencyKey -> cung mot phieu (an toan khi gui lai).
   * Loi: TicketValidationError (du lieu sai).
   */
  abstract create(
    command: CreateTicketCommand,
    idempotencyKey: string,
  ): Observable<TicketSummary>;

  /** Manager duyet phieu da xu ly. Loi: TicketConflictError (version cu, sai trang thai). */
  abstract approve(id: number, version: number): Observable<TicketSummary>;
}
