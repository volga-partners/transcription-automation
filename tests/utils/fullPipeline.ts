import { Browser } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getFirstAudioFile } from '../data/testData';
import { StandaloneState } from '../fixtures/standaloneState';
import { LoginPage } from '../pageObjects/LoginPage';
import { UploadPage } from '../pageObjects/admin/UploadPage';
import { BatchDetailPage } from '../pageObjects/admin/BatchDetailPage';
import { cleanupAutomationData } from './cleanup';

/**
 * Admin context: upload one file → transcribe → assign to QA Specialist.
 * Returns batchId and fileId. Context is closed before returning.
 */
export async function uploadTranscribeAssign(
  browser: Browser,
  shared: StandaloneState,
  batchName: string,
): Promise<{ batchId: string; fileId: string }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
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

    const batchPage = new BatchDetailPage(page);
    await batchPage.expectLoaded(batchName);
    await batchPage.startTranscriptionIfReady();
    await batchPage.waitForTranscriptionCompleted(18);

    // Reload so review links are fully rendered after dynamic transcription update
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    const fileId = await batchPage.getFirstReviewFileId();
    await batchPage.assignFirstCompletedFileTo(Accounts.qaSpecialist.email);

    return { batchId, fileId };
  } finally {
    await ctx.close();
  }
}

/** Admin context: delete only the batch (hierarchy stays). */
export async function cleanupBatch(
  browser: Browser,
  shared: StandaloneState,
  batchName: string,
  batchId: string,
): Promise<void> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await new LoginPage(page).loginAs(Accounts.admin.email, Accounts.admin.password);
    await cleanupAutomationData(page, {
      clientName:  shared.clientName,
      projectName: shared.projectName,
      phaseName:   shared.phaseName,
      batchName,
      batchId,
    });
  } finally {
    await ctx.close();
  }
}
