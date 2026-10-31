import { expect, Page, test } from '@playwright/test';

// Buổi 9: kiểm tra nhanh sau mỗi lần triển khai. Đỏ ở đây = không phát hành (hoặc rollback).
// Chạy: BASE_URL=http://localhost:8090 npx playwright test -c apps/portal-e2e/playwright.smoke.config.mts

/** Lỗi console + lỗi JS chưa bắt. CSP chặn script/stylesheet chỉ hiện ở đây, giao diện có thể vẫn "trông như chạy". */
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

test('deep link tra ve index.html, khong 404', async ({ request }) => {
  const res = await request.get('/tickets?status=NEW');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('text/html');
});

test('file tinh khong ton tai tra 404, khong tra index.html', async ({
  request,
}) => {
  // Chunk của bản cũ đã bị xóa: trả index.html (200, text/html) thì trình duyệt báo lỗi MIME khó hiểu.
  expect((await request.get('/chunk-ZZZZZZZZ.js')).status()).toBe(404);
  expect((await request.get('/i18n/khong-co.json')).status()).toBe(404);
});

test('index.html, config.json, i18n khong cache; file co hash cache 1 nam', async ({
  request,
}) => {
  for (const path of ['/', '/tickets', '/config.json', '/i18n/vi.json']) {
    const res = await request.get(path);
    expect(res.headers()['cache-control'], path).toBe('no-cache');
  }
  const html = await (await request.get('/')).text();
  const main = html.match(/main-[A-Za-z0-9_-]{8}\.js/)?.[0];
  expect(main).toBeTruthy();
  const res = await request.get(`/${main}`);
  expect(res.status()).toBe(200);
  expect(res.headers()['cache-control']).toBe(
    'public, max-age=31536000, immutable',
  );
});

test('version.json dung ban vua trien khai, khong cache', async ({
  request,
}) => {
  const res = await request.get('/version.json');
  expect(res.headers()['cache-control']).toBe('no-cache');
  const { version, commit } = await res.json();
  // CI truyền EXPECTED_VERSION = version vừa build; chạy tay không truyền thì chỉ kiểm có giá trị.
  expect(version).toBe(process.env['EXPECTED_VERSION'] ?? version);
  expect(version).not.toBe('dev');
  // Build quên --build-arg GIT_COMMIT thì không truy được lỗi về commit nào.
  expect(commit).toMatch(/^[0-9a-f]{7,40}$/);
});

test('co header bao mat', async ({ request }) => {
  // Kiểm cả deep link: add_header trong location ghi đè header của server.
  for (const path of ['/', '/tickets?status=NEW', '/config.json']) {
    const h = (await request.get(path)).headers();
    expect(h['x-content-type-options'], path).toBe('nosniff');
    expect(h['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    expect(h['content-security-policy'], path).toMatch(
      /script-src 'self';.*frame-ancestors 'none';.*object-src 'none'/,
    );
  }
});

test('mo deep link, dang nhap, thay danh sach phieu, khong loi console', async ({
  page,
}) => {
  const errors = collectErrors(page);

  await page.goto('/tickets?status=NEW');
  await page.getByLabel('Tên đăng nhập').fill('agent1');
  await page.getByLabel('Mật khẩu').fill('agent1');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(page).toHaveURL(/\/tickets\?status=NEW$/);
  await expect(page.locator('tbody tr.ant-table-row').first()).toBeVisible();
  expect(errors).toEqual([]);
  await expect(page.locator('link[rel=stylesheet][media=print]')).toHaveCount(
    0,
  );
});
