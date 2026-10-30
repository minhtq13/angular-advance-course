import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { DOCUMENT, inject } from '@angular/core';
import { APP_CONFIG } from '@care/shared-util-config';
import { catchError, of, switchMap, throwError } from 'rxjs';
import { apiPathOf } from './api-url';
import { AuthService } from './auth.service';

const withBearer = <T>(req: HttpRequest<T>, token: string | null) =>
  token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

/** Chỉ gắn token cho request tới API của mình - không làm lộ token sang domain khác. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const { apiUrl } = inject(APP_CONFIG);

  // Endpoint đăng nhập/refresh không cần token. Gửi kèm token đã hết hạn -> server từ chối (401)
  // ngay cả ở endpoint permitAll, refresh không bao giờ thành công.
  const path = apiPathOf(req.url, apiUrl, inject(DOCUMENT).baseURI);
  if (path === null || path.startsWith('/api/auth/')) {
    return next(req);
  }

  const token = auth.accessToken();

  return next(withBearer(req, token)).pipe(
    catchError((error: unknown) => {
      // Chỉ refresh khi request CÓ gửi token mà bị từ chối (token hết hạn / bị revoke).
      // Request không có token (vd trang cũ còn gọi API ngay lúc đăng xuất) -> chỉ trả lời,
      // không điều hướng, tránh tranh chấp với điều hướng của logout().
      if (error instanceof HttpErrorResponse && error.status === 401 && token) {
        // Access token hết hạn -> lấy token mới, gửi lại request một lần.
        // Refresh lỗi thì AuthService tự đăng xuất (một lần); ở đây chỉ trả lời cho nơi gọi.
        const current = auth.accessToken();
        if (!current) {
          // Phiên đã kết thúc trong lúc request này chờ (refresh trước đó thất bại, người dùng đăng xuất).
          return throwError(() => error);
        }
        // Token hiện tại đã khác token đã gửi: request khác vừa refresh xong (401 này về muộn) -> dùng luôn.
        const freshToken$ = current !== token ? of(current) : auth.refresh();
        return freshToken$.pipe(
          switchMap((freshToken) => next(withBearer(req, freshToken))),
        );
      }
      return throwError(() => error);
    }),
  );
};
