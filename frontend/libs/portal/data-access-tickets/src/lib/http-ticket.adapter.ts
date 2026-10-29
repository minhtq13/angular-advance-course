import { inject, Injectable, Provider } from '@angular/core';
import { Ticket, TicketApi } from '@care/shared-data-access-api';
import {
  PageQuery,
  TicketPage,
  TicketPort,
  TicketQuery,
  TicketSummary,
} from '@care/portal-domain-tickets';
import { map, Observable } from 'rxjs';

/** Adapter HTTP: goi API that qua TicketApi va chuyen hinh dang Spring Page sang TicketPage. */
@Injectable()
export class HttpTicketAdapter extends TicketPort {
  private readonly api = inject(TicketApi);

  search(query: TicketQuery, page: PageQuery): Observable<TicketPage> {
    return this.api.search(query, page).pipe(
      map((res) => ({
        items: res.content.map(toSummary),
        total: res.totalElements,
      })),
    );
  }
}

export function toSummary(t: Ticket): TicketSummary {
  return {
    id: t.id,
    code: t.code,
    title: t.title,
    category: t.category,
    priority: t.priority,
    status: t.status,
    subscriberId: t.subscriberId,
    subscriberMsisdn: t.subscriberMsisdn,
    subscriberName: t.subscriberName,
    assignee: t.assignee,
    createdAt: t.createdAt,
  };
}

/** Noi TicketPort voi adapter HTTP. Goi o composition root (route cua app), khong goi trong feature. */
export function provideHttpTicketPort(): Provider[] {
  return [{ provide: TicketPort, useClass: HttpTicketAdapter }];
}
