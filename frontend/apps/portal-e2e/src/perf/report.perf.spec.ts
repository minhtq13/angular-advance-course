/* eslint-disable playwright/no-skipped-test, playwright/no-conditional-in-test, playwright/no-wait-for-timeout --
   Kich ban do hieu nang, khong phai test hanh vi: can ngoi yen 5 giay, bat/tat throttle va chi chay khi PERF=1. */
import { expect, Page, test } from '@playwright/test';

/**
 * Buoi 5: do hieu nang man hinh Bao cao thue bao, in mot dong "PERF {...}" (du lieu tho) de ghi vao bang benchmark.
 * Chi chay khi PERF=1, can backend chay voi MAX_PAGE_SIZE=10000:
 *   PERF=1 THROTTLE=4 npx playwright test -c apps/portal-e2e/playwright.config.mts report.perf --project=chromium
 * THROTTLE: he so lam cham CPU (1 = khong lam cham, 4 = gia lap may yeu).
 */
test.skip(!process.env['PERF'], 'Chi chay khi PERF=1');
test.setTimeout(240_000);

const frames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );

test('bao cao 10.000 dong: tai, tai lai, ngoi yen, heap sau 20 lan dieu huong', async ({
  page,
}) => {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const throttle = Number(process.env['THROTTLE'] ?? '1');
  const metric = async (name: string) =>
    (await cdp.send('Performance.getMetrics')).metrics.find(
      (m) => m.name === name,
    )?.value ?? 0;
  const heapMb = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    await cdp.send('HeapProfiler.collectGarbage');
    return (
      Math.round(((await metric('JSHeapUsedSize')) / 1024 / 1024) * 10) / 10
    );
  };
  const listRow = page.locator('tbody tr.ant-table-row').first();

  await page.goto('/subscribers');
  await page.getByLabel('Tên đăng nhập').fill('agent1');
  await page.getByLabel('Mật khẩu').fill('agent1');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(listRow).toBeVisible();
  await page.getByRole('link', { name: 'Báo cáo' }).click();
  await expect(page.getByText('1.000 thuê bao')).toBeVisible();
  if (throttle > 1)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });

  // 1) Lan dau chuyen sang 10.000 dong.
  await page.locator('nz-select:has(#rp-size)').click();
  let t = Date.now();
  await Promise.all([
    page.waitForResponse((r) => r.url().includes('size=10000')),
    page.locator('nz-option-item', { hasText: '10.000' }).click(),
  ]);
  await expect(page.getByText('10.000 thuê bao')).toBeVisible({
    timeout: 120_000,
  });
  await frames(page);
  const firstLoadMs = Date.now() - t;

  // 2) Tai lai cung 10.000 dong, 3 lan.
  const reloadMs: number[] = [];
  for (let run = 0; run < 3; run++) {
    t = Date.now();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes('size=10000')),
      page.getByRole('button', { name: 'Tải lại' }).click(),
    ]);
    await frames(page);
    await frames(page);
    reloadMs.push(Date.now() - t);
  }
  const domNodes = await page.evaluate(
    () => document.getElementsByTagName('*').length,
  );

  // 3) Ngoi yen 5 giay voi 10.000 dong (dong ho cap nhat moi giay).
  const s0 = await metric('ScriptDuration');
  const r0 = await metric('RecalcStyleDuration');
  const l0 = await metric('LayoutDuration');
  await page.waitForTimeout(5000);
  const idle = {
    scriptMs: Math.round(((await metric('ScriptDuration')) - s0) * 1000),
    styleMs: Math.round(((await metric('RecalcStyleDuration')) - r0) * 1000),
    layoutMs: Math.round(((await metric('LayoutDuration')) - l0) * 1000),
  };
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

  // 4) Heap: 20 lan Bao cao (mac dinh 1.000 dong) <-> Danh sach.
  await page.getByRole('link', { name: 'Về danh sách' }).click();
  await expect(listRow).toBeVisible();
  const heapBefore = await heapMb();
  for (let i = 0; i < 20; i++) {
    await page.getByRole('link', { name: 'Báo cáo' }).click();
    await expect(page.getByText('1.000 thuê bao')).toBeVisible();
    await page.getByRole('link', { name: 'Về danh sách' }).click();
    await expect(listRow).toBeVisible();
  }
  const heapAfter = await heapMb();

  console.log(
    'PERF ' +
      JSON.stringify({
        throttle,
        firstLoadMs,
        reloadMs,
        domNodes,
        idle,
        heapBefore,
        heapAfter,
      }),
  );
});
