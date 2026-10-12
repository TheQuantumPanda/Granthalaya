import { test, expect, Page, Locator } from '@playwright/test';
import path from 'node:path';

const password = process.env.GRANTHALAYA_E2E_PASSWORD;
if (!password) throw new Error('Run npm run test:e2e so the isolated SQL Server runner supplies test credentials.');
const apiUrl = 'http://127.0.0.1:5209';
async function login(page: Page, role: 'admin' | 'librarian' = 'admin', email = `demo.${role}@example.test`, secret = password!) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Staff Sign In', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Staff Sign In' });
  await expect(dialog.getByLabel('Email', { exact: true })).toBeFocused();
  await keyboardContainment(page, dialog);
  await dialog.getByLabel('Email', { exact: true }).fill(email);
  await dialog.getByLabel('Password', { exact: true }).fill(secret);
  await dialog.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Book titles', exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss notification' }).first().click();
}
async function navigate(page: Page, name: string) {
  await page.getByRole('banner').getByRole('button', { name, exact: true }).click();
}
async function headers(page: Page) {
  const token = await page.evaluate(() => sessionStorage.getItem('lms_bearer_token'));
  return { Authorization: `Bearer ${token}` };
}
async function keyboardContainment(page: Page, dialog: Locator) {
  const buttons = dialog.getByRole('button');
  await buttons.first().focus();
  await page.keyboard.press('Shift+Tab');
  await expect(buttons.last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(buttons.first()).toBeFocused();
}
async function createBook(page: Page, title: string, isbn: string, genre = 'Testing') {
  await navigate(page, 'Books');
  await page.getByRole('button', { name: 'Add New Book', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Book', exact: true });
  await expect(dialog.getByLabel('Book Title')).toBeFocused();
  await keyboardContainment(page, dialog);
  await dialog.getByLabel('Book Title').fill(title);
  await dialog.getByLabel('Author', { exact: true }).fill('QA Author');
  await dialog.getByLabel('ISBN', { exact: true }).fill(isbn);
  await dialog.getByLabel('Genre / Category').fill(genre);
  await dialog.getByRole('button', { name: 'Add Book', exact: true }).click();
  const details = page.getByRole('dialog', { name: 'Book Details' });
  await expect(details).toBeVisible();
  return details;
}
async function addCopy(details: Locator, accession: string) {
  await details.getByLabel('Accession number', { exact: true }).fill(accession);
  await details.getByRole('button', { name: 'Add Copy', exact: true }).click();
  await expect(details.getByText(accession, { exact: false }).first()).toBeVisible();
}
async function capturePortfolio(page: Page) {
  if (process.env.GRANTHALAYA_CAPTURE_SCREENSHOTS !== '1') return;
  const capture = async (name: string) => {
    await page.screenshot({ path: path.resolve('../docs/screenshots', `${name}.png`), animations: 'disabled' });
  };
  await expect(page.getByRole('button', { name: /^Book titles 8$/ })).toBeVisible(); await capture('dashboard');
  await navigate(page, 'Books');
  await expect(page.getByRole('row').filter({ hasText: 'Clean Code' })).toBeVisible();
  await page.getByRole('row').filter({ hasText: 'Clean Code' }).getByRole('button', { name: 'Details' }).click();
  await expect(page.getByRole('dialog', { name: 'Book Details' })).toBeVisible(); await capture('books-and-copies');
  await page.getByRole('dialog', { name: 'Book Details' }).getByRole('button', { name: 'Close', exact: true }).click();
  await navigate(page, 'Students'); await expect(page.getByRole('cell', { name: 'DEMO-001' })).toBeVisible(); await capture('students');
  await navigate(page, 'Borrow Records'); await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('7 records'); await capture('borrowing');
  await navigate(page, 'Reports'); await expect(page.getByText('Software', { exact: true })).toBeVisible(); await capture('reports');
  await navigate(page, 'Librarians'); await expect(page.getByRole('heading', { name: 'Staff sign-in accounts' })).toBeVisible(); await expect(page.getByLabel('Role for demo.admin@example.test')).toHaveValue('Admin'); await expect(page.getByRole('row').filter({ hasText: 'Demo Librarian' })).toBeVisible(); await capture('staff-accounts');
}

test('Administrator catalog, publication dates, and librarian directory CRUD', async ({ page }) => {
  await login(page); await page.reload(); await expect(page.getByRole('button', { name: /^Book titles/ })).toBeVisible();
  await capturePortfolio(page);
  const details = await createBook(page, 'QA Catalog Title', 'QA-CATALOG-1');
  await keyboardContainment(page, details);
  await addCopy(details, 'QA-CATALOG-COPY');
  await expect(details.getByText('1 / 1', { exact: true })).toBeVisible();
  const deleteCopy = details.getByRole('button', { name: 'Delete copy QA-CATALOG-COPY' });
  await deleteCopy.focus(); await expect(deleteCopy).toBeFocused(); await deleteCopy.click();
  const confirm = page.getByRole('alertdialog', { name: 'Delete Physical Copy' });
  await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeFocused(); await keyboardContainment(page, confirm);
  await page.keyboard.press('Escape'); await expect(confirm).toBeHidden(); await expect(deleteCopy).toBeFocused();
  await page.keyboard.press('Escape'); await expect(details).toBeHidden();
  await page.getByLabel('Filter books by genre').fill('Testing'); await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('row').filter({ hasText: 'QA Catalog Title' })).toBeVisible(); await expect(page.getByRole('cell', { name: 'Clean Code', exact: false })).toHaveCount(0);
  await navigate(page, 'Publications');
  await page.getByRole('button', { name: 'Add Publication', exact: true }).click();
  const publication = page.getByRole('dialog', { name: 'Publication record' }); await keyboardContainment(page, publication);
  await publication.getByLabel('Publication Title').fill('QA Daily'); await publication.getByLabel('Publisher / Press').fill('QA Press');
  await publication.getByLabel('Issue Release Date').fill('2026-09-18'); await publication.getByRole('button', { name: 'Save Publication' }).click();
  const pubRow = page.getByRole('row').filter({ hasText: 'QA Daily' }); await expect(pubRow).toBeVisible(); await pubRow.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(publication.getByLabel('Issue Release Date')).toHaveValue('2026-09-18'); await publication.getByLabel('Issue Release Date').fill('2026-09-19');
  await publication.getByRole('button', { name: 'Update Publication' }).click(); await expect(pubRow).toContainText('9/19/2026');
  await pubRow.getByRole('button', { name: 'Delete', exact: true }).click(); await page.getByRole('alertdialog').getByRole('button', { name: 'Delete Publication' }).click(); await expect(pubRow).toHaveCount(0);
  await navigate(page, 'Librarians'); await page.getByRole('button', { name: 'Add New Librarian', exact: true }).click();
  const directory = page.getByRole('dialog', { name: 'Librarian directory record' }); await keyboardContainment(page, directory);
  await directory.getByLabel('Staff Name').fill('QA Directory Person'); await directory.getByLabel('Age', { exact: true }).fill('31'); await directory.getByLabel('Phone Number').fill('0000000000');
  await directory.getByRole('button', { name: 'Save Staff Record' }).click();
  const person = page.getByRole('row').filter({ hasText: 'QA Directory Person' }); await expect(person).toBeVisible(); await person.getByRole('button', { name: 'Edit', exact: true }).click();
  await directory.getByLabel('Staff Name').fill('QA Directory Updated'); await directory.getByRole('button', { name: 'Update Librarian' }).click();
  const updated = page.getByRole('row').filter({ hasText: 'QA Directory Updated' }); await expect(updated).toBeVisible(); await updated.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete Librarian' }).click(); await expect(updated).toHaveCount(0);
  await page.getByRole('button', { name: 'Logout', exact: true }).click(); await expect(page.getByRole('button', { name: 'Staff Sign In', exact: true })).toBeVisible();
});

test('Circulation preserves history and paginates filtered loans', async ({ page }) => {
  await login(page); await navigate(page, 'Students'); await page.getByRole('button', { name: 'Register New Student' }).click();
  const student = page.getByRole('dialog', { name: 'Student record' }); await keyboardContainment(page, student);
  await student.getByLabel('Registration number', { exact: false }).fill('QA-CIRC-REG'); await student.getByLabel('Student Full Name').fill('QA Circulation Reader');
  await student.getByLabel('Email Address').fill('qa.reader@example.test'); await student.getByLabel('Phone Number').fill('0000000000'); await student.getByRole('button', { name: 'Save Student' }).click();
  await expect(student).toBeHidden(); await expect(page.getByRole('cell', { name: 'QA-CIRC-REG' })).toBeVisible();
  await navigate(page, 'Borrow Records'); await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('Page 1 of 2');
  await page.getByRole('navigation', { name: 'Pagination' }).getByRole('button', { name: 'Next' }).click(); await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('Page 2 of 2');
  await page.getByRole('button', { name: '+ New Record' }).click(); const loan = page.getByRole('dialog', { name: 'Issue Book Loan' }); await keyboardContainment(page, loan);
  await loan.getByLabel('Find Book').fill('Practical TypeScript');
  await expect(loan.getByLabel('Select Book *').locator('option')).toContainText(['-- Choose an available book --', 'Practical TypeScript']);
  await loan.getByLabel('Select Book *').selectOption({ label: 'Practical TypeScript (By Demo Author) · 1 available' });
  await loan.getByLabel('Physical Copy *').selectOption({ label: 'DEMO-COPY-008 · Good' }); await loan.getByLabel('Find Student').fill('QA-CIRC-REG');
  await expect(loan.getByLabel('Registered Student *').locator('option')).toContainText(['-- Choose a registered student --', 'QA Circulation Reader']);
  await loan.getByLabel('Registered Student *').selectOption({ label: 'QA Circulation Reader · QA-CIRC-REG' });
  await loan.getByRole('button', { name: 'Issue Loan Record' }).click(); await expect(loan).toBeHidden();
  await page.getByLabel('Search loans by borrower, book, or accession number').fill('QA-CIRC-REG');
  const row = page.getByRole('row').filter({ hasText: 'QA Circulation Reader' }); await expect(row).toContainText('Borrowed');
  await row.getByRole('button', { name: 'Mark Returned' }).click(); await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm Return' }).click();
  await expect(row).toContainText('Returned'); await page.getByRole('button', { name: 'Returned', exact: true }).click(); await expect(row).toBeVisible();
  await page.getByRole('button', { name: 'Active Loans', exact: true }).click(); await expect(row).toHaveCount(0); await expect(page.getByText('No borrowing transactions match your query.')).toBeVisible();
  const h = await headers(page); const inventory = await page.request.get(`${apiUrl}/api/Books?searchQuery=Practical%20TypeScript`, { headers: h });
  expect((await inventory.json()).books[0].availableCopyCount).toBe(1);
});

test('Librarian authorization and invalid sessions', async ({ page }) => {
  await login(page, 'librarian'); await page.reload(); await expect(page.getByRole('button', { name: /^Book titles/ })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('button', { name: 'Librarians', exact: true })).toHaveCount(0);
  const h = await headers(page); for (const resource of ['staff', 'librarians', 'contact']) expect((await page.request.get(`${apiUrl}/api/${resource}`, { headers: h })).status()).toBe(403);
  await navigate(page, 'Books'); await expect(page.getByRole('heading', { name: 'Books Catalog' })).toBeVisible();
  expect((await page.request.get(`${apiUrl}/api/Books`, { headers: { Authorization: 'Bearer invalid-test-token' } })).status()).toBe(401);
  await page.getByRole('button', { name: 'Logout', exact: true }).click(); await expect(page.getByRole('button', { name: 'Staff Sign In', exact: true })).toBeVisible(); expect((await page.request.get(`${apiUrl}/api/Books`, { headers: h })).status()).toBe(401);
  await login(page, 'librarian');
  await page.evaluate(() => sessionStorage.setItem('lms_bearer_token', 'invalid-test-token')); await page.reload();
  await expect(page.getByRole('dialog', { name: 'Staff Sign In' })).toBeVisible(); await expect(page.getByRole('banner').getByRole('button', { name: 'Books', exact: true })).toHaveCount(0);
});

test('Validation conflicts and Admin inquiry pagination', async ({ page }) => {
  await login(page); await navigate(page, 'Books'); await page.getByRole('button', { name: 'Add New Book', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Add Book', exact: true }); await dialog.getByLabel('Book Title').fill('QA Duplicate'); await dialog.getByLabel('Author', { exact: true }).fill('QA Author');
  await dialog.getByLabel('ISBN', { exact: true }).fill('DEMO-ISBN-1'); await dialog.getByLabel('Publication Year').fill('1200'); await dialog.getByRole('button', { name: 'Add Book', exact: true }).click();
  await expect(dialog.getByLabel('Publication Year')).toBeFocused(); expect(await dialog.getByLabel('Publication Year').evaluate((input: HTMLInputElement) => input.validity.rangeUnderflow)).toBe(true);
  await dialog.getByLabel('Publication Year').fill('2025'); await dialog.getByRole('button', { name: 'Add Book', exact: true }).click(); await expect(page.getByRole('alert')).toContainText('ISBN is already in use.'); await page.keyboard.press('Escape');
  await navigate(page, 'Students'); await page.getByRole('button', { name: 'Register New Student' }).click(); const student = page.getByRole('dialog', { name: 'Student record' });
  await student.getByLabel('Registration number', { exact: false }).fill('DEMO-001'); await student.getByLabel('Student Full Name').fill('QA Duplicate Student'); await student.getByLabel('Email Address').fill('invalid'); await student.getByLabel('Phone Number').fill('0000000000');
  await student.getByRole('button', { name: 'Save Student' }).click(); expect(await student.getByLabel('Email Address').evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBe(true);
  await student.getByLabel('Email Address').fill('qa.duplicate@example.test'); await student.getByRole('button', { name: 'Save Student' }).click(); await expect(page.getByRole('alert').filter({ hasText: 'Registration number' })).toBeVisible(); await page.keyboard.press('Escape');
  const h = await headers(page); const books = await (await page.request.get(`${apiUrl}/api/Books?searchQuery=Software%20Engineering`, { headers: h })).json();
  const response = await page.request.post(`${apiUrl}/api/Borrow`, { headers: h, data: { studentId: 1, bookCopyId: books.books[0].bookCopies[0].bookCopyId, dueDate: new Date(Date.now() + 86400000).toISOString() } }); expect(response.status()).toBe(409); expect((await response.json()).title).toContain('unavailable');
  await page.getByRole('button', { name: 'Contact Us', exact: true }).click(); const inbox = page.getByRole('region').filter({ has: page.getByRole('heading', { name: 'Admin inquiry inbox' }) });
  await expect(page.getByRole('heading', { name: 'Admin inquiry inbox' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('7 records'); await page.getByRole('navigation', { name: 'Pagination' }).getByRole('button', { name: 'Next' }).click(); await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('Page 2 of 2');
  await page.getByLabel('Search inquiries').fill('Catalog inquiry 1'); await expect(page.getByRole('navigation', { name: 'Pagination' })).toContainText('1 records');
  await page.getByLabel('Full Name').fill('QA Inquiry'); await page.getByLabel('Email Address').fill('qa.inquiry@example.test'); await page.getByLabel('Subject / Topic').fill('QA Saved Inquiry'); await page.getByLabel('Message Body').fill('Local saved inquiry'); await page.getByRole('button', { name: 'Send Message' }).click();
  await page.getByLabel('Search inquiries').fill('QA Saved Inquiry'); await expect(page.getByRole('heading', { name: 'QA Saved Inquiry' })).toBeVisible();
});

test('Admin account lifecycle, role changes, and password revocation', async ({ page, browser }) => {
  await login(page); await navigate(page, 'Librarians'); const section = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Staff sign-in accounts' }) });
  const email = 'qa.account@example.test'; const secret = `${password}B`;
  await section.getByLabel('Email', { exact: true }).fill(email); await section.getByLabel('Temporary password').fill(secret); await section.getByRole('button', { name: 'Create librarian account' }).click();
  const account = section.locator('div').filter({ has: page.getByLabel(`Role for ${email}`, { exact: true }) }).last(); await expect(section.getByLabel(`Role for ${email}`)).toHaveValue('Librarian');
  const context = await browser.newContext({ baseURL: 'http://127.0.0.1:3100' }); const staffPage = await context.newPage(); await login(staffPage, 'librarian', email, secret); const old = await headers(staffPage);
  page.on('dialog', dialog => dialog.accept()); await section.getByLabel(`Role for ${email}`).selectOption('Admin'); await expect(section.getByLabel(`Role for ${email}`)).toHaveValue('Admin');
  expect((await page.request.get(`${apiUrl}/api/Books`, { headers: old })).status()).toBe(401); await staffPage.reload(); await expect(staffPage.getByRole('dialog', { name: 'Staff Sign In' })).toBeVisible();
  await section.getByLabel(`Role for ${email}`).selectOption('Librarian'); await expect(section.getByLabel(`Role for ${email}`)).toHaveValue('Librarian');
  await account.getByRole('button', { name: 'Disable', exact: true }).click(); await expect(account.getByRole('button', { name: 'Enable', exact: true })).toBeVisible();
  expect((await page.request.post(`${apiUrl}/api/auth/login`, { data: { email, password: secret } })).status()).toBe(401);
  await account.getByRole('button', { name: 'Enable', exact: true }).click(); await expect(account.getByRole('button', { name: 'Disable', exact: true })).toBeVisible();
  const fresh = await page.request.post(`${apiUrl}/api/auth/login`, { data: { email, password: secret } }); expect(fresh.status()).toBe(200);
  const token = (await fresh.json()).accessToken; await account.getByRole('button', { name: 'Disable', exact: true }).click(); await expect(account.getByRole('button', { name: 'Enable', exact: true })).toBeVisible(); expect((await page.request.get(`${apiUrl}/api/Books`, { headers: { Authorization: `Bearer ${token}` } })).status()).toBe(401); await account.getByRole('button', { name: 'Enable', exact: true }).click();
  await context.close(); const adminToken = await headers(page); await page.getByRole('button', { name: 'Connection Settings' }).click(); const settings = page.getByRole('dialog', { name: 'Connection and account settings' }); await keyboardContainment(page, settings);
  await settings.getByLabel('Backend API Base URL').fill('https://example.com'); await settings.getByRole('button', { name: 'Test & Save' }).click(); await expect(page.getByRole('alert').filter({ hasText: 'Use a local API URL' })).toBeVisible();
  await settings.getByLabel('Current password').fill(password!); await settings.getByLabel('New password').fill(`${password}Changed`); await settings.getByRole('button', { name: 'Update password' }).click(); await expect(page.getByRole('button', { name: 'Staff Sign In', exact: true })).toBeVisible();
  expect((await page.request.get(`${apiUrl}/api/Books`, { headers: adminToken })).status()).toBe(401);
});
