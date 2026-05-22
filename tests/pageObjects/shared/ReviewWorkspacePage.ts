import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

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

  private async dismissWorkspaceTourIfPresent(): Promise<void> {
    const dialog = this.page.getByRole('dialog', { name: /Audio editor/i });
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

  private async textareaByValue(value: string): Promise<Locator> {
    const index = await this.allTranscriptAreas().evaluateAll((nodes, expected) => {
      return nodes.findIndex((node) => (node as HTMLTextAreaElement).value === expected);
    }, value);

    if (index < 0) {
      throw new Error(`Could not find textarea with value: ${value}`);
    }

    return this.allTranscriptAreas().nth(index);
  }

  private async blankTextarea(): Promise<Locator> {
    const index = await expect
      .poll(
        async () =>
          this.allTranscriptAreas().evaluateAll((nodes) => {
            return nodes.findIndex((node) => !(node as HTMLTextAreaElement).value.trim());
          }),
        { timeout: 30000 },
      )
      .toBeGreaterThan(-1)
      .then(async () =>
        this.allTranscriptAreas().evaluateAll((nodes) => {
          return nodes.findIndex((node) => !(node as HTMLTextAreaElement).value.trim());
        }),
      );

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
    await this.dismissWorkspaceTourIfPresent();
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

  async mergeSecondSegmentWithPrevious(): Promise<void> {
    const before = await this.allTranscriptAreas().count();
    if (before < 2) throw new Error('Need at least two segments to merge with previous');
    await this.allTranscriptAreas().nth(1).click();
    await this.page.getByRole('button', { name: /Merge ↑/ }).click();
    await expect.poll(async () => this.allTranscriptAreas().count(), {
      timeout: 30000,
    }).toBe(before - 1);
  }

  async mergeFirstSegmentWithNext(): Promise<void> {
    const before = await this.allTranscriptAreas().count();
    if (before < 2) throw new Error('Need at least two segments to merge with next');
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

    const insertedAfterRow = await expect
      .poll(async () => this.allTranscriptAreas().count(), {
        timeout: 2500,
      })
      .toBe(before + 1)
      .then(() => true)
      .catch(() => false);

    if (!insertedAfterRow) {
      await this.page.getByRole('button', { name: /Add segment/i }).click();
      await expect.poll(async () => this.allTranscriptAreas().count(), {
        timeout: 30000,
      }).toBe(before + 1);
    }

    const inserted = await this.blankTextarea();
    await inserted.fill(text);
    await this.saveAllIfVisible();
    await expect.poll(async () => {
      return this.allTranscriptAreas().evaluateAll((nodes, expected) => {
        return nodes.some((node) => (node as HTMLTextAreaElement).value === expected);
      }, text);
    }, { timeout: 30000 }).toBe(true);
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
    const emotionCombo = activeRow.getByRole('combobox').nth(1);
    await emotionCombo.click();
    const listbox = this.page.getByRole('listbox').last();
    await expect(listbox).toBeVisible({ timeout: 10000 });
    const option = listbox
      .getByRole('option')
      .filter({ hasNotText: /^✓/ })
      .first();
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
    await this.saveAllIfVisible();
  }

  /** Status pill in the review workspace header (avoids nav tabs / toasts). */
  private reviewStatusBadge(status: string): Locator {
    return this.page
      .locator('.review-workspace-header__actions > span')
      .filter({ hasText: new RegExp(`^${status}$`) });
  }

  private async hasReviewStatus(status: string): Promise<boolean> {
    return this.reviewStatusBadge(status).isVisible({ timeout: 3000 }).catch(() => false);
  }

  private async expectReviewStatus(status: string): Promise<void> {
    await expect(this.reviewStatusBadge(status)).toBeVisible({
      timeout: 30000,
    });
  }

  /**
   * Submit is hidden for ASSIGNED files until there are unsaved edits or the
   * file moves to IN_PROGRESS (activity timer). Playwright `fill()` does not
   * fire React onChange, so prior saved edits leave the button unavailable.
   */
  private async ensureSubmitButtonVisible(): Promise<void> {
    await this.dismissWorkspaceTourIfPresent();

    if (await this.hasReviewStatus('SUBMITTED')) {
      return;
    }

    const submit = this.page.getByRole('button', { name: /^Submit$/ });
    if (await submit.isVisible({ timeout: 2000 }).catch(() => false)) {
      return;
    }

    const first = this.allTranscriptAreas().first();
    await first.click();
    await first.press('End');
    await first.pressSequentially(' ', { delay: 15 });

    await expect(submit).toBeVisible({ timeout: 30000 });
  }

  async submitReview(): Promise<void> {
    if (await this.hasReviewStatus('SUBMITTED')) {
      return;
    }

    await this.ensureSubmitButtonVisible();
    await this.page.getByRole('button', { name: /^Submit$/ }).click();
    await expect(this.page.getByRole('heading', { name: 'Submit Review' })).toBeVisible({
      timeout: 10000,
    });
    const confirm = this.page.getByRole('button', { name: 'Confirm Submit' });
    await expect(confirm).toBeEnabled({ timeout: 10000 });
    await confirm.click();
    await this.expectReviewStatus('SUBMITTED');
  }

  async approveSubmittedReview(): Promise<void> {
    if (await this.hasReviewStatus('APPROVED')) {
      return;
    }

    await this.expectReviewStatus('SUBMITTED');
    await this.page.getByRole('button', { name: /^Approve$/ }).click();
    await expect(this.reviewStatusBadge('APPROVED')).toBeVisible({
      timeout: 45000,
    });
  }

  async rejectSubmittedReview(reason: string): Promise<void> {
    if (await this.hasReviewStatus('REJECTED')) {
      return;
    }

    await this.expectReviewStatus('SUBMITTED');
    await this.dismissWorkspaceTourIfPresent();
    await this.page.getByRole('button', { name: /^Reject$/ }).click();
    await expect(this.page.getByRole('heading', { name: 'Reject Transcription' })).toBeVisible({
      timeout: 10000,
    });
    await this.page.getByPlaceholder(/Describe what needs to be corrected/).fill(reason);
    await this.page.getByRole('button', { name: /^Reject$/ }).last().click();
    await expect(this.reviewStatusBadge('REJECTED')).toBeVisible({
      timeout: 45000,
    });
  }
}
