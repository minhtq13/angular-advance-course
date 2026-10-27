import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppRole, AuthService } from './auth.service';

export function roleGuard(...roles: AppRole[]): CanActivateFn {
  return () =>
    inject(AuthService).hasAnyRole(...roles) ||
    inject(Router).parseUrl('/forbidden');
}
