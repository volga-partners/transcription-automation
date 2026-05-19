import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { waitForToast } from '@utils/selectors';

export class ExplorerPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.goto('/customers');
    await expect(this.page.getByRole('heading', { name: 'Explorer' })).toBeVisible();
  }

  async createClient(name: string): Promise<void> {
    await this.page.getByRole('button', { name: /\+ New Client|New Client/ }).click();
    await expect(this.page.getByRole('heading', { name: 'New Client' })).toBeVisible();
    await this.page.getByPlaceholder('e.g. Acme Corp').fill(name);
    await this.page.getByPlaceholder('e.g. John Smith').fill('Automation QA');
    await this.page.getByPlaceholder('john@acme.com').fill('automation@example.com');
    await this.page.getByRole('button', { name: 'Create Client' }).click();
    await waitForToast(this.page, 'Client created successfully');
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 20000 });
  }

  async openClient(name: string): Promise<string> {
    await this.page.getByRole('row', { name }).click();
    await this.page.waitForURL(/\/customers\/[^/]+$/, { timeout: 30000 });
    const id = this.page.url().match(/\/customers\/([^/?#]+)/)?.[1];
    if (!id) throw new Error('Could not parse customer id from URL');
    return id;
  }
}
