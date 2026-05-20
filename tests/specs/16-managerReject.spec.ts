import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getRunState, requireState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { MyAssignmentsPage } from '../pageObjects/qa-specialist/MyAssignmentsPage';
import { ReviewWorkspacePage } from '../pageObjects/shared/ReviewWorkspacePage';
import { stepPause } from '../utils/stepPause';

test('@TC16 QA Manager review decision - reject', async ({ page }) => {
  const run = getRunState();
  const rejectFileId = requireState(run, 'rejectFileId');

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.qaManager.email, Accounts.qaManager.password);
  await page.goto(`/review/${rejectFileId}`, { waitUntil: 'domcontentloaded' });

  const workspace = new ReviewWorkspacePage(page);
  await workspace.expectLoaded(run.rejectFileName);
  await stepPause(page, 'QA Manager reviewing rejection candidate');
  await workspace.rejectSubmittedReview(run.rejectionReason);
  await stepPause(page, 'Review rejected', 1500);

  await loginPage.loginAs(Accounts.qaSpecialist.email, Accounts.qaSpecialist.password);

  const assignmentsPage = new MyAssignmentsPage(page);
  await assignmentsPage.navigate();
  await stepPause(page, 'Rejected file returned to specialist assignments');
  await assignmentsPage.openAssignedFile(run.rejectBatchName);

  await workspace.expectLoaded(run.rejectFileName);
  await stepPause(page, 'QA Specialist re-opened rejected file');
  await workspace.editFirstSegment(` AUTO RESUBMIT ${run.runId}`);
  await stepPause(page, 'QA Specialist re-edited rejected file');
  await workspace.submitReview();
  await stepPause(page, 'Rejected file re-submitted', 1500);
});
