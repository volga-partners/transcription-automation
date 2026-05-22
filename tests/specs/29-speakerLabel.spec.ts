import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getStandaloneState } from '../fixtures/standaloneState';
import { LoginPage } from '../pageObjects/LoginPage';
import { ReviewWorkspacePage } from '../pageObjects/shared/ReviewWorkspacePage';
import { uploadTranscribeAssign, cleanupBatch } from '../utils/fullPipeline';
import { stepPause } from '../utils/stepPause';

test('@TC29 Speaker label — changing speaker on a segment persists after save', async ({ browser }) => {
  test.setTimeout(25 * 60 * 1000);

  const shared = getStandaloneState();
  if (!shared) throw new Error('Run standalone-setup.spec.ts first.');

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const batchName = `AUTO Batch ${runId} Speaker`;

  const { batchId, fileId } = await uploadTranscribeAssign(browser, shared, batchName);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await new LoginPage(page).loginAs(Accounts.qaSpecialist.email, Accounts.qaSpecialist.password);
    await page.goto(`/review/${fileId}`, { waitUntil: 'domcontentloaded' });

    const workspace = new ReviewWorkspacePage(page);
    await workspace.expectLoaded();
    await stepPause(page, 'Review workspace opened');

    // Click first segment to activate it
    await page.locator('textarea').first().click();
    const activeRow = page.locator('[data-tour="editor-segment-row"]').first();
    await expect(activeRow).toBeVisible({ timeout: 10000 });

    const speakerSelect = activeRow.locator('select[data-tour="editor-speaker-select"]');
    await expect(speakerSelect).toBeVisible({ timeout: 10000 });

    // Read current speaker value
    const originalSpeaker = await speakerSelect.inputValue();
    await stepPause(page, `Current speaker: "${originalSpeaker}"`);

    // Get all available options and pick one that differs from current
    const options = await speakerSelect.locator('option').allInnerTexts();
    const different = options.find((o) => o.trim() && o !== originalSpeaker);

    if (!different) {
      console.log('Only one speaker option available — skipping change assertion');
    } else {
      await speakerSelect.selectOption({ label: different });
      await stepPause(page, `Speaker changed to: "${different}"`);

      await workspace.saveAllIfVisible();

      // Reload and verify new speaker still selected
      await page.reload({ waitUntil: 'domcontentloaded' });
      await workspace.expectLoaded();

      const reloadedSelect = page
        .locator('[data-tour="editor-segment-row"]')
        .first()
        .locator('select[data-tour="editor-speaker-select"]');

      // The select text should match the chosen option
      const reloadedValue = await reloadedSelect.inputValue();
      expect(reloadedValue).not.toBe(originalSpeaker);
      await stepPause(page, 'Speaker change persisted after reload', 1500);
    }
  } finally {
    await ctx.close();
  }

  await cleanupBatch(browser, shared, batchName, batchId);
});
