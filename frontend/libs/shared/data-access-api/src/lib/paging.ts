import { PageRequest } from './models';

export const DEFAULT_PAGE: PageRequest = { page: 0, size: 20, sort: 'id,desc' };

/** So sánh theo giá trị để signal không phát lại khi nz-table emit cùng trang (tránh gọi API trùng). */
export function samePage(a: PageRequest, b: PageRequest): boolean {
  return a.page === b.page && a.size === b.size && a.sort === b.sort;
}

interface TableQuery {
  pageIndex: number;
  pageSize: number;
  sort: { key: string; value: string | null }[];
}

/** nz-table dùng pageIndex từ 1 và 'ascend'/'descend'; Spring Data dùng page từ 0 và "field,asc". */
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
