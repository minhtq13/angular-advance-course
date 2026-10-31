import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Ticket } from './ticket';

@Component({
  selector: 'tr[app-ticket-row]',
  standalone: false,
  template: `
    <td>TK-{{ ticket.id }}</td>
    <td>{{ ticket.title | shorten: 40 : '…' }}</td>
    <td>{{ ticket.subscriber }}</td>
    <td>{{ ticket.priority | priorityLabel }}</td>
    <td>{{ ticket.createdAt | date: 'dd/MM HH:mm' }}</td>
    <td>
      <button *ngIf="ticket.status === 'NEW'; else done" type="button" (click)="approve.emit(ticket.id)">
        Duyệt
      </button>
      <ng-template #done>{{ ticket.status }}</ng-template>
    </td>
  `,
})
export class TicketRowComponent {
  @Input() ticket!: Ticket;
  @Output() approve = new EventEmitter<number>();
}
