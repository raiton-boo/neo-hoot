import {
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { gameSession } from './game-session.js';

export const participant = pgTable(
  'participant',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    gameSessionId: uuid('game_session_id')
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    nickname: varchar('nickname', { length: 20 }).notNull(),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('participant_game_session_nickname_idx').on(
      table.gameSessionId,
      table.nickname
    ),
  ]
);
