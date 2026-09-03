import {
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const user = pgTable(
  'user',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    oauthProvider: varchar('oauth_provider', { length: 50 }).notNull(),
    oauthId: varchar('oauth_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('user_oauth_provider_oauth_id_idx').on(
      table.oauthProvider,
      table.oauthId
    ),
  ]
);
