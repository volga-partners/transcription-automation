import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getRunState, requireState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { BatchDetailPage } from '../pageObjects/admin/BatchDetailPage';
import { stepPause } from '../utils/stepPause';

test('@TC05 Assign completed file', async ({ page }) => {
  const run = getRunState();
  const batchId = requireState(run, 'batchId');
  const rejectBatchId = requireState(run, 'rejectBatchId');

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.admin.email, Accounts.admin.password);
  await page.goto(`/batches/${batchId}`, { waitUntil: 'domcontentloaded' });
  await stepPause(page, 'Batch detail opened');

  const batchPage = new BatchDetailPage(page);
  await batchPage.expectLoaded(run.batchName);
  await batchPage.assignFirstCompletedFileTo(Accounts.qaSpecialist.email);
  await stepPause(page, `Assigned file to ${Accounts.qaSpecialist.email}`, 1500);

  await page.goto(`/batches/${rejectBatchId}`, { waitUntil: 'domcontentloaded' });
  await batchPage.expectLoaded(run.rejectBatchName);
  await batchPage.assignFirstCompletedFileTo(Accounts.qaSpecialist.email);
  await stepPause(page, `Assigned reject-decision file to ${Accounts.qaSpecialist.email}`, 1500);
});
