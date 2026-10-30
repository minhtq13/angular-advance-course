import { expect, test } from '@playwright/test';

test.describe('Da ngon ngu', () => {
  test('mac dinh tieng Viet', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Đăng nhập',
    );
  });

  test('doi sang English: chu, so, tieu de, loi tu backend, giu lua chon khi tai lai', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'English' }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page).toHaveTitle('Sign in · Care Portal');
    await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    // Lỗi từ backend cũng bằng tiếng Anh (header Accept-Language).
    await page.getByLabel('Username').fill('agent1');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(
      page.getByText('Incorrect username or password'),
    ).toBeVisible();

    await page.getByLabel('Password').fill('agent1');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Subscribers',
    );
    await expect(page).toHaveTitle('Subscribers · Care Portal');
    // Số theo định dạng en-US.
    await expect(page.getByRole('status')).toHaveText('Total: 200,000');
    await expect(page.locator('nz-table thead')).toContainText('Phone number');

    // Tải lại trang: vẫn là English.
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Subscribers',
    );

    // Đổi lại tiếng Việt từ header, không cần tải lại trang.
    await page.getByRole('button', { name: 'Tiếng Việt' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Thuê bao',
    );
    await expect(page.getByRole('status')).toHaveText('200.000 kết quả');
    await expect(page).toHaveTitle('Thuê bao · Care Portal');
  });
});
