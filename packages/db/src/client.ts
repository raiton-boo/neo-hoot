import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import * as schema from './schema/index.js';

const currentDir = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(currentDir, '../../../.env') });

const connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:${process.env.POSTGRES_PORT ?? 5432}/${process.env.POSTGRES_DB}`;

export const client = postgres(connectionString);

export const db = drizzle(client, { schema });
