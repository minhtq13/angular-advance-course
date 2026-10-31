import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { NgStringPipesModule } from 'ngx-pipes';
import { PriorityLabelPipe } from './priority-label.pipe';
import { Ticket } from './ticket';

@Component({
  selector: 'tr[app-ticket-row]',
  // signal-input-migration bỏ qua input này (dùng trong @if, sợ hỏng narrowing): chuyển tay,
  // đọc ticket() một lần bằng @let.
  template: `
    @let t = ticket();
    <td>TK-{{ t.id }}</td>
    <td>{{ t.title | shorten: 40 : '…' }}</td>
    <td>{{ t.subscriber }}</td>
    <td>{{ t.priority | priorityLabel }}</td>
    <td>{{ t.createdAt | date: 'dd/MM HH:mm' }}</td>
    <td>
      @if (t.status === 'NEW') {
        <button type="button" (click)="approve.emit(t.id)">Duyệt</button>
      } @else {
        {{ t.status }}
      }
    </td>
  `,
  imports: [DatePipe, NgStringPipesModule, PriorityLabelPipe],
})
export class TicketRowComponent {
  readonly ticket = input.required<Ticket>();
  readonly approve = output<number>();
}
