import { samePage, toPageRequest } from './paging';

describe('toPageRequest', () => {
  it('doi pageIndex 1-based va sort cua nz-table sang Spring Data', () => {
    const page = toPageRequest({
      pageIndex: 3,
      pageSize: 50,
      sort: [{ key: 'msisdn', value: 'ascend' }],
    });

    expect(page).toEqual({ page: 2, size: 50, sort: 'msisdn,asc' });
  });

  it('dung sort mac dinh khi khong cot nao duoc sort', () => {
    const page = toPageRequest({
      pageIndex: 1,
      pageSize: 20,
      sort: [{ key: 'msisdn', value: null }],
    });

    expect(page.sort).toBe('id,desc');
  });
});

describe('samePage', () => {
  it('so sanh theo gia tri', () => {
    expect(
      samePage(
        { page: 0, size: 20, sort: 'id,desc' },
        { page: 0, size: 20, sort: 'id,desc' },
      ),
    ).toBe(true);
    expect(samePage({ page: 0, size: 20 }, { page: 1, size: 20 })).toBe(false);
  });
});
