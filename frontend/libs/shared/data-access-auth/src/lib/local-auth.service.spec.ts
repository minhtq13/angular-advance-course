import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideAppConfig } from '@care/shared-util-config';
import { LocalAuthService } from './local-auth.service';

/** Tao JWT gia (khong ky) - FE chi doc payload, backend moi kiem tra chu ky. */
function fakeJwt(payload: object): string {
  const encode = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${encode({ alg: 'none' })}.${encode(payload)}.sig`;
}

describe('LocalAuthService', () => {
  let service: LocalAuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAppConfig({ apiUrl: 'http://api', auth: { mode: 'local' } }),
      ],
    });
    service = TestBed.inject(LocalAuthService);
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

  it('bo qua token het han khi khoi dong lai', async () => {
    const expired = fakeJwt({
      preferred_username: 'agent1',
      exp: Date.now() / 1000 - 60,
    });
    sessionStorage.setItem(
      'care.auth',
      JSON.stringify({ accessToken: expired, refreshToken: 'r', expiresIn: 0 }),
    );

    await service.init();

    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('care.auth')).toBeNull();
  });
});
