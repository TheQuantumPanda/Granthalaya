import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Run only through the disposable SQL Server runner. Normal E2E tests do not
// discover *.capture.ts; credentials and raw video remain in ignored artifacts.
export default defineConfig({
  ...base,
  testDir: './e2e',
  testMatch: 'workflows.capture.ts',
  timeout: 90000,
  outputDir: '../artifacts/e2e/capture-results',
  use: { ...base.use, viewport: { width: 1440, height: 1000 }, trace: 'off', screenshot: 'off' },
});
