import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { lookup, LookupState } from './lookup';

// Test theo trình tự sự kiện bằng marble: thời gian ảo, không chờ thật.
// Cú pháp: '-' = 1 frame, 'a' = giá trị (chiếm 1ms), '|' = kết thúc,
// '#' = lỗi, '300ms' = trôi qua 300ms, '^' / '!' = subscribe / unsubscribe.
const loading = (term: string): LookupState<string> => ({
  status: 'loading',
  term,
  items: [],
});
const done = (term: string): LookupState<string> => ({
  status: 'done',
  term,
  items: [term],
});

describe('lookup', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) =>
      expect(actual).toEqual(expected),
    );
  });

  it('cho nguoi dung ngung go 300ms roi moi tim', () => {
    scheduler.run(({ cold, hot, expectObservable }) => {
      const terms = hot('a 100ms b', { a: '0901', b: '09012' });
      const search = (term: string) => cold('50ms (r|)', { r: [term] });

      // 'b' đến ở 101ms; debounce 300ms -> tìm lúc 401ms; kết quả sau 50ms -> 451ms.
      expectObservable(terms.pipe(lookup(search))).toBe('401ms l 49ms d', {
        l: loading('09012'),
        d: done('09012'),
      });
    });
  });

  it('tu khoa cu tra ve muon khong ghi de ket qua moi, va request cu bi huy', () => {
    scheduler.run(({ cold, hot, expectObservable, expectSubscriptions }) => {
      // "0901" khớp nhiều bản ghi nên chậm (1000ms); "09012345" nhanh (100ms).
      const slow = cold('1000ms (r|)', { r: ['0901'] });
      const fast = cold('100ms (r|)', { r: ['09012345'] });
      const search = (term: string): Observable<string[]> =>
        term === '0901' ? slow : fast;
      const terms = hot('a 400ms b', { a: '0901', b: '09012345' });

      expectObservable(terms.pipe(lookup(search))).toBe(
        '300ms x 400ms y 99ms z',
        { x: loading('0901'), y: loading('09012345'), z: done('09012345') },
      );
      // Request "0901" bắt đầu ở 300ms, bị hủy ở 701ms khi có từ khóa mới.
      expectSubscriptions(slow.subscriptions).toBe('300ms ^ 400ms !');
    });
  });

  it('bo qua khoang trang hai dau va khong tim lai cung tu khoa', () => {
    scheduler.run(({ cold, hot, expectObservable }) => {
      const calls: string[] = [];
      const search = (term: string) => {
        calls.push(term);
        return cold('10ms (r|)', { r: [term] });
      };
      const terms = hot('a 400ms b', { a: '0901', b: ' 0901 ' });

      expectObservable(terms.pipe(lookup(search))).toBe('300ms l 9ms d', {
        l: loading('0901'),
        d: done('0901'),
      });
      scheduler.flush();
      expect(calls).toEqual(['0901']);
    });
  });

  it('tu khoa ngan hon 3 ky tu: khong goi API', () => {
    scheduler.run(({ hot, expectObservable }) => {
      const search = vi.fn();
      const terms = hot('a', { a: '09' });

      expectObservable(terms.pipe(lookup(search))).toBe('300ms i', {
        i: { status: 'idle', term: '09', items: [] },
      });
      scheduler.flush();
      expect(search).not.toHaveBeenCalled();
    });
  });

  it('API loi mot lan: bao loi cho tu khoa do, go tiep van tim duoc', () => {
    scheduler.run(({ cold, hot, expectObservable }) => {
      const search = (term: string) =>
        term === '0901'
          ? cold<string[]>('50ms #')
          : cold('50ms (r|)', { r: [term] });
      const terms = hot('a 400ms b', { a: '0901', b: '0902' });

      expectObservable(terms.pipe(lookup(search))).toBe(
        '300ms l 49ms e 350ms m 49ms d',
        {
          l: loading('0901'),
          e: { status: 'error', term: '0901', items: [] },
          m: loading('0902'),
          d: done('0902'),
        },
      );
    });
  });
});
