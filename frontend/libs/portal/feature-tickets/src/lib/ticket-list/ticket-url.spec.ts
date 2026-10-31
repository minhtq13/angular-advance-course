import { convertToParamMap } from '@angular/router';
import {
  filtersFromParams,
  NO_FILTERS,
  pageFromParams,
  toQueryParams,
} from './ticket-url';

const params = (p: Record<string, string>) => convertToParamMap(p);

describe('ticket-url', () => {
  it('doc va ghi lai dung URL (khu hoi)', () => {
    const query = {
      status: 'RESOLVED',
      priority: 'HIGH',
      category: 'BILLING',
      mine: '1',
      page: '3',
      size: '50',
      sort: 'createdAt,asc',
    };
    const filters = filtersFromParams(params(query));
    const page = pageFromParams(params(query));

    expect(filters).toEqual({
      status: 'RESOLVED',
      priority: 'HIGH',
      category: 'BILLING',
      onlyMine: true,
    });
    expect(page).toEqual({ page: 2, size: 50, sort: 'createdAt,asc' });
    expect(toQueryParams(filters, page)).toEqual({
      ...query,
      page: 3,
      size: 50,
    });
  });

  it('gia tri mac dinh khong len URL', () => {
    expect(
      toQueryParams(NO_FILTERS, { page: 0, size: 20, sort: 'id,desc' }),
    ).toEqual({});
  });

  it('URL sua tay sai hoac doc hai: bo qua, dung mac dinh', () => {
    const bad = params({
      status: "NEW' OR 1=1",
      priority: 'high',
      category: '<script>',
      mine: 'true',
      page: '-3',
      size: '5000',
      sort: 'password,asc',
    });
    expect(filtersFromParams(bad)).toEqual(NO_FILTERS);
    expect(pageFromParams(bad)).toEqual({ page: 0, size: 20, sort: 'id,desc' });
  });
});
