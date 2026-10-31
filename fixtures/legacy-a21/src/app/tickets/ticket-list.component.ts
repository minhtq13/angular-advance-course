import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, map, startWith } from 'rxjs';
import { Ticket, TicketStatus } from './ticket';
import { TicketService } from './ticket.service';

@Component({
  selector: 'app-ticket-list',
  standalone: false,
  template: `
    <h1>Phiếu yêu cầu <small>({{ newCount$ | async }} phiếu mới)</small></h1>
    <label for="status">Trạng thái</label>
    <select id="status" [formControl]="status">
      <option value="">Tất cả</option>
      <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
    </select>
    <p *ngIf="lastApproved" class="flash">Đã duyệt TK-{{ lastApproved }}</p>
    <table *ngIf="visible$ | async as list">
      <tbody>
        <tr *ngFor="let t of list; trackBy: byId" app-ticket-row [ticket]="t" (approve)="onApprove($event)"></tr>
      </tbody>
    </table>
    <p *ngIf="(visible$ | async)?.length === 0" class="empty">Không có phiếu nào</p>
  `,
})
export class TicketListComponent implements OnInit {
  readonly statuses: TicketStatus[] = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  readonly status = new FormControl<TicketStatus | ''>('', { nonNullable: true });
  visible$!: Observable<Ticket[]>;
  newCount$!: Observable<number>;
  /** Thời gian hiện dòng "Đã duyệt" (ms); test đặt nhỏ lại. */
  static flashMs = 3000;
  /** Kiểu cũ (cố ý): field thường, gán trong setTimeout -> chỉ hiện/ẩn đúng nhờ zone.js. */
  lastApproved: number | null = null;

  constructor(
    private tickets: TicketService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.tickets.load().subscribe();
    this.newCount$ = this.tickets.countNew();
    this.visible$ = combineLatest([
      this.tickets.tickets,
      this.status.valueChanges.pipe(startWith(this.status.value)),
    ]).pipe(map(([list, s]) => (s ? list.filter((t) => t.status === s) : list)));
  }

  onApprove(id: number): void {
    this.tickets.approve(id);
    this.toastr.success(`Đã duyệt phiếu TK-${id}`);
    this.lastApproved = id;
    setTimeout(() => (this.lastApproved = null), TicketListComponent.flashMs);
  }

  byId(_: number, t: Ticket): number {
    return t.id;
  }
}
