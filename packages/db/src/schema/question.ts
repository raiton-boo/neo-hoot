import { sql } from 'drizzle-orm';
import {
  check,
  integer,
  pgEnum,
  pgTable,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { quiz } from './quiz.js';

export const questionTypeEnum = pgEnum('question_type', [
  'choice',
  'true_false',
  'survey',
]);

export const question = pgTable(
  'question',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => quiz.id, { onDelete: 'cascade' }),
    type: questionTypeEnum('type').notNull(),
    body: varchar('body', { length: 100 }).notNull(),
    timeLimitSeconds: integer('time_limit_seconds').notNull(),
    order: integer('order').notNull(),
  },
  (table) => [
    check(
      'time_limit_seconds',
      sql`${table.timeLimitSeconds} BETWEEN 5 AND 120`
    ),
  ]
);
