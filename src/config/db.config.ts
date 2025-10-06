import { registerAs } from '@nestjs/config';
import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { Category } from '../categories/entities/category.entity';

dotenv.config();

export const dbConfig = registerAs(
  'DATABASE_CONFIG',
  (): DataSourceOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'skillswap',
    synchronize: process.env.NODE_ENV !== 'production',
    entities: [__dirname + '/**/*.entity{.ts,.js}', Category], // Отдельно прописан entity для сида
    logging: process.env.NODE_ENV !== 'test',
  }),
);
