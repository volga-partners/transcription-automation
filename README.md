# Solibra Transcription Playwright Automation

End-to-end automation for the Solibra transcription frontend using Playwright and TypeScript.

## Local Setup

```bash
pnpm install
pnpm exec playwright install chromium
```

Create a local config file or use environment variables:

```bash
copy config.example.ts config.dev.ts
```

`config.dev.ts` and `.env` are ignored so credentials stay local.

## Audio Test Data

Put test audio files in:

```text
tests/data/audio/
```

The current flow uses the first supported audio file it finds. Supported extensions:

```text
.mp3, .wav, .m4a, .ogg, .flac, .webm
```

## Run

```bash
corepack pnpm run test:full
corepack pnpm run test:full:headed
corepack pnpm run report
```

The deep flow is split into 17 numbered spec files under `tests/specs`.
Later cases depend on data created in earlier cases, so run the full suite from `01` onward.

## Headed Mode Pauses

The specs add a short pause after major actions so headed mode is easier to follow.
Change the pause length with:

```powershell
$env:STEP_PAUSE_MS='1500'
corepack pnpm run test:full:headed
```

Set it to `0` for faster debugging:

```powershell
$env:STEP_PAUSE_MS='0'
corepack pnpm run test:full
```
