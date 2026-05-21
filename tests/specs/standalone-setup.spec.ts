import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { LoginPage } from '../pageObjects/LoginPage';
import { ExplorerPage } from '../pageObjects/admin/ExplorerPage';
import { CustomerDetailPage } from '../pageObjects/admin/CustomerDetailPage';
import { ProjectDetailPage } from '../pageObjects/admin/ProjectDetailPage';
import { getStandaloneState, saveStandaloneState } from '../fixtures/standaloneState';
import { stepPause } from '../utils/stepPause';

test('@SA-SETUP Create shared standalone hierarchy (run once before TC18+)', async ({ page }) => {
  if (getStandaloneState()) {
    console.log('Standalone hierarchy already exists — skipping creation.');
    return;
  }

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.admin.email, Accounts.admin.password);

  const clientName  = 'AUTO Standalone Client';
  const projectName = 'AUTO Standalone Project';
  const phaseName   = 'AUTO Standalone Phase';

  const explorerPage = new ExplorerPage(page);
  await explorerPage.navigate();
  await explorerPage.createClient(clientName);
  const customerId = await explorerPage.openClient(clientName);
  await stepPause(page, `Created client: ${clientName}`);

  const customerPage = new CustomerDetailPage(page);
  await customerPage.createProject(projectName);
  const projectId = await customerPage.openProject(projectName);
  await stepPause(page, `Created project: ${projectName}`);

  const projectPage = new ProjectDetailPage(page);
  await projectPage.createPhase(phaseName);
  const phaseId = await projectPage.openPhase(phaseName);
  await stepPause(page, `Created phase: ${phaseName}`);

  saveStandaloneState({ clientName, projectName, phaseName, customerId, projectId, phaseId });
  await stepPause(page, 'Shared standalone hierarchy saved', 1000);
});
