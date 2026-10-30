import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideAppConfig } from '@care/shared-util-config';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

/** JWT giả (không ký): FE chỉ đọc payload. exp cố định (năm 2100) để cùng tên -> cùng chuỗi token. */
function fakeJwt(name: string): string {
  const encode = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
  const payload = {
    preferred_username: 'agent1',
    roles: ['AGENT'],
    exp: 4_102_444_800,
    name,
  };
  return `${encode({ alg: 'none' })}.${encode(payload)}.sig`;
}

const API = 'http://api';
const REFRESH_URL = `${API}/api/auth/refresh`;
const unauthorized = { status: 401, statusText: 'Unauthorized' };

describe('authInterceptor', () => {
  let http: HttpTestingController;
  let auth: AuthService;
  let navigate: ReturnType<typeof vi.spyOn>;

  /** Đăng nhập sẵn: access token "A1" (coi như đã hết hạn ở server), refresh token "R1". */
  async function setup(loggedIn = true) {
    sessionStorage.clear();
    if (loggedIn) {
      sessionStorage.setItem(
        'care.auth',
        JSON.stringify({
          accessToken: fakeJwt('A1'),
          refreshToken: fakeJwt('R1'),
          expiresIn: 900,
        }),
      );
    }
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAppConfig({ apiUrl: API }),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    await auth.init();
  }

  /** Gửi GET, trả về hàm đọc kết quả (body hoặc status lỗi). */
  function get(url: string) {
    let result: unknown;
    TestBed.inject(HttpClient)
      .get(url)
      .subscribe({
        next: (body) => (result = body),
        error: (e) => (result = e.status),
      });
    return () => result;
  }

  const bearerOf = (req: TestRequest) =>
    req.request.headers.get('Authorization');
  const tokens = (accessName: string, refreshName: string) => ({
    accessToken: fakeJwt(accessName),
    refreshToken: fakeJwt(refreshName),
    expiresIn: 900,
  });

  afterEach(() => http.verify());

  it('gan token cho API cua minh, khong gan cho domain khac', async () => {
    await setup();
    get(`${API}/api/me`);
    get('https://cdn.example.com/logo.png');

    expect(bearerOf(http.expectOne(`${API}/api/me`))).toBe(
      `Bearer ${fakeJwt('A1')}`,
    );
    expect(
      http
        .expectOne('https://cdn.example.com/logo.png')
        .request.headers.has('Authorization'),
    ).toBe(false);
  });

  it('401 -> refresh mot lan -> gui lai request voi token moi', async () => {
    await setup();
    const result = get(`${API}/api/tickets`);

    http.expectOne(`${API}/api/tickets`).flush(null, unauthorized);
    const refresh = http.expectOne(REFRESH_URL);
    expect(refresh.request.body).toEqual({
      refreshToken: fakeJwt('R1'),
    });
    refresh.flush(tokens('A2', 'R2'));

    const retry = http.expectOne(`${API}/api/tickets`);
    expect(bearerOf(retry)).toBe(`Bearer ${fakeJwt('A2')}`);
    retry.flush({ content: [] });
    expect(result()).toEqual({ content: [] });
  });

  it('refresh loi -> dua ve dang nhap, giu returnUrl', async () => {
    await setup();
    const result = get(`${API}/api/tickets`);

    http.expectOne(`${API}/api/tickets`).flush(null, unauthorized);
    http.expectOne(REFRESH_URL).flush(null, unauthorized);

    expect(result()).toBe(401);
    expect(auth.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login'], expect.anything());
  });

  it('401 khi KHONG co token (vd luc dang xuat) -> khong refresh, khong dieu huong', async () => {
    await setup(false);
    const result = get(`${API}/api/subscribers/1`);

    http.expectOne(`${API}/api/subscribers/1`).flush(null, unauthorized);

    expect(result()).toBe(401);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('/api/auth/* khong gan token; 401 tu /api/auth/login (sai mat khau) -> khong refresh', async () => {
    await setup();
    const result = get(`${API}/api/auth/login`);

    const login = http.expectOne(`${API}/api/auth/login`);
    expect(login.request.headers.has('Authorization')).toBe(false);
    login.flush(null, unauthorized);

    expect(result()).toBe(401);
    expect(navigate).not.toHaveBeenCalled();
  });
});
