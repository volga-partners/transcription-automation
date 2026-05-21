import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { LoginPage } from '../pageObjects/LoginPage';
import { stepPause } from '../utils/stepPause';

test('@TC20 Logout — user is signed out and redirected to login', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.loginAs(Accounts.admin.email, Accounts.admin.password);
  await stepPause(page, 'Admin logged in');

  // Click the Sign out button in the sidebar
  await page.getByRole('button', { name: /sign out/i }).click();
  await stepPause(page, 'Sign out button clicked');

  // Confirm in the modal
  await page.getByRole('button', { name: /sign out/i }).last().click();
  await stepPause(page, 'Sign out confirmed in modal');

  // Should land on /login
  await page.waitForURL(/\/login/, { timeout: 20000 });
  await expect(page).toHaveURL(/\/login/);
  await stepPause(page, 'Redirected to /login after logout');
});
