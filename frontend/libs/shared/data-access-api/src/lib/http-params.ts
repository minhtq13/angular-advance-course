import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ProblemDetail } from './models';

/** Bỏ qua giá trị rỗng để URL gọn và khớp @ModelAttribute của Spring. */
export function toHttpParams(...sources: object[]): HttpParams {
  let params = new HttpParams();
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    }
  }
  return params;
}

/** detail từ backend đã dùng ngôn ngữ (header Accept-Language); fallback do nơi gọi truyền vào (đã dịch). */
export function problemMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const problem = error.error as ProblemDetail | null;
    return problem?.detail ?? fallback;
  }
  return fallback;
}
