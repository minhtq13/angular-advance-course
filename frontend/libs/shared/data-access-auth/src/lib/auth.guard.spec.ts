import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  convertToParamMap,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { guestGuard, safeReturnUrl } from './auth.guard';
import { AuthService } from './auth.service';

describe('safeReturnUrl', () => {
  it('giu duong dan noi bo', () => {
    expect(safeReturnUrl('/tickets?status=NEW')).toBe('/tickets?status=NEW');
  });

  it.each([
    undefined,
    null,
    '',
    'https://evil.com',
    '//evil.com',
    '/login?returnUrl=/x',
    'tickets',
  ])('chan gia tri khong an toan: %s', (url) => {
    expect(safeReturnUrl(url)).toBe('/');
  });
});

describe('guestGuard', () => {
  const authenticated = signal(false);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated: authenticated } },
      ],
    });
  });

  const run = (returnUrl?: string) =>
    TestBed.runInInjectionContext(() =>
      guestGuard(
        {
          queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}),
        } as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

  it('chua dang nhap -> cho vao trang dang nhap', () => {
    authenticated.set(false);
    expect(run('/tickets')).toBe(true);
  });

  it('da dang nhap -> di toi returnUrl thay vi trang chu', () => {
    authenticated.set(true);
    expect(
      TestBed.inject(Router).serializeUrl(run('/tickets') as UrlTree),
    ).toBe('/tickets');
  });

  it('da dang nhap, returnUrl ra ngoai -> ve trang chu', () => {
    authenticated.set(true);
    expect(
      TestBed.inject(Router).serializeUrl(run('//evil.com') as UrlTree),
    ).toBe('/');
  });
});
