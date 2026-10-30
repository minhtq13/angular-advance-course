import { expect, test } from '@playwright/test';

test.describe('Dang nhap va tra cuu thue bao', () => {
  test('sai mat khau thi bao loi, khong vao duoc', async ({ page }) => {
    await page.goto('/subscribers');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Fsubscribers/);

    await page.getByLabel('Tên đăng nhập').fill('agent1');
    await page.getByLabel('Mật khẩu').fill('sai-mat-khau');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(
      page.getByText('Sai tên đăng nhập hoặc mật khẩu'),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('agent dang nhap, tim thue bao va mo chi tiet', async ({ page }) => {
    await page.goto('/subscribers');
    await page.getByLabel('Tên đăng nhập').fill('agent1');
    await page.getByLabel('Mật khẩu').fill('agent1');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // Quay lại đúng trang đang mở trước khi đăng nhập.
    await expect(page).toHaveURL(/\/subscribers$/);
    await expect(page.locator('.user-info')).toContainText('Agent One');
    await expect(page).toHaveTitle('Thuê bao · Care Portal');
    await expect(
      page.locator('nz-table tbody tr.ant-table-row').first(),
    ).toBeVisible();

    await page
      .getByPlaceholder('Số thuê bao, CCCD hoặc họ tên')
      .fill('0900000017');
    await expect(page.locator('nz-table tbody tr.ant-table-row')).toHaveCount(
      1,
    );
    await page.locator('nz-table tbody tr.ant-table-row').first().click();

    await expect(page).toHaveURL(/\/subscribers\/17$/);
    await expect(page.locator('h1')).toContainText('0900000017');
    // agent không có quyền đổi trạng thái.
    await expect(page.getByRole('button', { name: 'Tạm khóa' })).toHaveCount(0);

    // Tải lại trang vẫn còn đăng nhập (token trong sessionStorage).
    await page.reload();
    await expect(page.locator('h1')).toContainText('0900000017');

    // Đăng xuất nằm trong menu tài khoản.
    await page.getByRole('button', { name: 'Tài khoản Agent One' }).click();
    await page.getByText('Đăng xuất').click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('dang nhap xong quay lai dung trang dang mo (returnUrl)', async ({
    page,
  }) => {
    // Không dùng /subscribers: đó là trang mặc định nên không chứng minh được returnUrl.
    await page.goto('/tickets');
    await expect(page).toHaveURL(/\/login\?returnUrl=%2Ftickets/);
    await page.getByLabel('Tên đăng nhập').fill('agent1');
    await page.getByLabel('Mật khẩu').fill('agent1');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(page).toHaveURL(/\/tickets$/);
    await expect(page).toHaveTitle('Phiếu yêu cầu · Care Portal');
  });

  test('da dang nhap ma mo lai trang dang nhap kem returnUrl -> di tiep toi trang do', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Tên đăng nhập').fill('agent1');
    await page.getByLabel('Mật khẩu').fill('agent1');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await expect(page).toHaveURL(/\/subscribers$/);

    // Vd: tải lại trang ngay sau khi đăng nhập, hoặc mở lại link cũ trong tab mới.
    await page.goto('/login?returnUrl=%2Ftickets');
    await expect(page).toHaveURL(/\/tickets$/);

    // returnUrl trỏ ra ngoài -> bị chặn, về trang chủ.
    await page.goto('/login?returnUrl=%2F%2Fevil.com');
    await expect(page).toHaveURL(/\/subscribers$/);
  });
});
