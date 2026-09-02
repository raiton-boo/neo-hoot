import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { user } from './user.js';

export const quiz = pgTable('quiz', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 30 }).notNull(),
  description: varchar('description', { length: 60 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .$onUpdateFn(() => new Date()),
  archivedAt: timestamp('archived_at'),
});
