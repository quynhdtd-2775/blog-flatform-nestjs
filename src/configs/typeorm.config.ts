import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '/../database/entities/*.entity{.ts,.js}')],
  synchronize: false,
  dropSchema: false,
  logging: true,
  migrations: [join(__dirname, '/../database/*{.ts,.js}')],
});
