import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Chi chap nhan duong dan noi bo ("/..."), chan "//evil.com" va quay lai /login -> tranh open redirect
 * khi returnUrl den tu query string ma ai cung sua duoc.
 */
export function safeReturnUrl(url: unknown): string {
  return typeof url === 'string' &&
    url.startsWith('/') &&
    !url.startsWith('//') &&
    !url.startsWith('/login')
    ? url
    : '/';
}

/** Chua dang nhap -> sang /login, kem returnUrl de quay lai dung trang. */
export const authGuard: CanActivateFn = (_route, state) =>
  inject(AuthService).isAuthenticated() ||
  inject(Router).createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });

/**
 * Da dang nhap ma vao /login (vd mo lai link cu, tai lai trang ngay sau khi dang nhap)
 * -> di tiep toi returnUrl, khong bo ve trang chu.
 */
export const guestGuard: CanActivateFn = (route) =>
  !inject(AuthService).isAuthenticated() ||
  inject(Router).parseUrl(safeReturnUrl(route.queryParamMap.get('returnUrl')));
