import { APIRequestContext, expect, test } from '@playwright/test';
import { createHmac } from 'node:crypto';

/**
 * Buổi 6: ma trận kiểm thử bảo mật API (docs/ma-tran-bao-mat.md), gọi thẳng backend, không qua giao diện.
 * Chỉ cần backend chạy (docker compose). Số # trong tên test = số dòng trong ma trận.
 *   npx playwright test -c apps/portal-e2e/playwright.config.mts security --project=chromium
 * API_URL: địa chỉ backend (mặc định http://localhost:8081).
 * JWT_SECRET: signing key của môi trường DEV (mặc định trong application.yml) - chỉ để tự ký token "hợp lệ nhưng hết hạn".
 */
const API = process.env['API_URL'] ?? 'http://localhost:8081';
const DEV_SECRET =
  process.env['JWT_SECRET'] ??
  'care-dev-secret-change-me-in-production-0123456789';
const APP_ORIGIN = 'http://localhost:4200';

test.use({ baseURL: API });

const b64url = (value: object | string) =>
  Buffer.from(
    typeof value === 'string' ? value : JSON.stringify(value),
  ).toString('base64url');

/** Tự ký JWT HS256 (giống backend) để thử từng claim một. */
function signJwt(payload: object, secret = DEV_SECRET): string {
  const unsigned = `${b64url({ alg: 'HS256' })}.${b64url(payload)}`;
  const signature = createHmac('sha256', secret)
    .update(unsigned)
    .digest('base64url');
  return `${unsigned}.${signature}`;
}

const now = () => Math.floor(Date.now() / 1000);
const accessClaims = (overrides: object = {}) => ({
  iss: 'care-api',
  aud: 'care-api',
  sub: 'agent1',
  preferred_username: 'agent1',
  roles: ['AGENT'],
  token_use: 'access',
  iat: now(),
  exp: now() + 300,
  ...overrides,
});

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

async function login(request: APIRequestContext, user: string) {
  const res = await request.post('/api/auth/login', {
    data: { username: user, password: user },
  });
  expect(res.status()).toBe(200);
  return (await res.json()) as Tokens;
}

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
const refresh = (request: APIRequestContext, refreshToken: string) =>
  request.post('/api/auth/refresh', { data: { refreshToken } });

test.describe('401: ai dang goi? (authentication)', () => {
  test('#1 khong co token', async ({ request }) => {
    expect((await request.get('/api/tickets')).status()).toBe(401);
  });

  test('#2 token rac', async ({ request }) => {
    const res = await request.get('/api/tickets', {
      headers: bearer('abc.def.ghi'),
    });
    expect(res.status()).toBe(401);
  });

  test('#3 sua payload (tu nang quyen ADMIN), giu chu ky cu', async ({
    request,
  }) => {
    const { accessToken } = await login(request, 'agent1');
    const [header, , signature] = accessToken.split('.');
    const forged = `${header}.${b64url(accessClaims({ roles: ['ADMIN'] }))}.${signature}`;

    const res = await request.get('/api/admin/stats', {
      headers: bearer(forged),
    });
    expect(res.status()).toBe(401);
  });

  test('#4 alg none (khong chu ky)', async ({ request }) => {
    const unsigned = `${b64url({ alg: 'none' })}.${b64url(accessClaims())}.`;
    const res = await request.get('/api/tickets', {
      headers: bearer(unsigned),
    });
    expect(res.status()).toBe(401);
  });

  test('#5 ky bang khoa khac', async ({ request }) => {
    const res = await request.get('/api/tickets', {
      headers: bearer(
        signJwt(accessClaims(), 'khoa-cua-ke-tan-cong-dai-it-nhat-32-byte!!'),
      ),
    });
    expect(res.status()).toBe(401);
  });

  test('#6 dung khoa nhung het han (qua 10 giay lech dong ho)', async ({
    request,
  }) => {
    const expired = signJwt(accessClaims({ exp: now() - 15 }));
    const res = await request.get('/api/tickets', { headers: bearer(expired) });
    expect(res.status()).toBe(401);
    // Đối chứng: cùng key, còn hạn -> 200. Chứng minh 401 ở trên là do exp.
    const valid = signJwt(accessClaims());
    expect(
      (await request.get('/api/tickets', { headers: bearer(valid) })).status(),
    ).toBe(200);
  });

  test('#7 dung khoa nhung sai aud / sai iss', async ({ request }) => {
    for (const claims of [
      accessClaims({ aud: 'billing-api' }),
      accessClaims({ iss: 'evil' }),
    ]) {
      const res = await request.get('/api/tickets', {
        headers: bearer(signJwt(claims)),
      });
      expect(res.status()).toBe(401);
    }
  });

  test('#8 dung refresh token de goi API', async ({ request }) => {
    const { refreshToken } = await login(request, 'agent1');
    const res = await request.get('/api/tickets', {
      headers: bearer(refreshToken),
    });
    expect(res.status()).toBe(401);
  });
});

