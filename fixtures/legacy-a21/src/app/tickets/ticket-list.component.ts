import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, combineLatest, map, startWith } from 'rxjs';
import { Ticket, TicketStatus } from './ticket';
import { NotificationService } from '../shared/notification.service';
import { TicketService } from './ticket.service';
import { AsyncPipe } from '@angular/common';
import { TicketRowComponent } from './ticket-row.component';

@Component({
  selector: 'app-ticket-list',
  template: `
    <h1>
      Phiếu yêu cầu <small>({{ newCount$ | async }} phiếu mới)</small>
    </h1>
    <label for="status">Trạng thái</label>
    <select id="status" [formControl]="status">
      <option value="">Tất cả</option>
      @for (s of statuses; track s) {
        <option [value]="s">{{ s }}</option>
      }
    </select>
    @if (lastApproved(); as id) {
      <p class="flash">Đã duyệt TK-{{ id }}</p>
    }
    @if (visible$ | async; as list) {
      <table>
        <tbody>
          @for (t of list; track byId($index, t)) {
            <tr app-ticket-row [ticket]="t" (approve)="onApprove($event)"></tr>
          }
        </tbody>
      </table>
    }
    @if ((visible$ | async)?.length === 0) {
      <p class="empty">Không có phiếu nào</p>
    }
  `,
  imports: [ReactiveFormsModule, TicketRowComponent, AsyncPipe],
})
export class TicketListComponent implements OnInit {
  private tickets = inject(TicketService);
  private notifications = inject(NotificationService);

  readonly statuses: TicketStatus[] = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  readonly status = new FormControl<TicketStatus | ''>('', { nonNullable: true });
  visible$!: Observable<Ticket[]>;
  newCount$!: Observable<number>;
  /** Thời gian hiện dòng "Đã duyệt" (ms); test đặt nhỏ lại. */
  static flashMs = 3000;
  /** Signal: không có zone.js thì field thường gán trong setTimeout không làm màn hình cập nhật. */
  readonly lastApproved = signal<number | null>(null);

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
    this.notifications.success(`Đã duyệt phiếu TK-${id}`);
    this.lastApproved.set(id);
    setTimeout(() => this.lastApproved.set(null), TicketListComponent.flashMs);
  }

  byId(_: number, t: Ticket): number {
    return t.id;
  }
}
