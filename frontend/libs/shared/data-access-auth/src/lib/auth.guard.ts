import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Chỉ chấp nhận đường dẫn nội bộ ("/..."), chặn "//evil.com" và quay lại /login -> tránh open redirect
 * khi returnUrl đến từ query string mà ai cũng sửa được.
 */
export function safeReturnUrl(url: unknown): string {
  return typeof url === 'string' &&
    url.startsWith('/') &&
    !url.startsWith('//') &&
    !url.startsWith('/login')
    ? url
    : '/';
}

/** Chưa đăng nhập -> sang /login, kèm returnUrl để quay lại đúng trang. */
export const authGuard: CanActivateFn = (_route, state) =>
  inject(AuthService).isAuthenticated() ||
  inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });

/**
 * Đã đăng nhập mà vào /login (vd mở lại link cũ, tải lại trang ngay sau khi đăng nhập)
 * -> đi tiếp tới returnUrl, không bỏ về trang chủ.
 */
export const guestGuard: CanActivateFn = (route) =>
  !inject(AuthService).isAuthenticated() ||
  inject(Router).parseUrl(safeReturnUrl(route.queryParamMap.get('returnUrl')));
