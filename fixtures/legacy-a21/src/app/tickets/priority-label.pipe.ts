import { Pipe, PipeTransform } from '@angular/core';
import { TicketPriority } from './ticket';

const LABELS: Record<TicketPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

@Pipe({ name: 'priorityLabel' })
export class PriorityLabelPipe implements PipeTransform {
  transform(value: TicketPriority): string {
    return LABELS[value] ?? value;
  }
}
