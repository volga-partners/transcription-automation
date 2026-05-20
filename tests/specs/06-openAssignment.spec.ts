import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getRunState, requireState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { MyAssignmentsPage } from '../pageObjects/qa-specialist/MyAssignmentsPage';
import { ReviewWorkspacePage } from '../pageObjects/shared/ReviewWorkspacePage';
import { stepPause } from '../utils/stepPause';

test('@TC06 Open assigned workspace from My Assignments', async ({ page }) => {
  const run = getRunState();
  const fileName = requireState(run, 'fileName');

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.qaSpecialist.email, Accounts.qaSpecialist.password);
  await stepPause(page, 'QA Specialist logged in');

  const assignmentsPage = new MyAssignmentsPage(page);
  await assignmentsPage.navigate();
  await stepPause(page, 'My Assignments opened');
  await assignmentsPage.openAssignedFile(run.batchName);

  const workspace = new ReviewWorkspacePage(page);
  await workspace.expectLoaded();
  await workspace.expectMinimumSegments(2);
  await stepPause(page, 'Assigned workspace opened', 1500);
});
