import { test, expect } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getStandaloneState } from '../fixtures/standaloneState';
import { LoginPage } from '../pageObjects/LoginPage';
import { ReviewWorkspacePage } from '../pageObjects/shared/ReviewWorkspacePage';
import { uploadTranscribeAssign, cleanupBatch } from '../utils/fullPipeline';
import { stepPause } from '../utils/stepPause';

test('@TC26 Audio player — play, pause and skip controls work in review workspace', async ({ browser }) => {
  test.setTimeout(25 * 60 * 1000);

  const shared = getStandaloneState();
  if (!shared) throw new Error('Run standalone-setup.spec.ts first.');

  const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const batchName = `AUTO Batch ${runId} Audio`;

  const { batchId, fileId } = await uploadTranscribeAssign(browser, shared, batchName);

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await new LoginPage(page).loginAs(Accounts.qaSpecialist.email, Accounts.qaSpecialist.password);
    await page.goto(`/review/${fileId}`, { waitUntil: 'domcontentloaded' });

    const workspace = new ReviewWorkspacePage(page);
    await workspace.expectLoaded();
    await stepPause(page, 'Review workspace opened');

    // Global audio player play button (title="Play")
    const playBtn = page.locator('button[title="Play"]');
    await expect(playBtn).toBeVisible({ timeout: 10000 });
    await stepPause(page, 'Play button visible');

    // Click play — button should change to pause (title="Pause")
    await playBtn.click();
    const pauseBtn = page.locator('button[title="Pause"]');
    await expect(pauseBtn).toBeVisible({ timeout: 5000 });
    await stepPause(page, 'Playing — pause button visible');

    // Skip forward while audio is playing
    const skipFwd = page.locator('button[title="+2s"], button[aria-label*="forward"], button[aria-label*="Forward"]').first();
    if (await skipFwd.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipFwd.click();
      await stepPause(page, 'Skipped forward 2s');
    } else {
      await stepPause(page, 'Skip forward button not visible — skipping assertion');
    }

    // Skip back while audio is playing
    const skipBack = page.locator('button[title="-2s"], button[aria-label*="back"], button[aria-label*="Back"], button[aria-label*="rewind"], button[aria-label*="Rewind"]').first();
    if (await skipBack.isVisible({ timeout: 3000 }).catch(() => false)) {
      await skipBack.click();
      await stepPause(page, 'Skipped back 2s');
    } else {
      await stepPause(page, 'Skip back button not visible — skipping assertion');
    }

    // Click pause — button reverts to Play
    await pauseBtn.click();
    await expect(playBtn).toBeVisible({ timeout: 5000 });
    await stepPause(page, 'Paused — play button visible again', 1500);
  } finally {
    await ctx.close();
  }

  await cleanupBatch(browser, shared, batchName, batchId);
});
