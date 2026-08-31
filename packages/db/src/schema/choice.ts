import { boolean, integer, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';
import { question } from './question.js';

export const choice = pgTable('choice', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => question.id, { onDelete: 'cascade' }),
  body: varchar('body', { length: 20 }).notNull(),
  isCorrect: boolean('is_correct').notNull().default(false),
  order: integer('order').notNull(),
});
