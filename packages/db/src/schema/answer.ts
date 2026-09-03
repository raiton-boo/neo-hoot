import {
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { choice } from './choice.js';
import { gameSession } from './game-session.js';
import { participant } from './participant.js';
import { question } from './question.js';

export const answer = pgTable(
  'answer',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    gameSessionId: uuid('game_session_id')
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    participantId: uuid('participant_id')
      .notNull()
      .references(() => participant.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id')
      .notNull()
      .references(() => question.id),
    choiceId: uuid('choice_id')
      .notNull()
      .references(() => choice.id),
    responseTimeMs: integer('response_time_ms').notNull(),
    score: integer('score').notNull(),
    answeredAt: timestamp('answered_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('answer_participant_question_idx').on(
      table.participantId,
      table.questionId
    ),
  ]
);
