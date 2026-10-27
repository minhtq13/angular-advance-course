import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { APP_CONFIG } from '@care/shared-util-config';
import { AdminStats, ServicePlan, SubscriberType } from './models';

@Injectable({ providedIn: 'root' })
export class ServicePlanApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiUrl}/api/service-plans`;

  list(type?: SubscriberType) {
    return this.http.get<ServicePlan[]>(this.baseUrl, {
      params: type ? { type } : {},
    });
  }
}

@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiUrl}/api/admin`;

  stats() {
    return this.http.get<AdminStats>(`${this.baseUrl}/stats`);
  }
}
