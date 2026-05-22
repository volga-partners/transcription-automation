import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getStandaloneState } from '../fixtures/standaloneState';
import { LoginPage } from '../pageObjects/LoginPage';
import { ReviewWorkspacePage } from '../pageObjects/shared/ReviewWorkspacePage';
import { uploadTranscribeAssign, cleanupBatch } from '../utils/fullPipeline';
import { stepPause } from '../utils/stepPause';

test('@TC27 Submit blocked — cannot submit review with an empty transcript segment', async ({ browser }) => {
  test.setTimeout(25 * 60 * 1000);

  const shared = getStandaloneState();
  if (!shared) throw new Error('Run standalone-setup.spec.ts first.');

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const batchName = `AUTO Batch ${runId} Blocked`;

  const { batchId, fileId } = await uploadTranscribeAssign(browser, shared, batchName);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await new LoginPage(page).loginAs(Accounts.qaSpecialist.email, Accounts.qaSpecialist.password);
    await page.goto(`/review/${fileId}`, { waitUntil: 'domcontentloaded' });

    const workspace = new ReviewWorkspacePage(page);
    await workspace.expectLoaded();
    await stepPause(page, 'Review workspace opened');

    // Click the first segment to make it active, then clear its content
    const firstTextarea = page.locator('textarea').first();
    await firstTextarea.click();
    await firstTextarea.fill('');
    await stepPause(page, 'First segment cleared');

    // Attempt submit
    await page.getByRole('button', { name: /^Submit$/ }).click();
    await stepPause(page, 'Submit clicked');

    // Should see either an inline warning OR the Confirm Submit button is disabled
    const blockedByWarning = page.getByText(/Transcript cannot be empty/i);
    const confirmBtn = page.getByRole('button', { name: 'Confirm Submit' });

    const isWarningVisible = await blockedByWarning.isVisible({ timeout: 5000 }).catch(() => false);
    const isConfirmDisabled = await confirmBtn.isVisible({ timeout: 3000 })
      .then(() => confirmBtn.isDisabled())
      .catch(() => false);

    expect(
      isWarningVisible || isConfirmDisabled,
      'Submit should be blocked when a segment is empty',
    ).toBe(true);

    await stepPause(page, 'Submit correctly blocked for empty segment', 1500);
  } finally {
    await ctx.close();
  }

  await cleanupBatch(browser, shared, batchName, batchId);
});
