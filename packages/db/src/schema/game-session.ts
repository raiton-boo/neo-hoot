import { sql } from 'drizzle-orm';
import {
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { quiz } from './quiz.js';

export const gameSessionStatusEnum = pgEnum('game_session_status', [
  'waiting',
  'in_progress',
  'finished',
  'expired',
]);

export const gameSession = pgTable(
  'game_session',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => quiz.id),
    roomCode: varchar('room_code', { length: 4 }).notNull(),
    status: gameSessionStatusEnum('status').notNull(),
    startedAt: timestamp('started_at'),
    finishedAt: timestamp('finished_at'),
  },
  (table) => [
    uniqueIndex('game_session_room_code_active_idx')
      .on(table.roomCode)
      .where(sql`${table.status} IN ('waiting', 'in_progress')`),
  ]
);
