import { test, expect, type Browser, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const password = process.env.GRANTHALAYA_E2E_PASSWORD;
const database = process.env.GRANTHALAYA_E2E_DB;
if (!password || !/^Granthalaya_E2E_[a-f0-9]{32}$/.test(database ?? '')) {
  throw new Error('Use the disposable SQL Server E2E runner for recording.');
}
const directory = path.resolve('../artifacts/e2e/recordings');
const viewport = { width: 1440, height: 1000 };
const navigate = (page: Page, name: string) => page.getByRole('banner').getByRole('button', { name, exact: true }).click();
// Short deliberate holds make results readable. These are presentation timing,
// not synchronization: each operation is checked with an assertion first.
const hold = (page: Page, milliseconds = 850) => page.waitForTimeout(milliseconds);

async function authenticate(browser: Browser) {
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3100', viewport });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await page.getByRole('button', { name: 'Staff Sign In', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Staff Sign In' });
    await dialog.getByLabel('Email', { exact: true }).fill('demo.admin@example.test');
    await dialog.getByLabel('Password', { exact: true }).fill(password!);
    await dialog.getByRole('button', { name: 'Sign In', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Book titles/ })).toBeVisible();
    const token = await page.evaluate(() => sessionStorage.getItem('lms_bearer_token'));
    if (!token) throw new Error('The real UI sign-in did not establish a session.');
    return token;
  } finally { await context.close(); }
}

async function record(browser: Browser, token: string, name: string, workflow: (page: Page, begin: () => void) => Promise<void>) {
  await mkdir(directory, { recursive: true });
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:3100', viewport, timezoneId: 'Asia/Kolkata',
    recordVideo: { dir: directory, size: viewport },
  });
  // Transfer the real, issued tab session in memory. The application still
  // validates it with /api/auth/me; no mock responses or bypassed API checks.
  await context.addInitScript(value => sessionStorage.setItem('lms_bearer_token', value), token);
  const page = await context.newPage();
  const video = page.video()!;
  const origin = Date.now();
  let start = 0;
  let end = 0;
  try {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /^Book titles 8$/ })).toBeVisible();
    await hold(page, 300);
    start = (Date.now() - origin) / 1000;
    await workflow(page, () => { start = (Date.now() - origin) / 1000; });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    end = (Date.now() - origin) / 1000;
  } finally { await context.close(); }
  await video.saveAs(path.join(directory, `${name}.webm`));
  await writeFile(path.join(directory, `${name}.json`), JSON.stringify({ start, end, viewport }, null, 2));
}

test('Record catalog copy inventory and the complete circulation lifecycle', async ({ browser }) => {
  const token = await authenticate(browser);
  await record(browser, token, 'catalog-copies', async (page, begin) => {
    await navigate(page, 'Books');
    await expect(page.getByRole('row').filter({ hasText: 'Clean Code' })).toBeVisible();
    begin();
    await hold(page);
    await page.getByLabel('Search books by title, author, or ISBN').pressSequentially('Clean Code', { delay: 65 });
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    const row = page.getByRole('row').filter({ hasText: 'Clean Code' });
    await expect(row).toContainText('1 / 1 available');
    await hold(page);
    await row.getByRole('button', { name: 'Details', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Book Details' });
    await expect(dialog.getByText('DEMO-COPY-001', { exact: true })).toBeVisible();
    await hold(page);
    await dialog.getByLabel('Accession number', { exact: true }).pressSequentially('DEMO-COPY-009', { delay: 85 });
    await hold(page, 450);
    await dialog.getByRole('button', { name: 'Add Copy', exact: true }).click();
    await expect(dialog.getByText('DEMO-COPY-009', { exact: true })).toBeVisible();
    await expect(dialog.getByText('2 / 2', { exact: true })).toBeVisible();
    await hold(page, 1800);
  });

  await record(browser, token, 'circulation', async (page, begin) => {
    await navigate(page, 'Borrow Records');
    await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('7 records');
    begin();
    await hold(page);
    await page.getByRole('button', { name: '+ New Record', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Issue Book Loan' });
    await dialog.getByLabel('Find Book').pressSequentially('Practical TypeScript', { delay: 45 });
    await expect(dialog.getByLabel('Select Book *').locator('option')).toContainText(['-- Choose an available book --', 'Practical TypeScript']);
    await dialog.getByLabel('Select Book *').selectOption({ label: 'Practical TypeScript (By Demo Author) · 1 available' });
    await dialog.getByLabel('Find Student').pressSequentially('DEMO-001', { delay: 65 });
    await expect(dialog.getByLabel('Registered Student *').locator('option')).toContainText(['-- Choose a registered student --', 'Demo Reader']);
    await dialog.getByLabel('Registered Student *').selectOption({ label: 'Demo Reader · DEMO-001' });
    await hold(page, 500);
    await dialog.getByLabel('Physical Copy *').selectOption({ label: 'DEMO-COPY-008 · Good' });
    const due = await page.evaluate(() => {
      const date = new Date(); date.setDate(date.getDate() + 14);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });
    await dialog.getByLabel('Due Date *').fill(due);
    await hold(page, 1000);
    await dialog.getByRole('button', { name: 'Issue Loan Record', exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByLabel('Search loans by borrower, book, or accession number').fill('DEMO-COPY-008');
    const loan = page.getByRole('row').filter({ hasText: 'DEMO-COPY-008' });
    await expect(loan).toContainText('Borrowed');
    await hold(page, 1400);
    await navigate(page, 'Books');
    await page.getByLabel('Search books by title, author, or ISBN').fill('Practical TypeScript');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: 'Practical TypeScript' })).toContainText('none available');
    await hold(page, 1400);
    await navigate(page, 'Borrow Records');
    await page.getByLabel('Search loans by borrower, book, or accession number').fill('DEMO-COPY-008');
    await expect(loan).toContainText('Borrowed');
    await loan.getByRole('button', { name: 'Mark Returned', exact: true }).click();
    const confirm = page.getByRole('alertdialog');
    await expect(confirm).toBeVisible();
    await hold(page, 750);
    await confirm.getByRole('button', { name: 'Confirm Return', exact: true }).click();
    await expect(loan).toContainText('Returned');
    await page.getByRole('button', { name: 'Returned', exact: true }).click();
    await expect(loan).toBeVisible();
    await hold(page, 1400);
    await navigate(page, 'Books');
    await page.getByLabel('Search books by title, author, or ISBN').fill('Practical TypeScript');
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: 'Practical TypeScript' })).toContainText('1 / 1 available');
    await hold(page, 1400);
    await navigate(page, 'Borrow Records');
    await page.getByRole('button', { name: 'Returned', exact: true }).click();
    await page.getByLabel('Search loans by borrower, book, or accession number').fill('DEMO-COPY-008');
    await expect(loan).toContainText('Returned');
    await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('1 records');
    await hold(page, 1600);
  });
});
