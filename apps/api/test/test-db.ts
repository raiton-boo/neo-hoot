import * as schema from '@neo-hoot/db';

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const currentDir = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(currentDir, '../../../.env') });

const connectionString = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST ?? 'localhost'}:${process.env.POSTGRES_PORT ?? 5432}/${process.env.POSTGRES_TEST_DB}`;

const client = postgres(connectionString);

export const testDb = drizzle(client, { schema });

export async function closeTestDb() {
  await client.end();
}
