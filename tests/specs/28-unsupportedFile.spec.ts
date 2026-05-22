import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { Accounts } from '../data/accounts';
import { getStandaloneState } from '../fixtures/standaloneState';
import { LoginPage } from '../pageObjects/LoginPage';
import { UploadPage } from '../pageObjects/admin/UploadPage';
import { stepPause } from '../utils/stepPause';
import {
  comboboxForHiddenSelect,
  comboboxInField,
  selectOptionByText,
  selectFirstAvailableOption,
} from '../utils/selectors';

test('@TC28 Unsupported file — non-audio file is rejected by the upload form', async ({ page }) => {
  const shared = getStandaloneState();
  if (!shared) throw new Error('Run standalone-setup.spec.ts first.');

  // Create a temporary .txt file to use as the invalid upload
  const tmpFile = path.join(os.tmpdir(), 'invalid-upload-test.txt');
  fs.writeFileSync(tmpFile, 'This is not an audio file.');

  await new LoginPage(page).loginAs(Accounts.admin.email, Accounts.admin.password);

  const uploadPage = new UploadPage(page);
  await uploadPage.navigate();
  await stepPause(page, 'Upload page opened');

  // Fill hierarchy so the file input is active
  await selectOptionByText(page, comboboxForHiddenSelect(page, 'upload-customer'), shared.clientName);
  await selectOptionByText(page, comboboxForHiddenSelect(page, 'upload-project'), shared.projectName);
  await selectOptionByText(page, comboboxForHiddenSelect(page, 'upload-phase'), shared.phaseName);
  await selectFirstAvailableOption(page, comboboxForHiddenSelect(page, 'upload-model'));
  await page.getByPlaceholder('e.g. Batch 1').fill('AUTO Batch TC28 Unsupported');
  await selectOptionByText(page, comboboxInField(page, /^Language/), /English \(en\)/);

  await stepPause(page, 'Hierarchy filled');

  // Try to attach the .txt file
  await page.locator('input[type="file"]').setInputFiles(tmpFile);
  await stepPause(page, '.txt file set on input');

  // The file should NOT appear in the staged file list
  await expect(page.getByText('invalid-upload-test.txt')).toBeHidden({ timeout: 5000 });

  // Upload button should still be disabled / no file queued
  const uploadBtn = page.getByRole('button', { name: /^Upload Files$/ });
  const isDisabled = await uploadBtn.isDisabled();
  expect(isDisabled, 'Upload button should be disabled with no valid file').toBe(true);

  await stepPause(page, 'Non-audio file correctly rejected by upload form', 1500);

  fs.unlinkSync(tmpFile);
});
