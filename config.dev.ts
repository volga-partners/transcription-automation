import type { TestConfig } from './config.example';

const config: TestConfig = {
  baseURL: 'https://transcription-frontend-dev.vercel.app',
  accounts: {
    admin: {
      email: 'admin@gmail.com',
      password: 'Admin123!',
    },
    qaSpecialist: {
      email: 'qaspecialist@test.com',
      password: 'Test1234!',
    },
    qaManager: {
      email: 'qamanager@test.com',
      password: 'Test1234!',
    },
  },
};

export default config;
