import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { waitForToast } from '@utils/selectors';

export class CustomerDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async createProject(name: string): Promise<void> {
    await expect(this.page.getByRole('button', { name: /\+ New Project|New Project/ })).toBeVisible({
      timeout: 20000,
    });
    await this.page.getByRole('button', { name: /\+ New Project|New Project/ }).click();
    await expect(this.page.getByRole('heading', { name: 'New Project' })).toBeVisible();
    await this.page.getByPlaceholder('e.g. English Transcription Q1').fill(name);
    await this.page.getByPlaceholder('Project description').fill('Automation-created project');
    await this.page.getByRole('button', { name: 'Create Project' }).click();
    await waitForToast(this.page, 'Project created successfully');
    await expect(this.page.getByRole('row', { name })).toBeVisible({ timeout: 20000 });
  }

  async openProject(name: string): Promise<string> {
    await this.page.getByRole('row', { name }).click();
    await this.page.waitForURL(/\/customers\/[^/]+\/projects\/[^/]+$/, {
      timeout: 30000,
    });
    const id = this.page.url().match(/\/projects\/([^/?#]+)/)?.[1];
    if (!id) throw new Error('Could not parse project id from URL');
    return id;
  }
}
