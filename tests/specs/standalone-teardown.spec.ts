import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { LoginPage } from '../pageObjects/LoginPage';
import { cleanupAutomationData } from '../utils/cleanup';
import { getStandaloneState, clearStandaloneState } from '../fixtures/standaloneState';
import { stepPause } from '../utils/stepPause';

test('@SA-TEARDOWN Delete shared standalone hierarchy', async ({ page }) => {
  const shared = getStandaloneState();
  if (!shared) {
    console.log('No standalone state found — nothing to clean up.');
    return;
  }

  await new LoginPage(page).loginAs(Accounts.admin.email, Accounts.admin.password);
  await cleanupAutomationData(page, {
    clientName:  shared.clientName,
    projectName: shared.projectName,
    phaseName:   shared.phaseName,
    customerId:  shared.customerId,
    projectId:   shared.projectId,
    phaseId:     shared.phaseId,
  });
  clearStandaloneState();
  await stepPause(page, 'Shared standalone hierarchy deleted', 1000);
});
