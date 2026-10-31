import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { Ticket } from './ticket';
import { TicketService } from './ticket.service';

const TICKETS: Ticket[] = [
  { id: 1, title: 'A', subscriber: '0900000001', priority: 'HIGH', status: 'NEW', createdAt: '2026-10-30T08:00:00Z' },
  { id: 2, title: 'B', subscriber: '0900000002', priority: 'LOW', status: 'RESOLVED', createdAt: '2026-10-30T09:00:00Z' },
];

describe('TicketService', () => {
  let service: TicketService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TicketService);
    http = TestBed.inject(HttpTestingController);
  });

  it('tai danh sach roi dem phieu moi', async () => {
    service.load().subscribe();
    http.expectOne('tickets.json').flush(TICKETS);
    expect(await firstValueFrom(service.countNew())).toBe(1);
  });

  it('duyet phieu thi chuyen sang RESOLVED', async () => {
    service.load().subscribe();
    http.expectOne('tickets.json').flush(TICKETS);
    service.approve(1);
    const list = await firstValueFrom(service.tickets);
    expect(list.find((t) => t.id === 1)?.status).toBe('RESOLVED');
  });
});
