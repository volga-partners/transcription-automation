import { expect, Locator, Page } from '@playwright/test';

export async function selectOptionByText(
  page: Page,
  trigger: Locator,
  optionText: string | RegExp,
): Promise<void> {
  await trigger.click();
  await page.getByRole('option', { name: optionText }).click();
}

export async function selectFirstAvailableOption(
  page: Page,
  trigger: Locator,
): Promise<string> {
  await trigger.click();
  const option = page.locator('li[role="option"]:not([aria-disabled="true"])').first();
  await expect(option).toBeVisible({ timeout: 15000 });
  const text = (await option.innerText()).trim();
  await option.click();
  return text;
}

export function comboboxForHiddenSelect(page: Page, id: string): Locator {
  return page.locator(`#${id}`).locator('xpath=following-sibling::div[@role="combobox"]');
}

export function comboboxInField(page: Page, label: string | RegExp): Locator {
  return page.locator('label').filter({ hasText: label }).locator('xpath=..').getByRole('combobox');
}

export async function waitForToast(page: Page, text: string | RegExp): Promise<void> {
  const message =
    typeof text === 'string'
      ? page.getByText(text, { exact: true }).first()
      : page.getByText(text).first();
  await expect(message).toBeVisible({ timeout: 20000 });
}

export async function waitForStablePage(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded', { timeout: 45000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}
