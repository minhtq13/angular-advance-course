import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '@care/portal-domain-tickets';

export type TagColor =
  'success' | 'processing' | 'warning' | 'error' | 'default';

export interface TicketTag {
  /** Key dịch (Transloco), không phải chữ hiển thị. */
  labelKey: string;
  color: TagColor;
}

// Trùng với TICKET_STATUS/TICKET_PRIORITY trong shared-data-access-api: lib ui không được import data-access.
// Nợ kỹ thuật: bài tập về nhà buổi 2 thiết kế lại cho nhãn hiển thị dùng chung (lib nào, tag gì).
export const STATUS_TAG: Record<TicketStatus, TicketTag> = {
  NEW: { labelKey: 'enum.ticketStatus.NEW', color: 'processing' },
  IN_PROGRESS: { labelKey: 'enum.ticketStatus.IN_PROGRESS', color: 'warning' },
  RESOLVED: { labelKey: 'enum.ticketStatus.RESOLVED', color: 'success' },
  CLOSED: { labelKey: 'enum.ticketStatus.CLOSED', color: 'default' },
};

export const PRIORITY_TAG: Record<TicketPriority, TicketTag> = {
  LOW: { labelKey: 'enum.ticketPriority.LOW', color: 'default' },
  MEDIUM: { labelKey: 'enum.ticketPriority.MEDIUM', color: 'processing' },
  HIGH: { labelKey: 'enum.ticketPriority.HIGH', color: 'warning' },
  URGENT: { labelKey: 'enum.ticketPriority.URGENT', color: 'error' },
};

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  BILLING: 'enum.ticketCategory.BILLING',
  NETWORK: 'enum.ticketCategory.NETWORK',
  SERVICE: 'enum.ticketCategory.SERVICE',
  OTHER: 'enum.ticketCategory.OTHER',
};
