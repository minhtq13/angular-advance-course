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

/** Trạng thái ô tìm kiếm: dùng để hiện "đang tìm", kết quả, hoặc lỗi. */
export interface LookupState<T> {
  status: 'idle' | 'loading' | 'done' | 'error';
  term: string;
  items: T[];
}

export function idleLookup<T>(term = ''): LookupState<T> {
  return { status: 'idle', term, items: [] };
}

export interface LookupOptions {
  /** Chờ người dùng ngừng gõ bao lâu mới tìm. */
  debounceMs?: number;
  /** Từ khóa ngắn hơn thì không gọi API (khớp quá nhiều, chậm, vô ích). */
  minLength?: number;
}

/**
 * Biến dòng từ khóa người dùng gõ thành dòng trạng thái kết quả tìm kiếm.
 * search: hàm gọi API cho một từ khóa (mỗi lần gọi trả về Observable riêng).
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
      // switchMap: từ khóa mới -> hủy (unsubscribe) request cũ; HttpClient abort XHR.
      // Kết quả của từ khóa cũ không bao giờ ghi đè kết quả của từ khóa mới.
      switchMap((term) =>
        term.length < minLength
          ? of(idleLookup<T>(term))
          : search(term).pipe(
              map((items): LookupState<T> => ({ status: 'done', term, items })),
              startWith<LookupState<T>>({ status: 'loading', term, items: [] }),
              // Bắt lỗi BÊN TRONG switchMap: lỗi chỉ kết thúc request này; luồng từ khóa bên ngoài vẫn sống,
              // người dùng gõ tiếp là tìm tiếp. Bắt bên ngoài thì lỗi đầu tiên làm cả luồng hoàn tất.
              catchError(() =>
                of<LookupState<T>>({ status: 'error', term, items: [] }),
              ),
            ),
      ),
    );
}
