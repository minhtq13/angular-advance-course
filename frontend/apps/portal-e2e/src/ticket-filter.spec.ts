import { expect, Page, test } from '@playwright/test';

// Buổi 8: bộ lọc "Loại yêu cầu" với backend thật. Unit test dùng fake adapter không chứng minh được
// tên tham số khớp với API: fake lọc gì cũng được, backend bỏ qua tham số lạ mà không báo lỗi.
async function login(page: Page, url: string) {
  await page.goto(url);
  await page.getByLabel('Tên đăng nhập').fill('agent1');
  await page.getByLabel('Mật khẩu').fill('agent1');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
}

/** Cột "Phân loại" của các dòng đang hiện. */
async function categories(page: Page) {
  const headers = (await page.locator('thead th').allInnerTexts()).map((h) =>
    h.trim(),
  );
  const col = headers.indexOf('Phân loại') + 1;
  expect(col).toBeGreaterThan(0);
  return (
    await page
      .locator(`tbody tr.ant-table-row td:nth-child(${col})`)
      .allInnerTexts()
  ).map((c) => c.trim());
}

test('loc "Cuoc phi": request gui category, moi dong deu la Cuoc phi, F5 giu bo loc', async ({
  page,
}) => {
  await login(page, '/tickets');
  await expect(page.locator('tbody tr.ant-table-row').first()).toBeVisible();
  expect(new Set(await categories(page)).size).toBeGreaterThan(1);

  const filtered = page.waitForResponse(
    (r) => r.url().includes('/api/tickets?') && r.url().includes('BILLING'),
  );
  await page.locator('nz-select:has(#tk-category)').click();
  await page.locator('nz-option-item', { hasText: 'Cước phí' }).click();
  const res = await filtered;
  expect(new URL(res.url()).searchParams.get('category')).toBe('BILLING');
  expect(res.status()).toBe(200);
  await expect(page).toHaveURL(/category=BILLING/);

  await expect
    .poll(() => categories(page))
    .toEqual(expect.arrayContaining(['Cước phí']));
  expect(new Set(await categories(page))).toEqual(new Set(['Cước phí']));

  await page.reload();
  await expect(page.locator('nz-select:has(#tk-category)')).toContainText(
    'Cước phí',
  );
  expect(new Set(await categories(page))).toEqual(new Set(['Cước phí']));
});

test('URL sua tay category=abc: bo qua, khong loi, khong gui xuong API', async ({
  page,
}) => {
  await login(page, '/tickets');
  await expect(page.locator('tbody tr.ant-table-row').first()).toBeVisible();

  const req = page.waitForRequest((r) => r.url().includes('/api/tickets?'));
  await page.goto('/tickets?category=abc');
  expect(new URL((await req).url()).searchParams.has('category')).toBe(false);
  await expect(page.locator('tbody tr.ant-table-row').first()).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
});
