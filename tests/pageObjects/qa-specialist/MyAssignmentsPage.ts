import { expect, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class MyAssignmentsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.goto('/my-assignments');
    await expect(this.page.getByRole('heading', { name: 'My Assignments' })).toBeVisible({
      timeout: 30000,
    });
  }

  async openAssignedFile(batchName: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Active' }).click();
    const card = this.page.locator('div.cursor-pointer').filter({ hasText: batchName }).first();
    await expect(card).toBeVisible({ timeout: 30000 });
    await Promise.all([
      this.page.waitForURL(/\/review\/[^/]+/, { timeout: 30000 }),
      card.click(),
    ]);
  }
}
