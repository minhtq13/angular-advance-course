import { APIRequestContext, expect, Page, test } from '@playwright/test';

// Hành trình nghiệp vụ quan trọng nhất của phiếu, qua giao diện thật và backend thật (chế độ đăng nhập local).
// Mỗi lần chạy tạo một phiếu mới và đóng nó. Chạy: npx playwright test -c apps/portal-e2e/playwright.config.mts journeys
const API = process.env['API_URL'] ?? 'http://localhost:8081';

async function login(page: Page, user: string, url: string) {
  await page.goto(url);
  await page.getByLabel('Tên đăng nhập').fill(user);
  await page.getByLabel('Mật khẩu').fill(user);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
}

async function apiToken(request: APIRequestContext, user: string) {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { username: user, password: user },
  });
  expect(res.status()).toBe(200);
  return `Bearer ${(await res.json()).accessToken}`;
}

test('agent tao phieu -> manager duyet -> agent thay phieu da dong', async ({
  browser,
  request,
}) => {
  const title = `Hanh trinh E2E ${Date.now()}`;

  // 1. Agent tạo phiếu trên giao diện.
  const agent = await (await browser.newContext()).newPage();
  await login(agent, 'agent1', '/subscribers/1');
  await agent.getByRole('link', { name: 'Tạo phiếu' }).click();
  await agent.locator('#tk-category').click();
  await agent.locator('nz-option-item').first().click();
  await agent.getByLabel('Tiêu đề').fill(title);
  // Đọc body ngay khi response về: sau đó trang chuyển về danh sách, trình duyệt bỏ body.
  const created = agent
    .waitForResponse(
      (r) =>
        r.url().endsWith('/api/tickets') && r.request().method() === 'POST',
    )
    .then(async (r) => ({ status: r.status(), body: await r.json() }));
  await agent.getByRole('button', { name: 'Tạo phiếu' }).click();
  const { status, body: ticket } = await created;
  expect(status).toBe(201);
  await expect(agent.getByText(`Đã tạo phiếu ${ticket.code}`)).toBeVisible();

  // 2. Arrange qua API: giao diện chưa có nút "Đã xử lý". Bước phụ không cần đi qua UI.
  const agentToken = await apiToken(request, 'agent1');
  const resolved = await request.patch(`${API}/api/tickets/${ticket.id}`, {
    headers: { Authorization: agentToken },
    data: { status: 'RESOLVED', version: ticket.version },
  });
  expect(resolved.status()).toBe(200);

  // 3. Manager duyệt trên giao diện.
  const manager = await (await browser.newContext()).newPage();
  await login(manager, 'supervisor1', '/tickets?status=RESOLVED');
  const row = manager.locator('tbody tr.ant-table-row', {
    hasText: ticket.code,
  });
  await row.getByRole('button', { name: /Duyệt/ }).click();
  await expect(
    manager.getByText(`Đã duyệt phiếu ${ticket.code}`),
  ).toBeVisible();
  await expect(row).toHaveCount(0);

  // 4. Agent thấy phiếu ở trạng thái mới (phiên vẫn còn, tải lại trang).
  await agent.goto('/tickets?status=CLOSED');
  const closedRow = agent.locator('tbody tr.ant-table-row', {
    hasText: ticket.code,
  });
  await expect(closedRow).toContainText('Đã đóng');
  await expect(closedRow).toContainText(title);

  // 5. Dữ liệu ở server đúng như giao diện nói.
  const saved = await request.get(`${API}/api/tickets/${ticket.id}`, {
    headers: { Authorization: agentToken },
  });
  expect(await saved.json()).toMatchObject({
    status: 'CLOSED',
    version: ticket.version + 2,
  });
});
