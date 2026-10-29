/**
 * Mo hinh phieu yeu cau theo goc nhin nghiep vu cua man hinh.
 * Khong phu thuoc HTTP hay hinh dang JSON cua backend: adapter chiu trach nhiem chuyen doi.
 */
export type TicketCategory = 'BILLING' | 'NETWORK' | 'SERVICE' | 'OTHER';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TicketSummary {
  id: number;
  code: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  subscriberId: number;
  subscriberMsisdn: string;
  subscriberName: string;
  assignee: string | null;
  createdAt: string;
  /** Dung cho optimistic locking: gui kem khi ghi, backend tra 409 neu da cu. */
  version: number;
}

export interface CreateTicketCommand {
  subscriberId: number;
  category: TicketCategory;
  priority: TicketPriority;
  title: string;
  description?: string;
}

export interface TicketQuery {
  status?: TicketStatus | null;
  priority?: TicketPriority | null;
  assignee?: string | null;
}

export interface PageQuery {
  /** Trang tinh tu 0. */
  page: number;
  size: number;
  /** Dang "field,asc" | "field,desc". */
  sort?: string;
}

export interface TicketPage {
  items: TicketSummary[];
  total: number;
}
