import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideZoneChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgPipesModule } from 'ngx-pipes';
import { ToastrService } from 'ngx-toastr';
import { Ticket } from './ticket';
import { PriorityLabelPipe } from './priority-label.pipe';
import { TicketListComponent } from './ticket-list.component';
import { TicketRowComponent } from './ticket-row.component';

const TICKETS: Ticket[] = [
  { id: 1, title: 'Mạng yếu', subscriber: '0900000001', priority: 'HIGH', status: 'NEW', createdAt: '2026-10-30T08:00:00Z' },
  { id: 2, title: 'Đổi gói', subscriber: '0900000002', priority: 'LOW', status: 'RESOLVED', createdAt: '2026-10-30T09:00:00Z' },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('TicketListComponent', () => {
  let fixture: ComponentFixture<TicketListComponent>;
  let el: HTMLElement;
  const toastr = { success: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ReactiveFormsModule, NgPipesModule],
      declarations: [TicketListComponent, TicketRowComponent, PriorityLabelPipe],
      // Như AppModule: app chạy với zone.js.
      providers: [provideZoneChangeDetection(), { provide: ToastrService, useValue: toastr }],
    }).compileComponents();
    fixture = TestBed.createComponent(TicketListComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('tickets.json').flush(TICKETS);
    fixture.detectChanges();
  });

  it('hien moi phieu va so phieu moi', () => {
    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    expect(el.querySelector('h1')?.textContent).toContain('1 phiếu mới');
  });

  it('loc theo trang thai', () => {
    const select = el.querySelector('select') as HTMLSelectElement;
    select.value = 'RESOLVED';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(el.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('duyet phieu: bao thanh cong, tu an dong "Da duyet" sau thoi gian quy dinh', async () => {
    TicketListComponent.flashMs = 20;
    fixture.autoDetectChanges();
    (el.querySelector('tbody button') as HTMLButtonElement).click();
    await sleep(0);
    expect(toastr.success).toHaveBeenCalledWith('Đã duyệt phiếu TK-1');
    expect(el.querySelector('.flash')?.textContent).toContain('TK-1');

    // Như người dùng: không ai gọi detectChanges, màn hình phải tự cập nhật.
    await sleep(60);
    expect(el.querySelector('.flash')).toBeNull();
  });
});
