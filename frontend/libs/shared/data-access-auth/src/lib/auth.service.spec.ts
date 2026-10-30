import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppConfig } from '@care/shared-util-config';
import { AuthService, userFromClaims } from './auth.service';

/** Tạo JWT giả (không ký) - FE chỉ đọc payload, backend mới kiểm tra signature. */
function fakeJwt(payload: object): string {
  const encode = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${encode({ alg: 'none' })}.${encode(payload)}.sig`;
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAppConfig({ apiUrl: 'http://api' }),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  it('dang nhap thanh cong -> co user, token va luu vao sessionStorage', () => {
    const accessToken = fakeJwt({
      preferred_username: 'supervisor1',
      name: 'Supervisor One',
      roles: ['AGENT', 'SUPERVISOR'],
      exp: Date.now() / 1000 + 900,
    });

    service.loginWithPassword('supervisor1', 'supervisor1').subscribe();
    const req = http.expectOne('http://api/api/auth/login');
    expect(req.request.body).toEqual({
      username: 'supervisor1',
      password: 'supervisor1',
    });
    req.flush({ accessToken, refreshToken: 'r', expiresIn: 900 });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.hasAnyRole('SUPERVISOR')).toBe(true);
    expect(service.accessToken()).toBe(accessToken);
    expect(sessionStorage.getItem('care.auth')).toContain(accessToken);
  });

  it('khoi dong lai: access token het han nhung refresh token con han -> giu phien', async () => {
    sessionStorage.setItem(
      'care.auth',
      JSON.stringify({
        accessToken: fakeJwt({
          preferred_username: 'agent1',
          exp: Date.now() / 1000 - 60,
        }),
        refreshToken: fakeJwt({ exp: Date.now() / 1000 + 3600 }),
        expiresIn: 0,
      }),
    );

    await service.init();

    expect(service.isAuthenticated()).toBe(true);
    expect(service.username()).toBe('agent1');
  });

  it('khoi dong lai: refresh token het han -> phien da ket thuc', async () => {
    const expired = fakeJwt({
      preferred_username: 'agent1',
      exp: Date.now() / 1000 - 60,
    });
    sessionStorage.setItem(
      'care.auth',
      JSON.stringify({
        accessToken: expired,
        refreshToken: expired,
        expiresIn: 0,
      }),
    );

    await service.init();

    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('care.auth')).toBeNull();
  });
});

describe('userFromClaims', () => {
  it('doc ten, ten hien thi va role tu claim cua backend', () => {
    const user = userFromClaims({
      preferred_username: 'agent1',
      name: 'Agent One',
      roles: ['AGENT'],
    });

    expect(user).toEqual({
      username: 'agent1',
      displayName: 'Agent One',
      roles: ['AGENT'],
    });
  });

  it('dung username lam ten hien thi khi khong co claim name', () => {
    expect(
      userFromClaims({ preferred_username: 'admin1', roles: ['ADMIN'] })
        .displayName,
    ).toBe('admin1');
  });

  it('bo qua role la (khong thuoc AGENT/SUPERVISOR/ADMIN)', () => {
    expect(
      userFromClaims({ preferred_username: 'x', roles: ['ADMIN', 'ROOT'] })
        .roles,
    ).toEqual(['ADMIN']);
  });
});
