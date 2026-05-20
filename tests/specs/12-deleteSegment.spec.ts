import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getRunState, requireState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { ReviewWorkspacePage } from '../pageObjects/shared/ReviewWorkspacePage';
import { stepPause } from '../utils/stepPause';

test('@TC12 Delete inserted segment', async ({ page }) => {
  const run = getRunState();
  const fileId = requireState(run, 'fileId');

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.qaSpecialist.email, Accounts.qaSpecialist.password);
  await page.goto(`/review/${fileId}`, { waitUntil: 'domcontentloaded' });

  const workspace = new ReviewWorkspacePage(page);
  await workspace.expectLoaded(run.fileName);
  await stepPause(page, 'Ready to delete automation-created segment');
  await workspace.deleteSegmentWithText(run.insertedSegmentText);
  await stepPause(page, 'Inserted segment deleted', 1500);
});
