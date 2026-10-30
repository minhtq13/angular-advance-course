import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { APP_CONFIG } from '@care/shared-util-config';
import { LanguageService } from './language.service';

/** Báo backend ngôn ngữ đang dùng -> thông báo lỗi (ProblemDetail.detail) trả về đúng ngôn ngữ. */
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
