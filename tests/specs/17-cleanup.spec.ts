import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { clearRunState, getRunState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { cleanupAutomationData } from '../utils/cleanup';
import { stepPause } from '../utils/stepPause';

test('@TC17 Cleanup automation data', async ({ page }) => {
  const run = getRunState();

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.admin.email, Accounts.admin.password);
  await stepPause(page, 'Admin logged in for cleanup');

  await cleanupAutomationData(page, {
    clientName: run.clientName,
    projectName: run.projectName,
    phaseName: run.phaseName,
    batchName: run.batchName,
    batchId: run.batchId,
    rejectBatchName: run.rejectBatchName,
    rejectBatchId: run.rejectBatchId,
    customerId: run.customerId,
    projectId: run.projectId,
    phaseId: run.phaseId,
  });
  clearRunState();
  await stepPause(page, 'Automation-created data cleaned up', 1500);
});
