import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getRunState, requireState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { ReviewWorkspacePage } from '../pageObjects/shared/ReviewWorkspacePage';
import { stepPause } from '../utils/stepPause';

test('@TC13 Update speaker or metadata', async ({ page }) => {
  const run = getRunState();
  const fileId = requireState(run, 'fileId');

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.qaSpecialist.email, Accounts.qaSpecialist.password);
  await page.goto(`/review/${fileId}`, { waitUntil: 'domcontentloaded' });

  const workspace = new ReviewWorkspacePage(page);
  await workspace.expectLoaded(run.fileName);
  await stepPause(page, 'Ready to update metadata');
  await workspace.updateLanguageOnActiveSegment();
  await stepPause(page, 'Metadata updated', 1500);
});
