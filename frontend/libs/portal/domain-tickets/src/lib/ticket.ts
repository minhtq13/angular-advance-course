/**
 * Mô hình phiếu yêu cầu theo góc nhìn nghiệp vụ của màn hình.
 * Không phụ thuộc HTTP hay hình dạng JSON của backend: adapter chịu trách nhiệm chuyển đổi.
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
  /** Dùng cho optimistic locking: gửi kèm khi ghi, backend trả 409 nếu đã cũ. */
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
  category?: TicketCategory | null;
  assignee?: string | null;
}

export interface PageQuery {
  /** Trang tính từ 0. */
  page: number;
  size: number;
  /** Dạng "field,asc" | "field,desc". */
  sort?: string;
}

export interface TicketPage {
  items: TicketSummary[];
  total: number;
}
