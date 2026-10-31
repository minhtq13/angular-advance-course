import { defineConfig, devices } from '@playwright/test';

// Buổi 9: smoke test chạy trên bản ĐÃ TRIỂN KHAI (nginx trong Docker), không bật dev server.
// Dev server luôn có SPA fallback và không đặt header cache/bảo mật -> smoke trên dev server không chứng minh gì.
//   BASE_URL=http://localhost:8090 npx playwright test -c apps/portal-e2e/playwright.smoke.config.mts
export default defineConfig({
  testDir: './src/smoke',
  testMatch: '**/*.smoke.ts',
  fullyParallel: true,
  retries: 0,
  outputDir: '../../dist/.playwright/smoke-results',
  reporter: [
    ['list'],
    ['html', { outputFolder: '../../dist/smoke-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env['BASE_URL'] ?? 'http://localhost:8090',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
