import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAppConfig } from '@care/shared-util-config';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import { of, Subject, throwError } from 'rxjs';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { OidcAuthService } from './oidc-auth.service';

/** JWT giả (không ký): FE chỉ đọc payload. */
function fakeJwt(payload: object): string {
  const encode = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  return `${encode({ alg: 'none' })}.${encode(payload)}.sig`;
}

/** Hai token Keycloak trả về cho cùng một lần đăng nhập (rút gọn claim, giữ đúng aud và typ). */
const user = {
  preferred_username: 'agent1',
  name: 'Agent One',
  roles: ['AGENT', 'default-roles-care'],
};
const ID_TOKEN = fakeJwt({ ...user, typ: 'ID', aud: 'care-portal' });
const ACCESS_TOKEN = fakeJwt({
  ...user,
  typ: 'Bearer',
  aud: ['care-api', 'account'],
});

const loggedIn: LoginResponse = {
  isAuthenticated: true,
  userData: null,
  accessToken: ACCESS_TOKEN,
  idToken: ID_TOKEN,
};
const anonymous: LoginResponse = {
  isAuthenticated: false,
  userData: null,
  accessToken: '',
  idToken: '',
};

/** Thay thư viện OIDC: không gọi Keycloak, không đổi window.location. */
function fakeOidc(result: LoginResponse = loggedIn) {
  return {
    checkAuth: vi.fn(() => of(result)),
    forceRefreshSession: vi.fn(() => of(result)),
    authorize: vi.fn(),
    logoffLocal: vi.fn(),
    logoffAndRevokeTokens: vi.fn(() => of(null)),
  };
}

describe('OidcAuthService', () => {
  let oidc: ReturnType<typeof fakeOidc>;

  function setup(result: LoginResponse) {
    oidc = fakeOidc(result);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
        provideAppConfig({ apiUrl: 'http://api' }),
        { provide: OidcSecurityService, useValue: oidc },
        { provide: AuthService, useExisting: OidcAuthService },
      ],
    });
    return TestBed.inject(AuthService);
  }

  beforeEach(() => sessionStorage.clear());

  it('chua dang nhap o Keycloak -> khong co user, khong co token', async () => {
    const auth = setup(anonymous);
    await auth.init();

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.accessToken()).toBeNull();
  });

  it('callback loi (vd state khong khop) -> khong dang nhap, app van khoi dong', async () => {
    const auth = setup(anonymous);
    oidc.checkAuth.mockReturnValue(
      throwError(() => new Error('codeFlowCodeRequest incorrect state')),
    );

    await expect(auth.init()).resolves.toBeUndefined();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('da dang nhap -> ten va vai tro lay tu ID token, bo vai tro la cua Keycloak', async () => {
    const auth = setup(loggedIn);
    await auth.init();

    expect(auth.username()).toBe('agent1');
    expect(auth.displayName()).toBe('Agent One');
    expect(auth.roles()).toEqual(['AGENT']);
  });

  it('dang nhap SSO -> nho trang dinh vao roi chuyen sang Keycloak', () => {
    const auth = setup(anonymous);

    auth.loginWithSso('/tickets?status=NEW');

    expect(sessionStorage.getItem('care.returnUrl')).toBe(
      '/tickets?status=NEW',
    );
    expect(oidc.authorize).toHaveBeenCalledTimes(1);
  });

  it('request toi API mang access token, khong phai ID token (aud cua ID token la client)', async () => {
    const auth = setup(loggedIn);
    await auth.init();

    TestBed.inject(HttpClient).get('http://api/api/subscribers').subscribe();

    const req = TestBed.inject(HttpTestingController).expectOne(
      'http://api/api/subscribers',
    );
    expect(req.request.headers.get('Authorization')).toBe(
      `Bearer ${ACCESS_TOKEN}`,
    );
  });

  it('access token het han -> refresh qua thu vien, gui lai bang access token moi', async () => {
    const auth = setup(loggedIn);
    await auth.init();
    const renewed = fakeJwt({
      ...user,
      typ: 'Bearer',
      aud: ['care-api'],
      n: 2,
    });
    oidc.forceRefreshSession.mockReturnValue(
      of({ ...loggedIn, accessToken: renewed }),
    );
    const http = TestBed.inject(HttpTestingController);
    let body: unknown;

    TestBed.inject(HttpClient)
      .get('http://api/api/me')
      .subscribe((b) => (body = b));
    http
      .expectOne('http://api/api/me')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    const retry = http.expectOne('http://api/api/me');
    expect(retry.request.headers.get('Authorization')).toBe(
      `Bearer ${renewed}`,
    );
    retry.flush({ username: 'agent1' });
    expect(oidc.forceRefreshSession).toHaveBeenCalledTimes(1);
    expect(body).toEqual({ username: 'agent1' });
  });

  it('dang xuat -> ket thuc ca phien o Keycloak (may dung chung), khong chi xoa token trong tab', async () => {
    const auth = setup(loggedIn);
    await auth.init();

    auth.logout();

    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.accessToken()).toBeNull();
    expect(oidc.logoffAndRevokeTokens).toHaveBeenCalledTimes(1);
  });

  it('refresh that bai (phien Keycloak da het) -> mot lan ve /login voi reason=expired', async () => {
    const auth = setup(loggedIn);
    await auth.init();
    const pending = new Subject<LoginResponse>();
    oidc.forceRefreshSession.mockReturnValue(pending);
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    const errors: unknown[] = [];

    auth.refresh().subscribe({ error: (e) => errors.push(e) });
    auth.refresh().subscribe({ error: (e) => errors.push(e) });
    pending.next(anonymous);

    expect(errors).toHaveLength(2);
    expect(oidc.forceRefreshSession).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/', reason: 'expired' },
    });
    expect(auth.isAuthenticated()).toBe(false);
  });
});
