import fs from 'fs';
import path from 'path';

const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.webm']);

export function buildRunData() {
  const runId = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14);

  return {
    runId,
    clientName: `AUTO Client ${runId}`,
    projectName: `AUTO Project ${runId}`,
    phaseName: `AUTO Phase ${runId}`,
    batchName: `AUTO Batch ${runId}`,
    rejectBatchName: `AUTO Reject Batch ${runId}`,
    insertedSegmentText: `AUTO INSERTED SEGMENT ${runId}`,
    editedSegmentSuffix: ` AUTO EDIT ${runId}`,
    rejectEditedSegmentSuffix: ` AUTO REJECT FLOW EDIT ${runId}`,
    rejectionReason: `Automation rejection reason ${runId}`,
  };
}

export function getFirstAudioFile(): string {
  const audioDir = path.resolve(__dirname, './audio');
  const files = fs
    .readdirSync(audioDir)
    .filter((file) => AUDIO_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort();

  if (files.length === 0) {
    throw new Error(`No supported audio files found in ${audioDir}`);
  }

  return path.join(audioDir, files[0]);
}
