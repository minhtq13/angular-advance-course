import { ParamMap, Params } from '@angular/router';
import { TicketPriority, TicketStatus } from '@care/portal-domain-tickets';
import { DEFAULT_PAGE, PageRequest } from '@care/shared-data-access-api';

export interface TicketFilters {
  status: TicketStatus | null;
  priority: TicketPriority | null;
  onlyMine: boolean;
}

export const NO_FILTERS: TicketFilters = {
  status: null,
  priority: null,
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
const PAGE_SIZES: readonly number[] = [20, 50, 100];
/** Chi cot ma bang cho sap xep (nzColumnKey). */
const SORT = /^(code|priority|createdAt),(asc|desc)$/;

function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[],
): T | null {
  return allowed.includes(value as T) ? (value as T) : null;
}

/** Doc bo loc tu URL. Gia tri sai bi bo qua: URL la input nguoi dung sua tay duoc, khong tin. */
export function filtersFromParams(params: ParamMap): TicketFilters {
  return {
    status: oneOf(params.get('status'), STATUSES),
    priority: oneOf(params.get('priority'), PRIORITIES),
    onlyMine: params.get('mine') === '1',
  };
}

/** Tren URL trang dem tu 1 (de doc, de chia se); trong code dem tu 0 nhu Spring Data. */
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

/** Bo gia tri mac dinh de URL gon: /tickets?status=NEW thay vi ...&page=1&size=20&sort=id,desc. */
export function toQueryParams(
  filters: TicketFilters,
  page: PageRequest,
): Params {
  const params: Params = {};
  if (filters.status) params['status'] = filters.status;
  if (filters.priority) params['priority'] = filters.priority;
  if (filters.onlyMine) params['mine'] = '1';
  if (page.page > 0) params['page'] = page.page + 1;
  if (page.size !== DEFAULT_PAGE.size) params['size'] = page.size;
  if (page.sort !== DEFAULT_PAGE.sort) params['sort'] = page.sort;
  return params;
}
