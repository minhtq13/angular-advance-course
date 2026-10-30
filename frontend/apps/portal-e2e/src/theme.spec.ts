import { expect, test } from '@playwright/test';

// Chạy bên trong trình duyệt (page.evaluate không mang được hàm khai báo ở phía Node).
const darkCssDisabled = () =>
  (document.getElementById('care-dark-theme') as HTMLLinkElement | null)
    ?.disabled ?? true;

test.describe('Theme sang / toi', () => {
  test('mac dinh theo he thong: may dang o che do toi -> app toi ngay tu dau', async ({
    browser,
  }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await page.goto('/login');

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(
      page.getByRole('button', { name: 'Theo hệ thống' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(darkCssDisabled)).toBe(false);
    await context.close();
  });

  test('chon Toi roi Sang, ghi nho sau khi tai lai', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('button', { name: 'Tối', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // Nền trang đổi sang tối (không chỉ đổi thuộc tính).
    await expect
      .poll(() =>
        page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      )
      .toBe('rgb(11, 11, 12)');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(
      page.getByRole('button', { name: 'Tối', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Sáng', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect.poll(() => page.evaluate(darkCssDisabled)).toBe(true);
    await context.close();
  });
});
