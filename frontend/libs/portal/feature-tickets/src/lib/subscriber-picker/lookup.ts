import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  OperatorFunction,
  startWith,
  switchMap,
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

export interface LookupOptions {
  /** Cho nguoi dung ngung go bao lau moi tim. */
  debounceMs?: number;
  /** Tu khoa ngan hon thi khong goi API (khop qua nhieu, cham, vo ich). */
  minLength?: number;
}

/**
 * Bien dong tu khoa nguoi dung go thanh dong trang thai ket qua tim kiem.
 * search: ham goi API cho mot tu khoa (moi lan goi tra ve Observable rieng).
 */
export function lookup<T>(
  search: (term: string) => Observable<T[]>,
  { debounceMs = 300, minLength = 3 }: LookupOptions = {},
): OperatorFunction<string, LookupState<T>> {
  return (terms) =>
    terms.pipe(
      map((term) => term.trim()),
      debounceTime(debounceMs),
      distinctUntilChanged(),
      // switchMap: tu khoa moi -> huy (unsubscribe) request cu; HttpClient abort XHR.
      // Ket qua cua tu khoa cu khong bao gio ghi de ket qua cua tu khoa moi.
      switchMap((term) =>
        term.length < minLength
          ? of(idleLookup<T>(term))
          : search(term).pipe(
              map((items): LookupState<T> => ({ status: 'done', term, items })),
              startWith<LookupState<T>>({ status: 'loading', term, items: [] }),
              // Bat loi BEN TRONG switchMap: loi chi ket thuc request nay; luong tu khoa ben ngoai van song,
              // nguoi dung go tiep la tim tiep. Bat ben ngoai thi loi dau tien lam ca luong hoan tat.
              catchError(() =>
                of<LookupState<T>>({ status: 'error', term, items: [] }),
              ),
            ),
      ),
    );
}
