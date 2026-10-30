import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { APP_CONFIG } from '@care/shared-util-config';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const withBearer = <T>(req: HttpRequest<T>, token: string | null) =>
  token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

/** Chỉ gắn token cho request tới API của mình - không làm lộ token sang domain khác. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const { apiUrl } = inject(APP_CONFIG);

  // Endpoint đăng nhập/refresh không cần token. Gửi kèm token đã hết hạn -> server từ chối (401)
  // ngay cả ở endpoint permitAll, refresh không bao giờ thành công.
  const isAuthEndpoint = req.url.startsWith(`${apiUrl}/api/auth/`);
  if (!req.url.startsWith(apiUrl) || isAuthEndpoint) {
    return next(req);
  }

  const token = auth.accessToken();

  return next(withBearer(req, token)).pipe(
    catchError((error: unknown) => {
      // Chỉ refresh khi request CÓ gửi token mà bị từ chối (token hết hạn / bị revoke).
      // Request không có token (vd trang cũ còn gọi API ngay lúc đăng xuất) -> chỉ trả lời,
      // không điều hướng, tránh tranh chấp với điều hướng của logout().
      if (error instanceof HttpErrorResponse && error.status === 401 && token) {
        // Access token hết hạn -> đổi refresh token lấy token mới, gửi lại request một lần.
        return auth.refresh().pipe(
          switchMap((freshToken) => next(withBearer(req, freshToken))),
          catchError((refreshError: unknown) => {
            // Refresh không được (hết hạn, bị revoke) -> đăng nhập lại, quay về đúng trang.
            auth.login(router.url);
            return throwError(() => refreshError);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
