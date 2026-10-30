import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '@care/shared-util-config';
import { toHttpParams } from './http-params';
import {
  CreateTicketRequest,
  PageRequest,
  PageResponse,
  Ticket,
  TicketSearch,
  UpdateTicketRequest,
} from './models';

@Injectable({ providedIn: 'root' })
export class TicketApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiUrl}/api/tickets`;

  search(search: TicketSearch, page: PageRequest) {
    return this.http.get<PageResponse<Ticket>>(this.baseUrl, {
      params: toHttpParams(search, page),
    });
  }

  get(id: number) {
    return this.http.get<Ticket>(`${this.baseUrl}/${id}`);
  }

  /** idempotencyKey: gửi lại cùng key thì backend trả lại phiếu đã tạo, không tạo phiếu mới (buổi 2). */
  create(request: CreateTicketRequest, idempotencyKey?: string) {
    return this.http.post<Ticket>(this.baseUrl, request, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
    });
  }

  /** Chỉ SUPERVISOR; version cũ -> 409. */
  approve(id: number, version: number) {
    return this.http.post<Ticket>(`${this.baseUrl}/${id}/approve`, {
      version,
    });
  }

  update(id: number, request: UpdateTicketRequest) {
    return this.http.patch<Ticket>(`${this.baseUrl}/${id}`, request);
  }
}
