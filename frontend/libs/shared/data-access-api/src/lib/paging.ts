import { PageRequest } from './models';

export const DEFAULT_PAGE: PageRequest = { page: 0, size: 20, sort: 'id,desc' };

/** So sanh theo gia tri de signal khong phat lai khi nz-table emit cung trang (tranh goi API trung). */
export function samePage(a: PageRequest, b: PageRequest): boolean {
  return a.page === b.page && a.size === b.size && a.sort === b.sort;
}

interface TableQuery {
  pageIndex: number;
  pageSize: number;
  sort: { key: string; value: string | null }[];
}

/** nz-table dung pageIndex tu 1 va 'ascend'/'descend'; Spring Data dung page tu 0 va "field,asc". */
export function toPageRequest(
  query: TableQuery,
  fallbackSort = DEFAULT_PAGE.sort,
): PageRequest {
  const active = query.sort.find((s) => s.value !== null);
  return {
    page: query.pageIndex - 1,
    size: query.pageSize,
    sort: active
      ? `${active.key},${active.value === 'ascend' ? 'asc' : 'desc'}`
      : fallbackSort,
  };
}
