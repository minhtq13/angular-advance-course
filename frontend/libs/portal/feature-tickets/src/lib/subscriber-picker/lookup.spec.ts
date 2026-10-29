import { TestScheduler } from 'rxjs/testing';
import { lookup, LookupState } from './lookup';

// Test theo trinh tu su kien bang marble: thoi gian ao, khong cho that.
// Cu phap: '-' = 1 khung thoi gian, 'a' = gia tri, '|' = ket thuc, '300ms' = troi qua 300ms.
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
      const done = (term: string): LookupState<string> => ({
        status: 'done',
        term,
        items: [term],
      });

      // 'b' den o 101ms; debounce 300ms -> tim luc 401ms; ket qua sau 50ms -> 451ms.
      expectObservable(terms.pipe(lookup(search))).toBe('451ms d', {
        d: done('09012'),
      });
    });
  });
});
