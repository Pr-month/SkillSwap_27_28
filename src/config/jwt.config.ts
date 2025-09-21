import { registerAs } from "@nestjs/config";

export const jwtConfig = registerAs('JWT_CONFIG', () => ({
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '3600'
}))
