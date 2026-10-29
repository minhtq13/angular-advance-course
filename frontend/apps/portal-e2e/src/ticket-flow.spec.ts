import { expect, Page, test } from '@playwright/test';

// Buoi 2: chay voi backend that (docker compose). Moi lan chay se dong mot phieu RESOLVED va tao mot phieu moi.

async function login(page: Page, user: string, url: string) {
  await page.goto(url);
  await page.getByLabel('Tên đăng nhập').fill(user);
  await page.getByLabel('Mật khẩu').fill(user);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
}

test('agent tao phieu tu trang thue bao, tieu de khoang trang bi chan', async ({
  page,
}) => {
  await login(page, 'agent1', '/subscribers/1');
  await page.getByRole('link', { name: 'Tạo phiếu' }).click();
  await expect(page).toHaveURL(/\/tickets\/new\?subscriberId=1/);
  await expect(page.locator('care-subscriber-picker')).toContainText(
    '0900000001',
  );
  await page.locator('#tk-category').click();
  await page
    .getByTitle('Cước phí')
    .or(page.locator('nz-option-item').first())
    .first()
    .click();
  await page.getByLabel('Tiêu đề').fill('   ');
  await page.getByRole('button', { name: 'Tạo phiếu' }).click();
  await expect(page.locator('#tk-title-error')).toContainText('khoảng trắng');
  await expect(page.getByLabel('Tiêu đề')).toBeFocused();

  const [res] = await Promise.all([
    page.waitForResponse(
      (r) =>
        r.url().endsWith('/api/tickets') && r.request().method() === 'POST',
    ),
    (async () => {
      await page.getByLabel('Tiêu đề').fill('Phiếu tạo bằng E2E buổi 2');
      await page.getByRole('button', { name: 'Tạo phiếu' }).click();
    })(),
  ]);
  expect(res.status()).toBe(201);
  expect(res.request().headers()['idempotency-key']).toMatch(/[0-9a-f-]{36}/);
  expect(res.headers()['idempotent-replayed']).toBe('false');
  await expect(page).toHaveURL(/\/tickets$/);
  await expect(page.getByText(/Đã tạo phiếu TK-/)).toBeVisible();
});

async function resolvedList(page: Page) {
  await login(page, 'supervisor1', '/tickets');
  await expect(page.locator('tbody tr.ant-table-row').first()).toBeVisible();
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('status=RESOLVED')),
    (async () => {
      await page.locator('#tk-status').click();
      await page.locator('nz-option-item', { hasText: 'Đã xử lý' }).click();
    })(),
  ]);
  const first = page.locator('tbody tr.ant-table-row').first();
  return {
    first,
    code: (await first.locator('td').first().textContent())?.trim(),
  };
}

test('hai manager duyet cung phieu: nguoi sau nhan 409, agent khong thay nut', async ({
  browser,
}) => {
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  const rowA = await resolvedList(a);
  const rowB = await resolvedList(b);
  expect(rowB.code).toBe(rowA.code);

  await rowA.first.getByRole('button', { name: /Duyệt/ }).click();
  await expect(a.getByText(`Đã duyệt phiếu ${rowA.code}`)).toBeVisible();

  await rowB.first.getByRole('button', { name: /Duyệt/ }).click();
  const alert = b.getByRole('alert');
  await expect(alert).toContainText('Không duyệt được phiếu');
  await expect(alert).toContainText('Dữ liệu đã bị người khác thay đổi');
  await alert.getByRole('button', { name: 'Tải lại danh sách' }).click();
  await expect(
    b.locator('tbody tr.ant-table-row').first().locator('td').first(),
  ).not.toHaveText(rowA.code ?? '');

  const agent = await (await browser.newContext()).newPage();
  await login(agent, 'agent1', '/tickets');
  await expect(agent.locator('tbody tr.ant-table-row').first()).toBeVisible();
  await expect(
    agent.locator('tbody').getByRole('button', { name: /Duyệt/ }),
  ).toHaveCount(0);
});
