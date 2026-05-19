import { Page } from '@playwright/test';

const DEFAULT_STEP_PAUSE_MS = Number(process.env.STEP_PAUSE_MS || '900');

export async function stepPause(
  page: Page,
  label?: string,
  ms = DEFAULT_STEP_PAUSE_MS,
): Promise<void> {
  if (label) {
    console.log(`Step pause: ${label}`);
  }
  if (ms > 0) {
    await page.waitForTimeout(ms);
  }
}
