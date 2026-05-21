import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getFirstAudioFile } from '../data/testData';
import { getStandaloneState } from '../fixtures/standaloneState';
import { LoginPage } from '../pageObjects/LoginPage';
import { UploadPage } from '../pageObjects/admin/UploadPage';
import { BatchDetailPage } from '../pageObjects/admin/BatchDetailPage';
import { ReviewWorkspacePage } from '../pageObjects/shared/ReviewWorkspacePage';
import { cleanupAutomationData } from '../utils/cleanup';
import { stepPause } from '../utils/stepPause';

test('@TC23 Timestamp split — both segments retain valid timestamps after split', async ({ browser }) => {
  test.setTimeout(25 * 60 * 1000);

  const shared = getStandaloneState();
  if (!shared) throw new Error('Run standalone-setup.spec.ts first to create the shared hierarchy.');

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const batchName = `AUTO Batch ${runId} TSplit`;
  let fileId: string;
  let batchId: string;

  // ── Admin: upload, transcribe, assign ───────────────────────────────────
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await new LoginPage(page).loginAs(Accounts.admin.email, Accounts.admin.password);
    await stepPause(page, 'Admin logged in');

    const uploadPage = new UploadPage(page);
    await uploadPage.navigate();
    ({ batchId } = await uploadPage.uploadAudioBatch({
      customerName: shared.clientName,
      projectName:  shared.projectName,
      phaseName:    shared.phaseName,
      batchName,
      audioPath: getFirstAudioFile(),
    }));
    await stepPause(page, 'Batch uploaded');

    const batchPage = new BatchDetailPage(page);
    await batchPage.startTranscriptionIfReady();
    await batchPage.waitForTranscriptionCompleted(18);
    await stepPause(page, 'Transcription completed');

    fileId = await batchPage.getFirstReviewFileId();
    await batchPage.assignFirstCompletedFileTo(Accounts.qaSpecialist.email);
    await stepPause(page, `File assigned — fileId: ${fileId}`);
    await ctx.close();
  }

  // ── QA Specialist: split segment, verify timestamps ─────────────────────
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await new LoginPage(page).loginAs(Accounts.qaSpecialist.email, Accounts.qaSpecialist.password);
    await page.goto(`/review/${fileId}`, { waitUntil: 'domcontentloaded' });

    const workspace = new ReviewWorkspacePage(page);
    await workspace.expectLoaded();
    await stepPause(page, 'Review workspace opened');

    const startInputs = page.locator('input[data-tour="editor-segment-times"]');
    const countBefore = await startInputs.count();

    await workspace.splitFirstEligibleSegment();
    await stepPause(page, 'Segment split');

    await expect(startInputs).toHaveCount(countBefore + 1, { timeout: 15000 });

    // Every segment must have a non-empty start timestamp
    const total = await startInputs.count();
    for (let i = 0; i < total; i++) {
      const val = await startInputs.nth(i).inputValue();
      expect(val.trim(), `Segment ${i} start time should not be empty`).not.toBe('');
    }

    await stepPause(page, 'All segments have valid start timestamps after split', 1500);
    await ctx.close();
  }

  // ── Admin: clean up batch only ───────────────────────────────────────────
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    await new LoginPage(page).loginAs(Accounts.admin.email, Accounts.admin.password);
    await cleanupAutomationData(page, {
      clientName:  shared.clientName,
      projectName: shared.projectName,
      phaseName:   shared.phaseName,
      batchName,
      batchId,
    });
    await stepPause(page, 'Batch cleaned up');
    await ctx.close();
  }
});
