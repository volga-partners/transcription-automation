import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getFirstAudioFile } from '../data/testData';
import { getStandaloneState } from '../fixtures/standaloneState';
import { LoginPage } from '../pageObjects/LoginPage';
import { UploadPage } from '../pageObjects/admin/UploadPage';
import { BatchDetailPage } from '../pageObjects/admin/BatchDetailPage';
import { cleanupAutomationData } from '../utils/cleanup';
import { stepPause } from '../utils/stepPause';

test('@TC25 Batch status — transitions from READY to COMPLETED after transcription', async ({ page }) => {
  test.setTimeout(25 * 60 * 1000);

  const shared = getStandaloneState();
  if (!shared) throw new Error('Run standalone-setup.spec.ts first.');

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const batchName = `AUTO Batch ${runId} Status`;

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

  // The batch header badge shows e.g. "READY" before transcription
  const readyBadge = page.locator('main').getByText(/^READY\b/).first();
  await expect(readyBadge).toBeVisible({ timeout: 10000 });
  await stepPause(page, 'Batch status is READY');

  const batchPage = new BatchDetailPage(page);
  await batchPage.startTranscriptionIfReady();
  await stepPause(page, 'Transcription started — status should leave READY');

  // READY badge disappears once transcription kicks off
  await expect(readyBadge).toBeHidden({ timeout: 30000 });
  await stepPause(page, 'READY status gone — transcription in progress');

  await batchPage.waitForTranscriptionCompleted(18);

  // Verify COMPLETED badge appears (batch header or file row — either confirms completion)
  await expect(page.locator('main').getByText(/^COMPLETED\b/).first()).toBeVisible({ timeout: 10000 });
  await stepPause(page, 'Batch status is COMPLETED', 1500);

  await cleanupAutomationData(page, {
    clientName:  shared.clientName,
    projectName: shared.projectName,
    phaseName:   shared.phaseName,
    batchName,
    batchId,
  });
});
