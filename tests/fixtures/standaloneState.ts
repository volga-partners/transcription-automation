import fs from 'fs';
import path from 'path';

export interface StandaloneState {
  clientName: string;
  projectName: string;
  phaseName: string;
  customerId: string;
  projectId: string;
  phaseId: string;
}

const statePath = path.resolve(__dirname, '../data/.standalone-state.json');

export function getStandaloneState(): StandaloneState | null {
  if (!fs.existsSync(statePath)) return null;
  return JSON.parse(fs.readFileSync(statePath, 'utf8')) as StandaloneState;
}

export function saveStandaloneState(state: StandaloneState): void {
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

export function clearStandaloneState(): void {
  if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
}
