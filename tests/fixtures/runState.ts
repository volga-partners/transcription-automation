import fs from 'fs';
import path from 'path';
import { buildRunData } from '../data/testData';

export type RunState = ReturnType<typeof buildRunData> & {
  customerId?: string;
  projectId?: string;
  phaseId?: string;
  batchId?: string;
  fileId?: string;
  fileName?: string;
  editedText?: string;
};

const statePath = path.resolve(__dirname, '../data/.run-state.json');

function saveRunState(state: RunState): RunState {
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  return state;
}

export function resetRunState(): RunState {
  return saveRunState(buildRunData());
}

export function getRunState(): RunState {
  if (!fs.existsSync(statePath)) {
    return resetRunState();
  }
  return JSON.parse(fs.readFileSync(statePath, 'utf8')) as RunState;
}

export function updateRunState(patch: Partial<RunState>): RunState {
  return saveRunState({ ...getRunState(), ...patch });
}

export function clearRunState(): void {
  if (fs.existsSync(statePath)) {
    fs.unlinkSync(statePath);
  }
}

export function requireState<K extends keyof RunState>(
  state: RunState,
  key: K,
): NonNullable<RunState[K]> {
  const value = state[key];
  if (!value) {
    throw new Error(
      `Missing run state "${String(key)}". Run the earlier numbered specs first.`,
    );
  }
  return value as NonNullable<RunState[K]>;
}
