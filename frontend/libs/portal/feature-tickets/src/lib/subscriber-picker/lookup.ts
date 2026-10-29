import {
  catchError,
  debounceTime,
  map,
  mergeMap,
  Observable,
  of,
  OperatorFunction,
} from 'rxjs';

/** Trang thai o tim kiem: dung de hien "dang tim", ket qua, hoac loi. */
export interface LookupState<T> {
  status: 'idle' | 'loading' | 'done' | 'error';
  term: string;
  items: T[];
}

export function idleLookup<T>(term = ''): LookupState<T> {
  return { status: 'idle', term, items: [] };
}

/**
 * Bien dong tu khoa nguoi dung go thanh dong trang thai ket qua tim kiem.
 * search: ham goi API cho mot tu khoa (moi lan goi tra ve Observable rieng).
 */
export function lookup<T>(
  search: (term: string) => Observable<T[]>,
  debounceMs = 300,
): OperatorFunction<string, LookupState<T>> {
  return (terms) =>
    terms.pipe(
      debounceTime(debounceMs),
      mergeMap((term) =>
        search(term).pipe(
          map((items): LookupState<T> => ({ status: 'done', term, items })),
        ),
      ),
      catchError(() =>
        of<LookupState<T>>({ status: 'error', term: '', items: [] }),
      ),
    );
}