test.describe('403 / 409: duoc lam gi? (authorization, nghiep vu)', () => {
  async function resolvedTicket(request: APIRequestContext, token: string) {
    const res = await request.get('/api/tickets?status=RESOLVED&size=1', {
      headers: bearer(token),
    });
    const [ticket] = (await res.json()).content as {
      id: number;
      version: number;
    }[];
    return ticket;
  }

  test('#9 agent1 goi API duyet phieu (nut da an tren UI) -> 403, phieu khong doi', async ({
    request,
  }) => {
    const agent = (await login(request, 'agent1')).accessToken;
    const ticket = await resolvedTicket(request, agent);

    const res = await request.post(`/api/tickets/${ticket.id}/approve`, {
      headers: bearer(agent),
      data: { version: ticket.version },
    });
    expect(res.status()).toBe(403);
    const after = await request.get(`/api/tickets/${ticket.id}`, {
      headers: bearer(agent),
    });
    expect(await after.json()).toMatchObject({
      status: 'RESOLVED',
      version: ticket.version,
    });
  });

  test('#10 agent1 goi API quan tri -> 403', async ({ request }) => {
    const agent = (await login(request, 'agent1')).accessToken;
    const res = await request.get('/api/admin/stats', {
      headers: bearer(agent),
    });
    expect(res.status()).toBe(403);
  });

  test('#11 supervisor1 duyet ban cu (version sai) -> 409, phieu khong doi', async ({
    request,
  }) => {
    const supervisor = (await login(request, 'supervisor1')).accessToken;
    const ticket = await resolvedTicket(request, supervisor);

    const res = await request.post(`/api/tickets/${ticket.id}/approve`, {
      headers: bearer(supervisor),
      data: { version: ticket.version + 1 },
    });
    expect(res.status()).toBe(409);
    expect((await res.json()).detail).toBeTruthy();
    const after = await request.get(`/api/tickets/${ticket.id}`, {
      headers: bearer(supervisor),
    });
    expect((await after.json()).status).toBe('RESOLVED');
  });
});

test.describe('Vong doi phien: refresh xoay vong', () => {
  test('#12 refresh token chi dung duoc mot lan; dung lai -> thu hoi ca ho', async ({
    request,
  }) => {
    const { refreshToken: r1 } = await login(request, 'agent1');

    const first = await refresh(request, r1);
    expect(first.status()).toBe(200);
    const { refreshToken: r2 } = (await first.json()) as Tokens;

    expect((await refresh(request, r1)).status()).toBe(401);
    // r2 chưa dùng bao giờ nhưng cùng family với r1 -> đã bị revoke.
    expect((await refresh(request, r2)).status()).toBe(401);
  });

  test('#13 3 refresh dong thoi cung mot token -> dung 1 thanh cong', async ({
    request,
  }) => {
    const { refreshToken } = await login(request, 'agent1');

    const statuses = await Promise.all(
      [1, 2, 3].map(async () =>
        (await refresh(request, refreshToken)).status(),
      ),
    );
    expect(statuses.filter((s) => s === 200)).toHaveLength(1);
    expect(statuses.filter((s) => s === 401)).toHaveLength(2);
  });

  test('#14 dang xuat -> refresh token bi thu hoi o server', async ({
    request,
  }) => {
    const { refreshToken } = await login(request, 'agent1');

    const logout = await request.post('/api/auth/logout', {
      data: { refreshToken },
    });
    expect(logout.status()).toBe(204);
    expect((await refresh(request, refreshToken)).status()).toBe(401);
  });

  test('#15 access token van dung duoc toi khi het han sau khi dang xuat (gioi han cua JWT)', async ({
    request,
  }) => {
    const { accessToken, refreshToken } = await login(request, 'agent1');
    await request.post('/api/auth/logout', { data: { refreshToken } });

    // Stateless: server không có danh sách revoke cho access token -> TTL ngắn là hàng rào.
    const res = await request.get('/api/me', { headers: bearer(accessToken) });
    expect(res.status()).toBe(200);
  });
});

test.describe('CORS: trinh duyet cua trang nao duoc doc response?', () => {
  const preflight = (request: APIRequestContext, origin: string) =>
    request.fetch('/api/tickets', {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization',
      },
    });

  test('#16 origin cua app duoc phep', async ({ request }) => {
    const res = await preflight(request, APP_ORIGIN);
    expect(res.status()).toBe(200);
    expect(res.headers()['access-control-allow-origin']).toBe(APP_ORIGIN);
  });

  test('#17 origin la bi tu choi', async ({ request }) => {
    const res = await preflight(request, 'https://evil.example');
    expect(res.status()).toBe(403);
    expect(res.headers()['access-control-allow-origin']).toBeUndefined();
  });

  test('#18 CORS khong phai phan quyen: khong co Origin (curl, server khac) van goi duoc', async ({
    request,
  }) => {
    const { accessToken } = await login(request, 'agent1');
    // Spring từ chối request có Origin lạ (403); nhưng kẻ tấn công dùng curl thì không gửi Origin.
    const withEvilOrigin = await request.get('/api/tickets', {
      headers: { ...bearer(accessToken), Origin: 'https://evil.example' },
    });
    expect(withEvilOrigin.status()).toBe(403);
    const noOrigin = await request.get('/api/tickets', {
      headers: bearer(accessToken),
    });
    expect(noOrigin.status()).toBe(200);
  });
});
