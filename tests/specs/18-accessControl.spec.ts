import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { LoginPage } from '../pageObjects/LoginPage';
import { stepPause } from '../utils/stepPause';

test('@TC18 Access control — non-admin roles redirected from admin-only pages', async ({ browser }) => {
  // QA Specialist cannot access /customers
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  const login1 = new LoginPage(page1);
  await login1.loginAs(Accounts.qaSpecialist.email, Accounts.qaSpecialist.password);
  await stepPause(page1, 'QA Specialist logged in');
  await page1.goto('/customers', { waitUntil: 'domcontentloaded' });
  await page1.waitForURL(/\/dashboard/, { timeout: 20000 });
  await expect(page1).not.toHaveURL(/\/customers/);
  await stepPause(page1, 'QA Specialist correctly redirected away from /customers');
  await ctx1.close();

  // QA Manager cannot access /upload
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  const login2 = new LoginPage(page2);
  await login2.loginAs(Accounts.qaManager.email, Accounts.qaManager.password);
  await stepPause(page2, 'QA Manager logged in');
  await page2.goto('/upload', { waitUntil: 'domcontentloaded' });
  await page2.waitForURL(/\/dashboard/, { timeout: 20000 });
  await expect(page2).not.toHaveURL(/\/upload/);
  await stepPause(page2, 'QA Manager correctly redirected away from /upload', 1500);
  await ctx2.close();
});
