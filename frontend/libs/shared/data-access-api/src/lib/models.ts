export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PageRequest {
  page: number;
  size: number;
  /** Dạng "field,asc" | "field,desc" theo quy ước Spring Data. */
  sort?: string;
}

export type SubscriberType = 'PREPAID' | 'POSTPAID';
export type SubscriberStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';

export interface Subscriber {
  id: number;
  msisdn: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  province: string;
  type: SubscriberType;
  status: SubscriberStatus;
  planCode: string;
  activatedAt: string;
  updatedAt: string;
  version: number;
}

export interface SubscriberSearch {
  q?: string;
  status?: SubscriberStatus | null;
  type?: SubscriberType | null;
  province?: string | null;
}

export interface CreateSubscriberRequest {
  msisdn: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  province: string;
  type: SubscriberType;
  planCode: string;
}

export interface ServicePlan {
  code: string;
  name: string;
  type: SubscriberType;
  monthlyFee: number;
  dataGb: number;
}

export type TicketCategory = 'BILLING' | 'NETWORK' | 'SERVICE' | 'OTHER';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Ticket {
  id: number;
  code: string;
  subscriberId: number;
  subscriberMsisdn: string;
  subscriberName: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  title: string;
  description: string | null;
  assignee: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TicketSearch {
  status?: TicketStatus | null;
  priority?: TicketPriority | null;
  subscriberId?: number | null;
  assignee?: string | null;
}

export interface CreateTicketRequest {
  subscriberId: number;
  category: TicketCategory;
  priority: TicketPriority;
  title: string;
  description?: string;
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee?: string;
  version: number;
}

export interface AdminStats {
  subscribersByStatus: Partial<Record<SubscriberStatus, number>>;
  ticketsByStatus: Partial<Record<TicketStatus, number>>;
}

/** RFC 9457 - backend trả về khi lỗi. */
export interface ProblemDetail {
  status: number;
  title?: string;
  detail?: string;
  errors?: Record<string, string>;
}
