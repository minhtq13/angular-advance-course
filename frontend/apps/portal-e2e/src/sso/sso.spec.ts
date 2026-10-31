import { expect, Page, test } from '@playwright/test';

// Buổi 7: cần Keycloak và portal ở chế độ OIDC:
//   docker compose -f infra/docker-compose.yml --profile sso up -d
//   apps/portal/public/config.json: "auth": { "mode": "oidc", ... }   (xem course/session-07/lab)
//   SSO=1 npx playwright test -c apps/portal-e2e/playwright.config.mts sso --project=chromium
test.skip(
  !process.env['SSO'],
  'Can Keycloak (profile sso) va config.json auth.mode=oidc',
);

const KEYCLOAK = /localhost:8180\/realms\/care\//;

function payload(token: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
}

/** Đăng nhập trên trang của Keycloak (không phải form của app). */
async function keycloakLogin(page: Page, user: string) {
  await page.waitForURL(KEYCLOAK);
  await page.locator('#username').fill(user);
  await page.locator('#password').fill(user);
  await page.locator('#kc-login').click();
}

test('dang nhap qua Keycloak: Authorization Code + PKCE, API nhan access token', async ({
  page,
}) => {
  await page.goto('/tickets?status=RESOLVED');
  await expect(page).toHaveURL(/\/login\?returnUrl=/);

  const authorize = page.waitForRequest(/openid-connect\/auth\?/);
  await page.getByRole('button', { name: 'Đăng nhập bằng SSO' }).click();
  const params = new URL((await authorize).url()).searchParams;
  expect(params.get('response_type')).toBe('code');
  expect(params.get('code_challenge_method')).toBe('S256');
  expect(params.get('code_challenge')).toMatch(/^[\w-]{43}$/);
  expect(params.get('state')).toBeTruthy();
  expect(params.get('nonce')).toBeTruthy();

  const apiCall = page.waitForResponse(
    (r) => r.url().includes('/api/tickets') && r.request().method() === 'GET',
  );
  await keycloakLogin(page, 'agent1');

  // Quay về đúng trang định vào, không phải trang chủ.
  await expect(page).toHaveURL(/\/tickets\?status=RESOLVED$/);
  const res = await apiCall;
  expect(res.status()).toBe(200);
  const bearer = (res.request().headers()['authorization'] ?? '').replace(
    'Bearer ',
    '',
  );
  expect(payload(bearer)).toMatchObject({
    typ: 'Bearer',
    preferred_username: 'agent1',
    iss: 'http://localhost:8180/realms/care',
  });
  expect(payload(bearer)['aud']).toContain('care-api');
  await expect(page.locator('tbody tr.ant-table-row').first()).toBeVisible();
});

test('may dung chung: dang xuat roi bam SSO -> Keycloak hoi lai mat khau, khong vao tai khoan cu', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Đăng nhập bằng SSO' }).click();
  await keycloakLogin(page, 'agent1');
  await expect(page).toHaveURL(/\/subscribers/);

  const revoke = page.waitForRequest(/openid-connect\/revoke/);
  const endSession = page.waitForRequest(/openid-connect\/logout\?/);
  await page.getByRole('button', { name: 'Tài khoản Agent One' }).click();
  await page.getByText('Đăng xuất').click();
  expect((await revoke).method()).toBe('POST');
  const logout = new URL((await endSession).url()).searchParams;
  expect(logout.get('id_token_hint')).toBeTruthy();
  expect(logout.get('post_logout_redirect_uri')).toMatch(/\/login$/);
  await expect(page).toHaveURL(/\/login$/);

  // Người ca sau: phải thấy form của Keycloak, đăng nhập bằng tài khoản của mình.
  await page.getByRole('button', { name: 'Đăng nhập bằng SSO' }).click();
  await expect(page.locator('#username')).toBeVisible();
  await keycloakLogin(page, 'supervisor1');
  await expect(
    page.getByRole('button', { name: 'Tài khoản Supervisor One' }),
  ).toBeVisible();
});

test('callback gia (code va state khong do app tao) -> khong dang nhap', async ({
  page,
}) => {
  // Kẻ gian gửi link callback có code của họ (login CSRF): state không khớp -> thư viện từ chối, không đổi code.
  const exchange = page.waitForRequest(/openid-connect\/token/, {
    timeout: 3000,
  });
  await page.goto('/auth/callback?code=abc&state=khong-phai-cua-app');
  await expect(page).toHaveURL(/\/login/);
  await expect(exchange).rejects.toThrow();
  await expect(
    page.getByRole('button', { name: 'Đăng nhập bằng SSO' }),
  ).toBeVisible();
});

test('token Keycloak cua agent goi thang API duyet phieu -> 403 (server doc vai tro tu token)', async ({
  page,
  request,
}) => {
  const API = process.env['API_URL'] ?? 'http://localhost:8081';
  // Đọc body ngay khi response về: sau đó trang chuyển tiếp, trình duyệt bỏ body.
  const tokens = page
    .waitForResponse(/openid-connect\/token/)
    .then((r) => r.json());
  await page.goto('/login');
  await page.getByRole('button', { name: 'Đăng nhập bằng SSO' }).click();
  await keycloakLogin(page, 'agent1');
  const { access_token: accessToken } = await tokens;
  expect(payload(accessToken)['roles']).toEqual(['AGENT']);

  const headers = { Authorization: `Bearer ${accessToken}` };
  const list = await request.get(`${API}/api/tickets?status=RESOLVED&size=1`, {
    headers,
  });
  expect(list.status()).toBe(200);
  const [ticket] = (await list.json()).content;

  const res = await request.post(`${API}/api/tickets/${ticket.id}/approve`, {
    headers,
    data: { version: ticket.version },
  });
  expect(res.status()).toBe(403);
  const after = await request.get(`${API}/api/tickets/${ticket.id}`, {
    headers,
  });
  expect(await after.json()).toMatchObject({
    status: 'RESOLVED',
    version: ticket.version,
  });
});
