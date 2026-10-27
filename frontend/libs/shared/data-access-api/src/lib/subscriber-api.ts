import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '@care/shared-util-config';
import { toHttpParams } from './http-params';
import {
  CreateSubscriberRequest,
  PageRequest,
  PageResponse,
  Subscriber,
  SubscriberSearch,
  SubscriberStatus,
} from './models';

@Injectable({ providedIn: 'root' })
export class SubscriberApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiUrl}/api/subscribers`;

  search(search: SubscriberSearch, page: PageRequest) {
    return this.http.get<PageResponse<Subscriber>>(this.baseUrl, {
      params: toHttpParams(search, page),
    });
  }

  get(id: number) {
    return this.http.get<Subscriber>(`${this.baseUrl}/${id}`);
  }

  checkMsisdn(msisdn: string) {
    return this.http.get<{ msisdn: string; available: boolean }>(
      `${this.baseUrl}/msisdn-availability`,
      {
        params: { msisdn },
      },
    );
  }

  create(request: CreateSubscriberRequest) {
    return this.http.post<Subscriber>(this.baseUrl, request);
  }

  changeStatus(id: number, status: SubscriberStatus, version: number) {
    return this.http.patch<Subscriber>(`${this.baseUrl}/${id}/status`, {
      status,
      version,
    });
  }
}
