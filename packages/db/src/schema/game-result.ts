import { jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { gameSession } from './game-session.js';

export const gameResult = pgTable('game_result', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  gameSessionId: uuid('game_session_id')
    .notNull()
    .unique()
    .references(() => gameSession.id, { onDelete: 'cascade' }),
  participantStats: jsonb('participant_stats').notNull(),
  questionStats: jsonb('question_stats').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
