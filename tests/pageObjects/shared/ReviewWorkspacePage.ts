import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { selectOptionByText } from '@utils/selectors';

export class ReviewWorkspacePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  transcriptInputs(): Locator {
    return this.page.locator('textarea').filter({ hasNotText: /^$/ });
  }

  allTranscriptAreas(): Locator {
    return this.page.locator('textarea');
  }

  private async textareaByValue(value: string): Promise<Locator> {
    const index = await this.allTranscriptAreas().evaluateAll((nodes, expected) => {
      return nodes.findIndex((node) => (node as HTMLTextAreaElement).value === expected);
    }, value);

    if (index < 0) {
      throw new Error(`Could not find textarea with value: ${value}`);
    }

    return this.allTranscriptAreas().nth(index);
  }

  private async expectNoTextareaWithValue(value: string): Promise<void> {
    await expect.poll(async () => {
      return this.allTranscriptAreas().evaluateAll((nodes, expected) => {
        return nodes.findIndex((node) => (node as HTMLTextAreaElement).value === expected);
      }, value);
    }, { timeout: 30000 }).toBe(-1);
  }

  async expectLoaded(fileName?: string): Promise<void> {
    if (fileName) {
      await expect(this.page.getByText(fileName)).toBeVisible({ timeout: 45000 });
    }
    await expect(this.page.locator('textarea').first()).toBeVisible({ timeout: 60000 });
  }

  async expectMinimumSegments(minimum: number): Promise<number> {
    await expect.poll(async () => this.page.locator('textarea').count(), {
      timeout: 60000,
      message: `Expected at least ${minimum} transcript segments`,
    }).toBeGreaterThanOrEqual(minimum);
    return this.page.locator('textarea').count();
  }

  async saveAllIfVisible(): Promise<void> {
    const saveAll = this.page.getByRole('button', { name: /Save All/ });
    if (await saveAll.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveAll.click();
      await expect(this.page.getByText(/All changes saved|Saving/)).toBeVisible({
        timeout: 20000,
      });
    }
  }

  async editFirstSegment(suffix: string): Promise<string> {
    const first = this.allTranscriptAreas().first();
    const current = await first.inputValue();
    const next = `${current}${suffix}`;
    await first.fill(next);
    await this.saveAllIfVisible();
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.expectLoaded();
    await expect(this.allTranscriptAreas().first()).toHaveValue(next, {
      timeout: 30000,
    });
    return next;
  }

  async splitFirstEligibleSegment(): Promise<void> {
    const before = await this.allTranscriptAreas().count();
    const first = this.allTranscriptAreas().first();
    const value = await first.inputValue();
    if (value.length < 4) throw new Error('First segment is too short to split');
    const splitAt = Math.floor(value.length / 2);

    await first.click();
    await first.evaluate((node, pos) => {
      const textarea = node as HTMLTextAreaElement;
      textarea.focus();
      textarea.setSelectionRange(pos as number, pos as number);
      textarea.dispatchEvent(new Event('select', { bubbles: true }));
      textarea.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    }, splitAt);
    await this.page.getByRole('button', { name: /^Split$/ }).click();
    await expect.poll(async () => this.allTranscriptAreas().count(), {
      timeout: 30000,
    }).toBe(before + 1);
  }

  async mergeFirstSegmentWithNext(): Promise<void> {
    const before = await this.allTranscriptAreas().count();
    await this.allTranscriptAreas().first().click();
    await this.page.getByRole('button', { name: /Merge ↓/ }).click();
    await expect.poll(async () => this.allTranscriptAreas().count(), {
      timeout: 30000,
    }).toBe(before - 1);
  }

  async insertSegmentAfterFirst(text: string): Promise<void> {
    const before = await this.allTranscriptAreas().count();
    await this.allTranscriptAreas().first().click();
    await this.page.getByRole('button', { name: /^Insert$/ }).click();
    await expect.poll(async () => this.allTranscriptAreas().count(), {
      timeout: 30000,
    }).toBe(before + 1);

    const inserted = this.allTranscriptAreas().nth(1);
    await inserted.fill(text);
    await this.saveAllIfVisible();
    await expect(inserted).toHaveValue(text, { timeout: 30000 });
  }

  async deleteSegmentWithText(text: string): Promise<void> {
    const before = await this.allTranscriptAreas().count();
    const target = await this.textareaByValue(text);
    await expect(target).toBeVisible({ timeout: 30000 });
    await target.click();
    await this.page.getByRole('button', { name: /^Delete$/ }).click();
    await expect(this.page.getByRole('heading', { name: /Delete segment/ })).toBeVisible();
    await this.page.getByRole('button', { name: 'Delete Segment' }).click();
    await expect.poll(async () => this.allTranscriptAreas().count(), {
      timeout: 30000,
    }).toBe(before - 1);
    await this.expectNoTextareaWithValue(text);
  }

  async updateLanguageOnActiveSegment(): Promise<void> {
    await this.allTranscriptAreas().first().click();
    const activeRow = this.page.locator('.segment-active').first();
    await expect(activeRow).toBeVisible({ timeout: 10000 });
    const langCombo = activeRow.getByRole('combobox').nth(1);
    await selectOptionByText(this.page, langCombo, /English \(en\)/);
    await this.saveAllIfVisible();
  }

  async submitReview(): Promise<void> {
    await this.page.getByRole('button', { name: /^Submit$/ }).click();
    await expect(this.page.getByRole('heading', { name: 'Submit Review' })).toBeVisible({
      timeout: 10000,
    });
    const confirm = this.page.getByRole('button', { name: 'Confirm Submit' });
    await expect(confirm).toBeEnabled({ timeout: 10000 });
    await confirm.click();
    await expect(this.page.getByText(/SUBMITTED|submitted/i)).toBeVisible({
      timeout: 45000,
    });
  }

  async approveSubmittedReview(): Promise<void> {
    await expect(this.page.getByText('SUBMITTED')).toBeVisible({ timeout: 30000 });
    await this.page.getByRole('button', { name: /^Approve$/ }).click();
    await expect(this.page.getByText('APPROVED')).toBeVisible({ timeout: 45000 });
  }
}
