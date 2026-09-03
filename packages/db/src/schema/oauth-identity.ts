import {
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './user.js';

export const oauthIdentity = pgTable(
  'oauth_identity',
  {
    id: uuid('id').primaryKey().notNull().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    provider: varchar('provider', { length: 50 }).notNull(),
    oauthId: varchar('oauth_id', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('oauth_identity_provider_oauth_id_idx').on(
      table.provider,
      table.oauthId
    ),
  ]
);
