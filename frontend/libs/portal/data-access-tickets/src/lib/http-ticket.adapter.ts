import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, Provider } from '@angular/core';
import { ProblemDetail, Ticket, TicketApi } from '@care/shared-data-access-api';
import {
  CreateTicketCommand,
  PageQuery,
  TicketConflictError,
  TicketPage,
  TicketPort,
  TicketQuery,
  TicketSummary,
  TicketValidationError,
} from '@care/portal-domain-tickets';
import { catchError, map, Observable, throwError } from 'rxjs';

/** Adapter HTTP: gọi API thật qua TicketApi, chuyển Spring Page sang TicketPage và lỗi HTTP sang lỗi nghiệp vụ. */
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

  create(
    command: CreateTicketCommand,
    idempotencyKey: string,
  ): Observable<TicketSummary> {
    return this.api
      .create(command, idempotencyKey)
      .pipe(map(toSummary), catchError(toDomainError));
  }

  approve(id: number, version: number): Observable<TicketSummary> {
    return this.api
      .approve(id, version)
      .pipe(map(toSummary), catchError(toDomainError));
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
    version: t.version,
  };
}

/** 409 -> TicketConflictError, 400 -> TicketValidationError; lỗi khác (mạng, 403, 500) giữ nguyên. */
export function toDomainError(error: unknown): Observable<never> {
  if (error instanceof HttpErrorResponse) {
    const problem = (error.error ?? {}) as ProblemDetail;
    const message = problem.detail ?? error.message;
    if (error.status === 409) {
      return throwError(() => new TicketConflictError(message));
    }
    if (error.status === 400) {
      return throwError(
        () => new TicketValidationError(message, problem.errors ?? {}),
      );
    }
  }
  return throwError(() => error);
}

/** Nối TicketPort với adapter HTTP. Gọi ở composition root (route của app), không gọi trong feature. */
export function provideHttpTicketPort(): Provider[] {
  return [{ provide: TicketPort, useClass: HttpTicketAdapter }];
}
