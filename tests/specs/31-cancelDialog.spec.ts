import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getFirstAudioFile } from '../data/testData';
import { getStandaloneState } from '../fixtures/standaloneState';
import { LoginPage } from '../pageObjects/LoginPage';
import { UploadPage } from '../pageObjects/admin/UploadPage';
import { BatchDetailPage } from '../pageObjects/admin/BatchDetailPage';
import { stepPause } from '../utils/stepPause';

test('@TC31 Cancel dialogs — cancelling a destructive action leaves data unchanged', async ({ page }) => {
  test.setTimeout(5 * 60 * 1000);

  const shared = getStandaloneState();
  if (!shared) throw new Error('Run standalone-setup.spec.ts first.');

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const batchName = `AUTO Batch ${runId} Cancel`;

  await new LoginPage(page).loginAs(Accounts.admin.email, Accounts.admin.password);

  const uploadPage = new UploadPage(page);
  await uploadPage.navigate();
  const { batchId } = await uploadPage.uploadAudioBatch({
    customerName: shared.clientName,
    projectName:  shared.projectName,
    phaseName:    shared.phaseName,
    batchName,
    audioPath: getFirstAudioFile(),
  });
  await stepPause(page, 'Batch uploaded');

  const batchPage = new BatchDetailPage(page);
  await batchPage.expectLoaded(batchName);
  await stepPause(page, 'Batch detail page loaded');

  // Open Delete Batch dialog and cancel
  await page.getByRole('button', { name: 'Delete Batch' }).click();
  await expect(page.getByRole('heading', { name: 'Delete Batch' })).toBeVisible({ timeout: 10000 });
  await stepPause(page, 'Delete Batch dialog opened');

  await page.getByRole('button', { name: /Cancel/i }).click();
  await expect(page.getByRole('heading', { name: 'Delete Batch' })).toBeHidden({ timeout: 5000 });
  await stepPause(page, 'Dialog cancelled');

  // Batch heading must still be present — nothing was deleted
  await expect(page.getByRole('heading', { name: batchName })).toBeVisible({ timeout: 5000 });
  await stepPause(page, 'Batch still exists after cancel — data unchanged', 1500);

  // Cleanup: actually delete the batch now
  await batchPage.deleteBatch();
  void batchId;
});
