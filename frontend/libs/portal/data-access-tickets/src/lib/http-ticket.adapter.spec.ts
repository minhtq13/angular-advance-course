import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  TicketConflictError,
  TicketPort,
  TicketValidationError,
} from '@care/portal-domain-tickets';
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
    expect(page.items[0]).not.toHaveProperty('description');
    expect(page.items[0].version).toBe(0);
    http.verify();
  });

  it('gui Idempotency-Key khi tao phieu, 400 -> TicketValidationError co loi tung truong', async () => {
    const port = TestBed.inject(TicketPort);
    const http = TestBed.inject(HttpTestingController);

    const result = firstValueFrom(
      port.create(
        { subscriberId: 1, category: 'BILLING', priority: 'LOW', title: ' ' },
        'key-1',
      ),
    ).catch((e: unknown) => e);

    const req = http.expectOne('http://api/api/tickets');
    expect(req.request.headers.get('Idempotency-Key')).toBe('key-1');
    req.flush(
      {
        status: 400,
        detail: 'Du lieu khong hop le',
        errors: { title: 'khong duoc de trong' },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    const error = await result;
    expect(error).toBeInstanceOf(TicketValidationError);
    expect((error as TicketValidationError).fieldErrors).toEqual({
      title: 'khong duoc de trong',
    });
  });

  it('duyet bang version cu: 409 -> TicketConflictError giu thong bao cua backend', async () => {
    const port = TestBed.inject(TicketPort);
    const http = TestBed.inject(HttpTestingController);

    const result = firstValueFrom(port.approve(7, 3)).catch((e: unknown) => e);

    const req = http.expectOne('http://api/api/tickets/7/approve');
    expect(req.request.body).toEqual({ version: 3 });
    req.flush(
      { status: 409, detail: 'Du lieu da bi nguoi khac thay doi' },
      { status: 409, statusText: 'Conflict' },
    );

    const error = await result;
    expect(error).toBeInstanceOf(TicketConflictError);
    expect((error as Error).message).toBe('Du lieu da bi nguoi khac thay doi');
  });
});
