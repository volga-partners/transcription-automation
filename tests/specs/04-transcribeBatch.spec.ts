import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getRunState, requireState, updateRunState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { BatchDetailPage } from '../pageObjects/admin/BatchDetailPage';
import { stepPause } from '../utils/stepPause';

test('@TC04 Start transcription and poll', async ({ page }) => {
  test.setTimeout(20 * 60 * 1000);
  const run = getRunState();
  const batchId = requireState(run, 'batchId');
  const rejectBatchId = requireState(run, 'rejectBatchId');

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.admin.email, Accounts.admin.password);
  await page.goto(`/batches/${batchId}`, { waitUntil: 'domcontentloaded' });
  await stepPause(page, 'Batch detail opened');

  const batchPage = new BatchDetailPage(page);
  await batchPage.transcribeAndReturnFirstFileId(run.batchName);
  await stepPause(page, 'Transcription started or already running', 1500);
  const fileId = await batchPage.getFirstReviewFileId();
  updateRunState({ fileId });
  await stepPause(page, 'Primary transcription completed', 1500);

  await page.goto(`/batches/${rejectBatchId}`, { waitUntil: 'domcontentloaded' });
  const rejectFileId = await batchPage.transcribeAndReturnFirstFileId(run.rejectBatchName);
  updateRunState({ rejectFileId });
  await stepPause(page, 'Reject-candidate transcription completed', 1500);
});
