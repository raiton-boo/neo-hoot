import { Queue } from 'bullmq';
import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(currentDir, '../../../.env') });

export const testQueue = new Queue('game-jobs-test', {
  connection: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
  },
});

export async function closeTestQueue() {
  await testQueue.close();
}
