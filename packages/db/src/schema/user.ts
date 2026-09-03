import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
