import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { resetRunState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { stepPause } from '../utils/stepPause';

test('@TC01 Multi-role login', async ({ browser }) => {
  resetRunState();

  for (const account of [Accounts.admin, Accounts.qaSpecialist, Accounts.qaManager]) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    await loginPage.loginAs(account.email, account.password);
    await stepPause(page, `Logged in as ${account.email}`);
    await expect(page).not.toHaveURL(/\/login/);
    await context.close();
  }
});
