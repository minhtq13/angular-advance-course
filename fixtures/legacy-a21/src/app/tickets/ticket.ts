export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Ticket {
  id: number;
  title: string;
  subscriber: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
}
