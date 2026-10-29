import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TicketPort } from '@care/portal-domain-tickets';
import { APP_CONFIG } from '@care/shared-util-config';
import { firstValueFrom } from 'rxjs';
import { provideHttpTicketPort } from './http-ticket.adapter';

describe('HttpTicketAdapter', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: { apiUrl: 'http://api' } },
        provideHttpTicketPort(),
      ],
    });
  });

  it('goi GET /api/tickets va chuyen Spring Page thanh TicketPage', async () => {
    const port = TestBed.inject(TicketPort);
    const http = TestBed.inject(HttpTestingController);

    const result = firstValueFrom(
      port.search({ status: 'NEW' }, { page: 1, size: 20, sort: 'id,desc' }),
    );

    const req = http.expectOne(
      (r) => r.url === 'http://api/api/tickets' && r.method === 'GET',
    );
    expect(req.request.params.get('status')).toBe('NEW');
    expect(req.request.params.get('page')).toBe('1');
    req.flush({
      content: [
        {
          id: 7,
          code: 'TK-000007',
          title: 'Mat song',
          category: 'NETWORK',
          priority: 'HIGH',
          status: 'NEW',
          subscriberId: 3,
          subscriberMsisdn: '0912000003',
          subscriberName: 'Tran Thi B',
          assignee: null,
          description: 'chi tiet',
          createdBy: 'agent1',
          createdAt: '2026-01-01T08:00:00Z',
          updatedAt: '2026-01-01T08:00:00Z',
          version: 0,
        },
      ],
      page: 1,
      size: 20,
      totalElements: 21,
      totalPages: 2,
    });

    const page = await result;
    expect(page.total).toBe(21);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]).not.toHaveProperty('version');
    http.verify();
  });
});
