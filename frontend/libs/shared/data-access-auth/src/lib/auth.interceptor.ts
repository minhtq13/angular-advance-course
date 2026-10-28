import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG } from '@care/shared-util-config';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Chi gan token cho request toi API cua minh - khong lam lo token sang domain khac. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const { apiUrl } = inject(APP_CONFIG);

  if (!req.url.startsWith(apiUrl)) {
    return next(req);
  }

  const token = auth.accessToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      // 401 tu /api/auth/login la "sai mat khau" -> de man hinh dang nhap tu xu ly.
      const isAuthEndpoint = req.url.startsWith(`${apiUrl}/api/auth/`);
      // Chi bat dang nhap lai khi request CO gui token ma bi tu choi (token het han / bi thu hoi).
      // Request khong co token (vd trang cu con goi API ngay luc dang xuat) -> chi tra loi,
      // khong dieu huong, tranh tranh chap voi dieu huong cua logout().
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        token &&
        !isAuthEndpoint
      ) {
        // Token het han/khong hop le. Buoi 6: thu refresh token truoc khi bat dang nhap lai.
        auth.login(router.url);
      }
      return throwError(() => error);
    }),
  );
};
