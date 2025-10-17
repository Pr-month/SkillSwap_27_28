import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('JWT_CONFIG', () => ({
  // Access Token настройки
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '3600',

  // Refresh Token настройки
  jwtRefreshSecret:
  process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '604800s', // 7 дней в секундах
}));
