import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AppRole, AuthService } from './auth.service';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  const roles = signal<AppRole[]>([]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            hasAnyRole: (...r: AppRole[]) => r.some((x) => roles().includes(x)),
          },
        },
      ],
    });
  });

  const run = () =>
    TestBed.runInInjectionContext(() =>
      roleGuard('ADMIN')(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

  it('cho phep khi co role', () => {
    roles.set(['AGENT', 'ADMIN']);
    expect(run()).toBe(true);
  });

  it('chuyen toi /forbidden khi thieu role', () => {
    roles.set(['AGENT']);
    const result = run() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/forbidden');
  });
});
