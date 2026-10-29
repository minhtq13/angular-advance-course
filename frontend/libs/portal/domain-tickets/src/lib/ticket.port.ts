import { Observable } from 'rxjs';
import { PageQuery, TicketPage, TicketQuery } from './ticket';

/**
 * Hop dong (port) ma man hinh phieu yeu cau can. Man hinh chi biet lop nay;
 * app quyet dinh dung adapter nao (HTTP that, fake trong test) qua DI.
 * Dung abstract class thay vi interface de lam luon DI token.
 */
export abstract class TicketPort {
  abstract search(query: TicketQuery, page: PageQuery): Observable<TicketPage>;
}
