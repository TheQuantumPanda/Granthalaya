import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, retries: 0, timeout: 60000,
  reporter: 'list', outputDir: '../artifacts/e2e/results',
  use: { baseURL: 'http://127.0.0.1:3100', actionTimeout: 10000, viewport: { width: 1440, height: 1000 },
    timezoneId: 'Asia/Kolkata', screenshot: 'only-on-failure', trace: 'retain-on-failure',
    launchOptions: process.env.GRANTHALAYA_BROWSER_EXECUTABLE ? { executablePath: process.env.GRANTHALAYA_BROWSER_EXECUTABLE } : {} }
});
