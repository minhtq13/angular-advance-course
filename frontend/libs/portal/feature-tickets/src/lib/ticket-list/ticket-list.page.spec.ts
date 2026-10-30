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

// Không có HttpClient trong test: màn hình chạy hoàn toàn trên fake adapter.
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
        {
          provide: AuthService,
          useValue: { username: signal('agent1'), roles: signal(['AGENT']) },
        },
      ],
    }).compileComponents();
  });

  // nz-table chèn thêm một hàng đo (measure row) rỗng ở đầu tbody -> bỏ qua.
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

// Buổi 2: Manager duyệt phiếu, hai người duyệt cùng một version.
describe('TicketListPage - phe duyet', () => {
  let port: InMemoryTicketAdapter;

  beforeEach(async () => {
    port = new InMemoryTicketAdapter().seed([
      aTicket({ id: 101, code: 'TK-R', status: 'RESOLVED', version: 3 }),
      aTicket({ id: 102, code: 'TK-N', status: 'NEW' }),
    ]);
    await TestBed.configureTestingModule({
      imports: [TicketListPage],
      providers: [
        provideRouter([]),
        provideUi(),
        provideI18nTesting(),
        { provide: TicketPort, useValue: port },
        {
          provide: AuthService,
          useValue: {
            username: signal('supervisor1'),
            roles: signal(['AGENT', 'SUPERVISOR']),
          },
        },
      ],
    }).compileComponents();
  });

  const approveButtons = (el: HTMLElement) =>
    [...el.querySelectorAll('tbody button')] as HTMLButtonElement[];

  it('chi phieu RESOLVED co nut Duyet; duyet xong bao thanh cong va tai lai danh sach', async () => {
    const fixture = TestBed.createComponent(TicketListPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(approveButtons(el)).toHaveLength(1);
    const before = port.calls.at(-1);
    const searches = port.calls.length;

    approveButtons(el)[0].click();
    await fixture.whenStable();

    expect(port.approveCalls).toEqual([{ id: 101, version: 3 }]);
    // Làm mới sau ghi: đúng một lần, đúng bộ lọc và trang đang xem.
    expect(port.calls).toHaveLength(searches + 1);
    expect(port.calls.at(-1)).toEqual(before);
    expect(el.textContent).toContain('Đã duyệt phiếu TK-R');
    expect(approveButtons(el)).toHaveLength(0);
  });

  it('nguoi khac da duyet truoc (version cu): bao 409, giu man hinh, tai lai khi nguoi dung chon', async () => {
    const fixture = TestBed.createComponent(TicketListPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    // Manager thứ hai duyệt trước trên máy khác: phiếu lên version 4, màn hình này vẫn giữ version 3.
    port.approve(101, 3).subscribe();

    approveButtons(el)[0].click();
    await fixture.whenStable();

    const alert = el.querySelector('[role=alert]');
    expect(alert?.textContent).toContain('Không duyệt được phiếu');
    expect(port.approveCalls.at(-1)).toEqual({ id: 101, version: 3 });
    expect(approveButtons(el)).toHaveLength(1);

    (alert?.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(el.querySelector('[role=alert]')).toBeNull();
    expect(approveButtons(el)).toHaveLength(0);
  });
});
