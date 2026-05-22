import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class BatchDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private async dismissBatchTourIfPresent(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: /Transcription Complete!/i });
    if (!(await dialog.isVisible({ timeout: 1500 }).catch(() => false))) {
      return;
    }

    const close = dialog.getByRole('button', { name: /Close/i });
    if (await close.isVisible({ timeout: 1000 }).catch(() => false)) {
      await close.click();
    } else {
      await dialog.getByRole('button', { name: /Next/i }).click().catch(() => {});
      await close.click().catch(() => {});
    }

    await expect(dialog).toBeHidden({ timeout: 10000 });
  }

  async expectLoaded(batchName: string): Promise<void> {
    await expect(this.page.getByRole('heading', { name: batchName })).toBeVisible({
      timeout: 30000,
    });
  }

  async startTranscriptionIfReady(): Promise<void> {
    const startButton = this.page.getByRole('button', { name: /Start Transcription|Transcribe .* Remaining/ });
    if (await startButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startButton.click();
      await expect(this.page.getByText(/Transcription started/i)).toBeVisible({
        timeout: 20000,
      });
    }
  }

  async waitForTranscriptionCompleted(maxMinutes = 15): Promise<void> {
    const deadline = Date.now() + maxMinutes * 60 * 1000;
    while (Date.now() < deadline) {
      const completed = await this.page.locator('tbody').getByText('COMPLETED', { exact: true }).count();
      const failed = await this.page.locator('tbody').getByText('FAILED', { exact: true }).count();
      if (completed > 0) return;
      if (failed > 0) {
        throw new Error('Transcription reached FAILED status');
      }
      await this.page.waitForTimeout(30000);
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    }
    throw new Error(`Transcription did not complete within ${maxMinutes} minutes`);
  }

  async getFirstReviewFileId(): Promise<string> {
    const link = this.page.locator('a[href*="/review/"]').first();
    await expect(link).toBeVisible({ timeout: 30000 });
    const href = await link.getAttribute('href');
    const fileId = href?.match(/\/review\/([^/?#]+)/)?.[1];
    if (!fileId) throw new Error('Could not parse review file id from batch table link');
    return fileId;
  }

  async transcribeAndReturnFirstFileId(batchName: string, maxMinutes = 18): Promise<string> {
    await this.expectLoaded(batchName);
    await this.startTranscriptionIfReady();
    await this.waitForTranscriptionCompleted(maxMinutes);
    return this.getFirstReviewFileId();
  }

  async assignFirstCompletedFileTo(email: string): Promise<void> {
    await this.dismissBatchTourIfPresent();
    const selectAll = this.page.getByRole('button', { name: 'Select All' });
    await expect(selectAll).toBeVisible({ timeout: 30000 });
    await selectAll.click();
    await this.page.getByRole('button', { name: 'Assign Selected' }).click();

    await expect(this.page.getByRole('heading', { name: 'Assign QA Specialist' })).toBeVisible({
      timeout: 20000,
    });
    await this.dismissBatchTourIfPresent();
    await this.page.getByPlaceholder('Search by name or email...').fill(email);
    await this.page.getByRole('radio', { name: new RegExp(email, 'i') }).check();
    await this.page.getByRole('button', { name: /^Assign$/ }).click();
    await expect(this.page.getByText(/assigned successfully/i)).toBeVisible({
      timeout: 30000,
    });
  }

  async deleteBatch(): Promise<void> {
    await this.page.getByRole('button', { name: 'Delete Batch' }).click();
    await expect(this.page.getByRole('heading', { name: 'Delete Batch' })).toBeVisible();
    await this.page.getByRole('button', { name: /^Delete$/ }).click();
    await expect(this.page.getByText('Batch deleted')).toBeVisible({ timeout: 20000 });
  }
}
