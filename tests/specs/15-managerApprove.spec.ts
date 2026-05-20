import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getRunState, requireState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { ReviewWorkspacePage } from '../pageObjects/shared/ReviewWorkspacePage';
import { stepPause } from '../utils/stepPause';

test('@TC15 QA Manager review decision - approve', async ({ page }) => {
  const run = getRunState();
  const fileId = requireState(run, 'fileId');

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.qaManager.email, Accounts.qaManager.password);
  await page.goto(`/review/${fileId}`, { waitUntil: 'domcontentloaded' });

  const workspace = new ReviewWorkspacePage(page);
  await workspace.expectLoaded(run.fileName);
  await stepPause(page, 'QA Manager reviewing approval candidate');
  await workspace.approveSubmittedReview();
  await stepPause(page, 'Review approved', 1500);
});
