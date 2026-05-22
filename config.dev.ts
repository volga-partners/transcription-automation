import type { TestConfig } from './config.example';


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