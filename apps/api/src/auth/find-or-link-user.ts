import { db as DbInstance, oauthIdentity, user } from '@neo-hoot/db';

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
  const [existingIdentity] = await db
    .select()
    .from(oauthIdentity)
    .where(
      and(
        eq(oauthIdentity.provider, profile.provider),
        eq(oauthIdentity.oauthId, profile.oauthId),
      ),
    );

  if (existingIdentity) {
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, existingIdentity.userId));
    return existingUser;
  }

  const [existingByEmail] = await db
    .select()
    .from(user)
    .where(eq(user.email, profile.email));

  if (existingByEmail) {
    await db.insert(oauthIdentity).values({
      userId: existingByEmail.id,
      provider: profile.provider,
      oauthId: profile.oauthId,
    });
    return existingByEmail;
  }

  return db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(user)
      .values({
        email: profile.email,
        name: profile.name,
      })
      .returning();

    if (!newUser) {
      throw new Error('ユーザーの作成に失敗しました');
    }

    await tx.insert(oauthIdentity).values({
      userId: newUser.id,
      provider: profile.provider,
      oauthId: profile.oauthId,
    });

    return newUser;
  });
}
