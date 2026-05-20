import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const testEnv = process.env.TEST_ENV || 'dev';

let envConfig: { baseURL?: string } = {};
try {
  envConfig = require(path.resolve(__dirname, `config.${testEnv}`));
  if ((envConfig as { default?: unknown }).default) {
    envConfig = (envConfig as { default: { baseURL?: string } }).default;
  }
} catch {
  envConfig = {};
}

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL:
      process.env.BASE_URL ||
      envConfig.baseURL ||
      'https://transcription-frontend-dev.vercel.app',
    headless: process.env.HEADLESS !== 'false',
    launchOptions: {
      slowMo: Number(process.env.SLOW_MO_MS || '0'),
    },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 20000,
    navigationTimeout: 45000,
  },
  projects: [
    {
      name: 'standalone',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /specs\//,
    },
  ],
});
