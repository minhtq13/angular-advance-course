import { ParamMap, Params } from '@angular/router';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from '@care/portal-domain-tickets';
import { DEFAULT_PAGE, PageRequest } from '@care/shared-data-access-api';

export interface TicketFilters {
  status: TicketStatus | null;
  priority: TicketPriority | null;
  category: TicketCategory | null;
  onlyMine: boolean;
}

export const NO_FILTERS: TicketFilters = {
  status: null,
  priority: null,
  category: null,
  onlyMine: false,
};

const STATUSES: readonly TicketStatus[] = [
  'NEW',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
];
const PRIORITIES: readonly TicketPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];
const CATEGORIES: readonly TicketCategory[] = [
  'BILLING',
  'NETWORK',
  'SERVICE',
  'OTHER',
];
const PAGE_SIZES: readonly number[] = [20, 50, 100];
/** Chỉ cột mã bảng cho sắp xếp (nzColumnKey). */
const SORT = /^(code|priority|createdAt),(asc|desc)$/;

function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/** Đọc bộ lọc từ URL. Giá trị sai bị bỏ qua: URL là input người dùng sửa tay được, không tin. */
export function filtersFromParams(params: ParamMap): TicketFilters {
  return {
    status: oneOf(params.get('status'), STATUSES),
    priority: oneOf(params.get('priority'), PRIORITIES),
    category: oneOf(params.get('category'), CATEGORIES),
    onlyMine: params.get('mine') === '1',
  };
}

/** Trên URL trang đếm từ 1 (để đọc, để chia sẻ); trong code đếm từ 0 như Spring Data. */
export function pageFromParams(params: ParamMap): PageRequest {
  const page = Number(params.get('page'));
  const size = Number(params.get('size'));
  const sort = params.get('sort');
  return {
    page: Number.isInteger(page) && page >= 1 ? page - 1 : 0,
    size: PAGE_SIZES.includes(size) ? size : DEFAULT_PAGE.size,
    sort: sort && SORT.test(sort) ? sort : DEFAULT_PAGE.sort,
  };
}

/** Bỏ giá trị mặc định để URL gọn: /tickets?status=NEW thay vì ...&page=1&size=20&sort=id,desc. */
export function toQueryParams(
  filters: TicketFilters,
  page: PageRequest,
): Params {
  const params: Params = {};
  if (filters.status) params['status'] = filters.status;
  if (filters.priority) params['priority'] = filters.priority;
  if (filters.category) params['category'] = filters.category;
  if (filters.onlyMine) params['mine'] = '1';
  if (page.page > 0) params['page'] = page.page + 1;
  if (page.size !== DEFAULT_PAGE.size) params['size'] = page.size;
  if (page.sort !== DEFAULT_PAGE.sort) params['sort'] = page.sort;
  return params;
}
