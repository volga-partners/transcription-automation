import path from 'path';

const testEnv = process.env.TEST_ENV || 'dev';

type AccountConfig = {
  email: string;
  password: string;
};

type LocalConfig = {
  accounts?: {
    admin?: AccountConfig;
    qaSpecialist?: AccountConfig;
    qaManager?: AccountConfig;
  };
};

let envConfig: LocalConfig = {};
try {
  envConfig = require(path.resolve(__dirname, `../../config.${testEnv}`));
  if ((envConfig as { default?: unknown }).default) {
    envConfig = (envConfig as { default: LocalConfig }).default;
  }
} catch {
  envConfig = {};
}

function accountFromEnv(
  label: string,
  emailEnv: string,
  passwordEnv: string,
  fallback?: AccountConfig,
): AccountConfig {
  const email = process.env[emailEnv] || fallback?.email || '';
  const password = process.env[passwordEnv] || fallback?.password || '';

  if (!email || !password) {
    throw new Error(
      `Missing ${label} credentials. Set ${emailEnv}/${passwordEnv} or create config.${testEnv}.ts from config.example.ts.`,
    );
  }

  return { email, password };
}

export const Accounts = {
  admin: accountFromEnv(
    'admin',
    'ADMIN_EMAIL',
    'ADMIN_PASSWORD',
    envConfig.accounts?.admin,
  ),
  qaSpecialist: accountFromEnv(
    'QA Specialist',
    'QA_SPECIALIST_EMAIL',
    'QA_SPECIALIST_PASSWORD',
    envConfig.accounts?.qaSpecialist,
  ),
  qaManager: accountFromEnv(
    'QA Manager',
    'QA_MANAGER_EMAIL',
    'QA_MANAGER_PASSWORD',
    envConfig.accounts?.qaManager,
  ),
};
