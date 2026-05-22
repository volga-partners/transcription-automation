import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getRunState, requireState, updateRunState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { ReviewWorkspacePage } from '../pageObjects/shared/ReviewWorkspacePage';
import { stepPause } from '../utils/stepPause';

test('@TC14 Submit reviewed file', async ({ page }) => {
  const run = getRunState();
  const fileId = requireState(run, 'fileId');
  const rejectFileId = requireState(run, 'rejectFileId');

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.qaSpecialist.email, Accounts.qaSpecialist.password);
  await page.goto(`/review/${fileId}`, { waitUntil: 'domcontentloaded' });

  const workspace = new ReviewWorkspacePage(page);
  await workspace.expectLoaded(run.fileName);
  await stepPause(page, 'Ready to submit approval-candidate review');
  await workspace.submitReview();
  await stepPause(page, 'Approval-candidate review submitted', 1500);

  await page.goto(`/review/${rejectFileId}`, { waitUntil: 'domcontentloaded' });
  await workspace.expectLoaded(run.rejectFileName);
  if (!(await workspace.isSubmitted())) {
    const rejectEditedText = await workspace.editFirstSegment(run.rejectEditedSegmentSuffix);
    updateRunState({ rejectEditedText });
  }
  await workspace.submitReview();
  await stepPause(page, 'Reject-candidate review submitted', 1500);
});
