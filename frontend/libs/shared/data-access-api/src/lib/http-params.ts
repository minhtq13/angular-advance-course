import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { ProblemDetail } from './models';

/** Bo qua gia tri rong de URL gon va khop @ModelAttribute cua Spring. */
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

/** detail tu backend da dung ngon ngu (header Accept-Language); fallback do noi goi truyen vao (da dich). */
export function problemMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const problem = error.error as ProblemDetail | null;
    return problem?.detail ?? fallback;
  }
  return fallback;
}
