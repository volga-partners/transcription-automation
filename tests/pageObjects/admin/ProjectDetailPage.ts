import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { waitForToast } from '@utils/selectors';

export class ProjectDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async createPhase(name: string): Promise<void> {
    await expect(this.page.getByRole('button', { name: /\+ New Phase|New Phase/ })).toBeVisible({
      timeout: 20000,
    });
    await this.page.getByRole('button', { name: /\+ New Phase|New Phase/ }).click();
    await expect(this.page.getByRole('heading', { name: 'New Phase' })).toBeVisible();
    await this.page.getByPlaceholder('e.g. Phase 1 - Initial Transcription').fill(name);
    await this.page.getByPlaceholder('Phase description').fill('Automation-created phase');
    await this.page.getByRole('button', { name: 'Create Phase' }).click();
    await waitForToast(this.page, 'Phase created successfully');
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 20000 });
  }

  async openPhase(name: string): Promise<string> {
    await this.page.getByRole('row', { name }).click();
    await this.page.waitForURL(/\/phases\/[^/]+$/, { timeout: 30000 });
    const id = this.page.url().match(/\/phases\/([^/?#]+)/)?.[1];
    if (!id) throw new Error('Could not parse phase id from URL');
    return id;
  }
}
