import { test } from '@playwright/test';
import { Accounts } from '../data/accounts';
import { getRunState, updateRunState } from '../fixtures/runState';
import { LoginPage } from '../pageObjects/LoginPage';
import { ExplorerPage } from '../pageObjects/admin/ExplorerPage';
import { CustomerDetailPage } from '../pageObjects/admin/CustomerDetailPage';
import { ProjectDetailPage } from '../pageObjects/admin/ProjectDetailPage';
import { stepPause } from '../utils/stepPause';

test('@TC02 Create automation hierarchy', async ({ page }) => {
  const run = getRunState();

  const loginPage = new LoginPage(page);
  await loginPage.loginAs(Accounts.admin.email, Accounts.admin.password);
  await stepPause(page, 'Admin logged in');

  const explorerPage = new ExplorerPage(page);
  await explorerPage.navigate();
  await explorerPage.createClient(run.clientName);
  await stepPause(page, `Created client: ${run.clientName}`);
  const customerId = await explorerPage.openClient(run.clientName);
  updateRunState({ customerId });

  const customerDetailPage = new CustomerDetailPage(page);
  await customerDetailPage.createProject(run.projectName);
  await stepPause(page, `Created project: ${run.projectName}`);
  const projectId = await customerDetailPage.openProject(run.projectName);
  updateRunState({ projectId });

  const projectDetailPage = new ProjectDetailPage(page);
  await projectDetailPage.createPhase(run.phaseName);
  await stepPause(page, `Created phase: ${run.phaseName}`);
  const phaseId = await projectDetailPage.openPhase(run.phaseName);
  updateRunState({ phaseId });
});
