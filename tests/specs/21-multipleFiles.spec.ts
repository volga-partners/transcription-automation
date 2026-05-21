import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getAudioFiles } from '../data/testData';
import { getStandaloneState } from '../fixtures/standaloneState';
import { LoginPage } from '../pageObjects/LoginPage';
import { UploadPage } from '../pageObjects/admin/UploadPage';
import { cleanupAutomationData } from '../utils/cleanup';
import { stepPause } from '../utils/stepPause';

test('@TC21 Multiple files — upload two audio files in a single batch', async ({ page }) => {
  const shared = getStandaloneState();
  if (!shared) throw new Error('Run standalone-setup.spec.ts first to create the shared hierarchy.');

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const batchName = `AUTO Batch ${runId} Multi`;
  const files = getAudioFiles(2);

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.admin.email, Accounts.admin.password);
  await stepPause(page, 'Admin logged in');

  const uploadPage = new UploadPage(page);
  await uploadPage.navigate();
  await stepPause(page, 'Upload page opened');

  const { batchId } = await uploadPage.uploadAudioBatch({
    customerName: shared.clientName,
    projectName:  shared.projectName,
    phaseName:    shared.phaseName,
    batchName,
    audioPath: files,
  });
  await stepPause(page, `Multi-file batch uploaded: ${batchName}`);

  // Batch detail page shows 2 files
  await expect(page.getByRole('heading', { name: /Files \(2\)/ })).toBeVisible({ timeout: 10000 });
  await expect(page.locator('tbody tr')).toHaveCount(2, { timeout: 10000 });
  await stepPause(page, 'Batch detail page shows 2 files', 1500);

  // Clean up only this batch — hierarchy is shared and stays
  await cleanupAutomationData(page, {
    clientName:  shared.clientName,
    projectName: shared.projectName,
    phaseName:   shared.phaseName,
    batchName,
    batchId,
  });
  await stepPause(page, 'Batch cleaned up');
});
