import { HttpErrorResponse } from '@angular/common/http';
import { problemMessage, toHttpParams } from './http-params';

describe('toHttpParams', () => {
  it('bo qua gia tri rong va gop nhieu nguon', () => {
    const params = toHttpParams(
      { q: '', status: null, type: 'PREPAID' },
      { page: 0, size: 20 },
    );

    expect(params.keys()).toEqual(['type', 'page', 'size']);
    expect(params.get('page')).toBe('0');
  });
});

describe('problemMessage', () => {
  it('lay detail tu ProblemDetail', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { status: 409, detail: 'So thue bao da ton tai' },
    });

    expect(problemMessage(error, 'Loi')).toBe('So thue bao da ton tai');
  });

  it('dung thong bao mac dinh khi khong co detail', () => {
    expect(problemMessage(new Error('boom'), 'Loi')).toBe('Loi');
  });
});
