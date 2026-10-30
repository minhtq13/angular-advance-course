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
  async function setup(loggedIn = true, apiUrl = API) {
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
        provideAppConfig({ apiUrl }),
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

  it.each([
    'http://api.evil.com/api/me',
    'http://api@evil.com/api/me',
    'http://api:8443/api/me',
    'http://apix/api/me',
    'https://cdn.example.com/logo.png',
  ])(
    'khong gan token cho URL ngoai API (so origin, khong so chuoi dau): %s',
    async (url) => {
      await setup();
      get(url);

      expect(http.expectOne(url).request.headers.has('Authorization')).toBe(
        false,
      );
    },
  );

  it('apiUrl rong (cung origin voi app, sau reverse proxy) -> chi gan cho API cung origin', async () => {
    await setup(true, '');
    get('/api/me');
    get('https://cdn.example.com/logo.png');

    expect(bearerOf(http.expectOne('/api/me'))).toBe(`Bearer ${fakeJwt('A1')}`);
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

  it('3 request cung nhan 401 -> chi MOT lan refresh, ca 3 gui lai voi token moi', async () => {
    await setup();
    const urls = [
      `${API}/api/subscribers/1`,
      `${API}/api/tickets`,
      `${API}/api/service-plans`,
    ];
    const results = urls.map((url) => get(url));

    urls.forEach((url) => http.expectOne(url).flush(null, unauthorized));
    // Không dùng chung: 3 refresh với cùng R1 -> server coi 2 cái sau là reuse -> revoke cả phiên.
    http.expectOne(REFRESH_URL).flush(tokens('A2', 'R2'));

    urls.forEach((url) => {
      const retry = http.expectOne(url);
      expect(bearerOf(retry)).toBe(`Bearer ${fakeJwt('A2')}`);
      retry.flush({ ok: url });
    });
    expect(results.map((r) => r())).toEqual(urls.map((url) => ({ ok: url })));
  });

  it('401 ve muon (refresh da xong) -> khong refresh lai, gui lai voi token hien tai', async () => {
    await setup();
    get(`${API}/api/tickets`);
    get(`${API}/api/subscribers/1`);

    http.expectOne(`${API}/api/tickets`).flush(null, unauthorized);
    http.expectOne(REFRESH_URL).flush(tokens('A2', 'R2'));
    http.expectOne(`${API}/api/tickets`).flush({});

    // Request này đã gửi bằng A1 từ trước, giờ mới nhận 401: token đã được thay rồi.
    http.expectOne(`${API}/api/subscribers/1`).flush(null, unauthorized);
    http.expectNone(REFRESH_URL);
    expect(bearerOf(http.expectOne(`${API}/api/subscribers/1`))).toBe(
      `Bearer ${fakeJwt('A2')}`,
    );
  });

  it('refresh xong thi lan het han sau refresh moi (khong dung lai ket qua cu)', async () => {
    await setup();
    get(`${API}/api/tickets`);
    http.expectOne(`${API}/api/tickets`).flush(null, unauthorized);
    http.expectOne(REFRESH_URL).flush(tokens('A2', 'R2'));
    http.expectOne(`${API}/api/tickets`).flush({});

    get(`${API}/api/tickets`);
    http.expectOne(`${API}/api/tickets`).flush(null, unauthorized);
    const second = http.expectOne(REFRESH_URL);
    expect(second.request.body).toEqual({ refreshToken: fakeJwt('R2') });
    second.flush(tokens('A3', 'R3'));
    expect(bearerOf(http.expectOne(`${API}/api/tickets`))).toBe(
      `Bearer ${fakeJwt('A3')}`,
    );
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

  it('refresh loi khi 3 request cung cho -> dang xuat MOT lan, giu returnUrl, bao het phien', async () => {
    await setup();
    vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue(
      '/tickets?status=NEW',
    );
    const urls = [
      `${API}/api/subscribers/1`,
      `${API}/api/tickets`,
      `${API}/api/service-plans`,
    ];
    const results = urls.map((url) => get(url));

    urls.forEach((url) => http.expectOne(url).flush(null, unauthorized));
    // Vd refresh token đã bị dùng ở nơi khác (bị lộ) -> server revoke cả phiên.
    http.expectOne(REFRESH_URL).flush(null, unauthorized);

    expect(results.map((r) => r())).toEqual([401, 401, 401]);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/tickets?status=NEW', reason: 'expired' },
    });
    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('care.auth')).toBeNull();
  });

  it('401 ve muon sau khi phien da ket thuc -> khong refresh nua', async () => {
    await setup();
    const late = get(`${API}/api/subscribers/1`);
    get(`${API}/api/tickets`);

    http.expectOne(`${API}/api/tickets`).flush(null, unauthorized);
    http.expectOne(REFRESH_URL).flush(null, unauthorized);
    http.expectOne(`${API}/api/subscribers/1`).flush(null, unauthorized);

    http.expectNone(REFRESH_URL);
    expect(late()).toBe(401);
    expect(navigate).toHaveBeenCalledOnce();
  });

  it('refresh loi do mang (khong phai 401) -> khong dang xuat', async () => {
    await setup();
    const result = get(`${API}/api/tickets`);

    http.expectOne(`${API}/api/tickets`).flush(null, unauthorized);
    http
      .expectOne(REFRESH_URL)
      .error(new ProgressEvent('error'), { status: 0 });

    expect(result()).toBe(0);
    expect(auth.isAuthenticated()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
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
