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
import { provideRouter } from '@angular/router';
import { provideAppConfig } from '@care/shared-util-config';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let token: string | null;
  const login = vi.fn();

  beforeEach(() => {
    login.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAppConfig({ apiUrl: 'http://api', auth: { mode: 'local' } }),
        { provide: AuthService, useValue: { accessToken: () => token, login } },
      ],
    });
  });

  const call = (url: string) => {
    TestBed.inject(HttpClient)
      .get(url)
      .subscribe({ error: () => undefined });
    return TestBed.inject(HttpTestingController).expectOne(url);
  };

  it('gan token cho API cua minh, khong gan cho domain khac', () => {
    token = 'abc';
    expect(call('http://api/api/me').request.headers.get('Authorization')).toBe(
      'Bearer abc',
    );
    expect(
      call('https://other.com/x').request.headers.has('Authorization'),
    ).toBe(false);
  });

  it('401 khi CO token (het han) -> dua ve dang nhap', () => {
    token = 'expired';
    call('http://api/api/me').flush(null, {
      status: 401,
      statusText: 'Unauthorized',
    });
    expect(login).toHaveBeenCalledOnce();
  });

  it('401 khi KHONG co token (vd luc dang xuat) -> khong dieu huong', () => {
    token = null;
    call('http://api/api/subscribers/1').flush(null, {
      status: 401,
      statusText: 'Unauthorized',
    });
    expect(login).not.toHaveBeenCalled();
  });

  it('401 tu /api/auth/login (sai mat khau) -> khong dieu huong', () => {
    token = 'abc';
    call('http://api/api/auth/login').flush(null, {
      status: 401,
      statusText: 'Unauthorized',
    });
    expect(login).not.toHaveBeenCalled();
  });
});
