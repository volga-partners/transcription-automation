import { Page } from '@playwright/test';

type CreatedState = {
  clientName?: string;
  projectName?: string;
  phaseName?: string;
  batchName?: string;
  customerId?: string;
  projectId?: string;
  phaseId?: string;
  batchId?: string;
  rejectBatchName?: string;
  rejectBatchId?: string;
};

async function deleteIfPresent(page: Page, label: string, url?: string): Promise<void> {
  if (!url) return;
  const response = await page.request.delete(url);
  if (![200, 202, 204, 404].includes(response.status())) {
    throw new Error(`${label} cleanup failed with status ${response.status()}`);
  }
}

export async function cleanupAutomationData(page: Page, state: CreatedState): Promise<void> {
  const names = [
    state.clientName,
    state.projectName,
    state.phaseName,
    state.batchName,
    state.rejectBatchName,
  ].filter(Boolean);
  const unsafe = names.find((name) => !name?.startsWith('AUTO '));
  if (unsafe) {
    throw new Error(`Refusing cleanup because name is not automation-owned: ${unsafe}`);
  }

  await deleteIfPresent(page, 'batch', state.batchId ? `/api/batches/${state.batchId}` : undefined);
  await deleteIfPresent(
    page,
    'reject batch',
    state.rejectBatchId ? `/api/batches/${state.rejectBatchId}` : undefined,
  );
  await deleteIfPresent(page, 'phase', state.phaseId ? `/api/phases/${state.phaseId}` : undefined);
  await deleteIfPresent(page, 'project', state.projectId ? `/api/projects/${state.projectId}` : undefined);
  await deleteIfPresent(page, 'customer', state.customerId ? `/api/customers/${state.customerId}` : undefined);
}
