import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TicketPort } from '@care/portal-domain-tickets';
import {
  aTicket,
  InMemoryTicketAdapter,
} from '@care/portal-domain-tickets/testing';
import { AuthService } from '@care/shared-data-access-auth';
import { provideUi } from '@care/shared-ui-layout';
import { provideI18nTesting } from '@care/shared-util-i18n/testing';
import { TicketListPage } from './ticket-list.page';

// Khong co HttpClient trong test: man hinh chay hoan toan tren fake adapter.
describe('TicketListPage', () => {
  let port: InMemoryTicketAdapter;

  beforeEach(async () => {
    port = new InMemoryTicketAdapter().seed([
      aTicket({ code: 'TK-A', assignee: 'agent1' }),
      aTicket({ code: 'TK-B', assignee: 'agent2' }),
      aTicket({ code: 'TK-C', assignee: null, status: 'RESOLVED' }),
    ]);

    await TestBed.configureTestingModule({
      imports: [TicketListPage],
      providers: [
        provideRouter([]),
        provideUi(),
        provideI18nTesting(),
        { provide: TicketPort, useValue: port },
        { provide: AuthService, useValue: { username: signal('agent1') } },
      ],
    }).compileComponents();
  });

  // nz-table chen them mot hang do (measure row) rong o dau tbody -> bo qua.
  function codes(el: HTMLElement): string[] {
    return [...el.querySelectorAll('tbody tr td:first-child')]
      .map((td) => td.textContent?.trim() ?? '')
      .filter(Boolean);
  }

  it('hien thi phieu tu TicketPort, bat dau o trang 0 khong loc', async () => {
    const fixture = TestBed.createComponent(TicketListPage);
    await fixture.whenStable();

    expect(codes(fixture.nativeElement)).toEqual(['TK-A', 'TK-B', 'TK-C']);
    expect(port.calls[0].query).toEqual({
      status: null,
      priority: null,
      assignee: null,
    });
    expect(port.calls[0].page.page).toBe(0);
  });

  it('"Chi phieu cua toi" truyen username dang nhap xuong port', async () => {
    const fixture = TestBed.createComponent(TicketListPage);
    await fixture.whenStable();

    const checkbox = fixture.nativeElement.querySelector(
      'label[nz-checkbox]',
    ) as HTMLElement;
    checkbox.click();
    await fixture.whenStable();

    expect(port.calls.at(-1)?.query.assignee).toBe('agent1');
    expect(codes(fixture.nativeElement)).toEqual(['TK-A']);
  });
});
