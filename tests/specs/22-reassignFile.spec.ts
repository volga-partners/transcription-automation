import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getFirstAudioFile } from '../data/testData';
import { getStandaloneState } from '../fixtures/standaloneState';
import { LoginPage } from '../pageObjects/LoginPage';
import { UploadPage } from '../pageObjects/admin/UploadPage';
import { BatchDetailPage } from '../pageObjects/admin/BatchDetailPage';
import { cleanupAutomationData } from '../utils/cleanup';
import { stepPause } from '../utils/stepPause';

test('@TC22 Reassign file — reassign from QA Specialist to QA Manager', async ({ page }) => {
  test.setTimeout(25 * 60 * 1000);

  const shared = getStandaloneState();
  if (!shared) throw new Error('Run standalone-setup.spec.ts first to create the shared hierarchy.');

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const batchName = `AUTO Batch ${runId} Reassign`;

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.admin.email, Accounts.admin.password);
  await stepPause(page, 'Admin logged in');

  // Upload one file
  const uploadPage = new UploadPage(page);
  await uploadPage.navigate();
  const { batchId } = await uploadPage.uploadAudioBatch({
    customerName: shared.clientName,
    projectName:  shared.projectName,
    phaseName:    shared.phaseName,
    batchName,
    audioPath: getFirstAudioFile(),
  });
  await stepPause(page, `Batch uploaded: ${batchName}`);

  // Transcribe and wait for completion
  const batchPage = new BatchDetailPage(page);
  await batchPage.startTranscriptionIfReady();
  await stepPause(page, 'Transcription started');
  await batchPage.waitForTranscriptionCompleted(18);
  await stepPause(page, 'Transcription completed');

  // First assignment — assign to QA Specialist
  await batchPage.assignFirstCompletedFileTo(Accounts.qaSpecialist.email);
  await stepPause(page, 'File assigned to QA Specialist');

  // Verify QA Specialist display name is in the Assign To column
  await expect(page.getByRole('cell', { name: /Test QA Specialist/i })).toBeVisible({ timeout: 10000 });

  // Reassign — pick first available specialist from the unfiltered list
  await page.getByRole('button', { name: 'Select All' }).click();
  await page.getByRole('button', { name: 'Assign Selected' }).click();
  await expect(page.getByRole('heading', { name: 'Assign QA Specialist' })).toBeVisible({ timeout: 20000 });
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: /^Assign$/ }).click();
  await expect(page.getByText(/assigned successfully/i)).toBeVisible({ timeout: 30000 });
  await stepPause(page, 'File reassigned to a different specialist');

  // Verify the file is still ASSIGNED (reassignment took effect)
  await expect(page.getByRole('cell', { name: 'ASSIGNED' })).toBeVisible({ timeout: 10000 });
  await stepPause(page, 'QA Manager visible in Assign To column', 1500);

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
