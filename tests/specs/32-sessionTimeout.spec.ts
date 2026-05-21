import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { LoginPage } from '../pageObjects/LoginPage';
import { stepPause } from '../utils/stepPause';

test('@TC32 Session timeout — clearing auth cookies redirects to login', async ({ page }) => {
  test.setTimeout(2 * 60 * 1000);

  await new LoginPage(page).loginAs(Accounts.admin.email, Accounts.admin.password);
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await stepPause(page, 'Admin logged in and on dashboard');

  // Simulate session expiry by clearing all cookies
  await page.context().clearCookies();
  await stepPause(page, 'Auth cookies cleared');

  // Attempt to navigate to a protected page
  await page.goto('/upload', { waitUntil: 'domcontentloaded' });

  // App must redirect to login — not show the protected page or a blank screen
  await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
  await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible({ timeout: 10000 });
  await stepPause(page, 'Redirected to /login — session correctly invalidated', 1500);
});
