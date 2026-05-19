export interface TestConfig {
  baseURL: string;
  accounts: {
    admin: { email: string; password: string };
    qaSpecialist: { email: string; password: string };
    qaManager: { email: string; password: string };
  };
}

const config: TestConfig = {
  baseURL: 'https://transcription-frontend-dev.vercel.app',
  accounts: {
    admin: {
      email: '',
      password: '',
    },
    qaSpecialist: {
      email: '',
      password: '',
    },
    qaManager: {
      email: '',
      password: '',
    },
  },
};

export default config;
