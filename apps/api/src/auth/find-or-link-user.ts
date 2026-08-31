import { db as DbInstance, user } from '@neo-hoot/db';

import { and, eq } from 'drizzle-orm';

interface OAuthProfile {
  provider: string;
  oauthId: string;
  email: string;
  name: string;
}

export async function findOrLinkUser(
  db: typeof DbInstance,
  profile: OAuthProfile,
) {
  const [existingByProvider] = await db
    .select()
    .from(user)
    .where(
      and(
        eq(user.oauthProvider, profile.provider),
        eq(user.oauthId, profile.oauthId),
      ),
    );

  if (existingByProvider) {
    return existingByProvider;
  }

  const [existingByEmail] = await db
    .select()
    .from(user)
    .where(eq(user.email, profile.email));

  if (existingByEmail) {
    const [linkedUser] = await db
      .update(user)
      .set({ oauthProvider: profile.provider, oauthId: profile.oauthId })
      .where(eq(user.id, existingByEmail.id))
      .returning();
    return linkedUser;
  }

  const [newUser] = await db
    .insert(user)
    .values({
      email: profile.email,
      name: profile.name,
      oauthProvider: profile.provider,
      oauthId: profile.oauthId,
    })
    .returning();
  return newUser;
}
