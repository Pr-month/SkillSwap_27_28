import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('APP_CONFIG', () => ({
  port: Number(process.env.PORT) || 3000,
  env: process.env.NODE_ENV || 'development',
  url: process.env.BASE_URL || 'http://localhost:3000',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
}));
