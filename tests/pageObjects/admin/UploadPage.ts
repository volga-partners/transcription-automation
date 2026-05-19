import path from 'path';
import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import {
  comboboxForHiddenSelect,
  comboboxInField,
  selectFirstAvailableOption,
  selectOptionByText,
  waitForToast,
} from '@utils/selectors';

export class UploadPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.goto('/upload');
    await expect(this.page.getByRole('heading', { name: 'Upload Files' })).toBeVisible();
  }

  async uploadAudioBatch(data: {
    customerName: string;
    projectName: string;
    phaseName: string;
    batchName: string;
    audioPath: string;
    language?: string | RegExp;
  }): Promise<{ batchId: string; fileName: string }> {
    await selectOptionByText(this.page, comboboxForHiddenSelect(this.page, 'upload-customer'), data.customerName);
    await selectOptionByText(this.page, comboboxForHiddenSelect(this.page, 'upload-project'), data.projectName);
    await selectOptionByText(this.page, comboboxForHiddenSelect(this.page, 'upload-phase'), data.phaseName);
    await selectFirstAvailableOption(this.page, comboboxForHiddenSelect(this.page, 'upload-model'));

    await this.page.getByPlaceholder('e.g. Batch 1').fill(data.batchName);
    await selectOptionByText(
      this.page,
      comboboxInField(this.page, /^Language/),
      data.language || /English \(en\)/,
    );

    await this.page.locator('input[type="file"]').setInputFiles(data.audioPath);
    await expect(this.page.getByText(path.basename(data.audioPath))).toBeVisible({ timeout: 10000 });
    await this.page.getByRole('button', { name: /^Upload Files$/ }).click();

    await waitForToast(this.page, 'Files uploaded successfully');
    await this.page.waitForURL(/\/batches\/[^/]+$/, { timeout: 60000 });

    const batchId = this.page.url().match(/\/batches\/([^/?#]+)/)?.[1];
    if (!batchId) throw new Error('Could not parse batch id from URL');

    return { batchId, fileName: path.basename(data.audioPath) };
  }
}
