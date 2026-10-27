import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_CONFIG } from '@care/shared-util-config';
import { LanguageService } from './language.service';

/** Bao backend ngon ngu dang dung -> thong bao loi (ProblemDetail.detail) tra ve dung ngon ngu. */
export const acceptLanguageInterceptor: HttpInterceptorFn = (req, next) => {
  const { apiUrl } = inject(APP_CONFIG);
  if (!req.url.startsWith(apiUrl)) {
    return next(req);
  }
  return next(
    req.clone({
      setHeaders: { 'Accept-Language': inject(LanguageService).lang() },
    }),
  );
};
