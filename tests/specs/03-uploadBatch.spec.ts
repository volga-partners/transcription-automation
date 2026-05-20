import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getFirstAudioFile } from '../data/testData';
import { getRunState, updateRunState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { UploadPage } from '../pageObjects/admin/UploadPage';
import { stepPause } from '../utils/stepPause';

test('@TC03 Upload audio batch', async ({ page }) => {
  const run = getRunState();

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.admin.email, Accounts.admin.password);
  await stepPause(page, 'Admin logged in');

  const uploadPage = new UploadPage(page);
  await uploadPage.navigate();
  await stepPause(page, 'Upload page opened');
  const primary = await uploadPage.uploadAudioBatch({
    customerName: run.clientName,
    projectName: run.projectName,
    phaseName: run.phaseName,
    batchName: run.batchName,
    audioPath: getFirstAudioFile(),
  });

  updateRunState({ batchId: primary.batchId, fileName: primary.fileName });
  await stepPause(page, `Uploaded batch: ${run.batchName}`, 1500);

  await uploadPage.navigate();
  const rejectCandidate = await uploadPage.uploadAudioBatch({
    customerName: run.clientName,
    projectName: run.projectName,
    phaseName: run.phaseName,
    batchName: run.rejectBatchName,
    audioPath: getFirstAudioFile(),
  });

  updateRunState({
    rejectBatchId: rejectCandidate.batchId,
    rejectFileName: rejectCandidate.fileName,
  });
  await stepPause(page, `Uploaded reject-decision batch: ${run.rejectBatchName}`, 1500);
});
