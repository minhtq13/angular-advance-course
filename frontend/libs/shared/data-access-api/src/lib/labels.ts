import {
  SubscriberStatus,
  SubscriberType,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from './models';

/** Màu preset của nz-tag. */
export type TagColor =
  'success' | 'processing' | 'warning' | 'error' | 'default';

/** labelKey là key dịch (Transloco), KHÔNG phải chữ hiển thị: dùng với pipe `| transloco`. */
export interface TagLabel {
  labelKey: string;
  color: TagColor;
}

export const SUBSCRIBER_STATUS: Record<SubscriberStatus, TagLabel> = {
  ACTIVE: { labelKey: 'enum.subscriberStatus.ACTIVE', color: 'success' },
  SUSPENDED: { labelKey: 'enum.subscriberStatus.SUSPENDED', color: 'warning' },
  TERMINATED: { labelKey: 'enum.subscriberStatus.TERMINATED', color: 'error' },
};

export const SUBSCRIBER_TYPE: Record<SubscriberType, string> = {
  PREPAID: 'enum.subscriberType.PREPAID',
  POSTPAID: 'enum.subscriberType.POSTPAID',
};

export const TICKET_STATUS: Record<TicketStatus, TagLabel> = {
  NEW: { labelKey: 'enum.ticketStatus.NEW', color: 'processing' },
  IN_PROGRESS: { labelKey: 'enum.ticketStatus.IN_PROGRESS', color: 'warning' },
  RESOLVED: { labelKey: 'enum.ticketStatus.RESOLVED', color: 'success' },
  CLOSED: { labelKey: 'enum.ticketStatus.CLOSED', color: 'default' },
};

export const TICKET_PRIORITY: Record<TicketPriority, TagLabel> = {
  LOW: { labelKey: 'enum.ticketPriority.LOW', color: 'default' },
  MEDIUM: { labelKey: 'enum.ticketPriority.MEDIUM', color: 'processing' },
  HIGH: { labelKey: 'enum.ticketPriority.HIGH', color: 'warning' },
  URGENT: { labelKey: 'enum.ticketPriority.URGENT', color: 'error' },
};

export const TICKET_CATEGORY: Record<TicketCategory, string> = {
  BILLING: 'enum.ticketCategory.BILLING',
  NETWORK: 'enum.ticketCategory.NETWORK',
  SERVICE: 'enum.ticketCategory.SERVICE',
  OTHER: 'enum.ticketCategory.OTHER',
};

/** Chuyển Record nhãn thành danh sách option cho nz-select (labelKey cần dịch bằng pipe transloco). */
export function toOptions<K extends string>(
  labels: Record<K, string | TagLabel>,
) {
  return (Object.entries(labels) as [K, string | TagLabel][]).map(
    ([value, l]) => ({
      value,
      labelKey: typeof l === 'string' ? l : l.labelKey,
    }),
  );
}
