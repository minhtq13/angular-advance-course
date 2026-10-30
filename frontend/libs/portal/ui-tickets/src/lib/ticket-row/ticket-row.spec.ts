import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TicketSummary } from '@care/portal-domain-tickets';
import { aTicket } from '@care/portal-domain-tickets/testing';
import { provideI18nTesting } from '@care/shared-util-i18n/testing';
import { TicketRow } from './ticket-row';

// Test hợp đồng: đưa input vào, kiểm tra DOM và output; không có service nào.
@Component({
  imports: [TicketRow],
  template: `<table>
    <tbody>
      <tr
        care-ticket-row
        [ticket]="ticket()"
        [canApprove]="canApprove()"
        [approving]="approving()"
        (approve)="approved.push($event)"
      ></tr>
    </tbody>
  </table>`,
})
class Host {
  readonly ticket = signal<TicketSummary>(
    aTicket({ code: 'TK-9', status: 'RESOLVED', assignee: null }),
  );
  readonly canApprove = signal(false);
  readonly approving = signal(false);
  readonly approved: TicketSummary[] = [];
}

describe('TicketRow', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideRouter([]), provideI18nTesting()],
    }),
  );

  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return fixture;
  }

  it('render 9 o, dung ma phieu va nhan "Chua giao" khi chua co nguoi xu ly', async () => {
    const fixture = await render();
    const cells = fixture.nativeElement.querySelectorAll('td');
    expect(cells).toHaveLength(9);
    expect(cells[0].textContent.trim()).toBe('TK-9');
    expect(cells[6].textContent).toContain('Chưa giao');
  });

  it('chi hien nut Duyet khi canApprove; bam thi phat approve voi dung phieu', async () => {
    const fixture = await render();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    fixture.componentInstance.canApprove.set(true);
    await fixture.whenStable();
    (
      fixture.nativeElement.querySelector('button') as HTMLButtonElement
    ).click();

    expect(fixture.componentInstance.approved.map((t) => t.code)).toEqual([
      'TK-9',
    ]);
  });

  it('dang duyet thi nut bi vo hieu, khong phat them su kien', async () => {
    const fixture = await render();
    fixture.componentInstance.canApprove.set(true);
    fixture.componentInstance.approving.set(true);
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    button.click();
    expect(fixture.componentInstance.approved).toEqual([]);
  });
});
