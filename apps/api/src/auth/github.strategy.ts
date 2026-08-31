import { db as DbInstance, user } from '@neo-hoot/db';
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { and, eq } from 'drizzle-orm';
import { Profile, Strategy } from 'passport-github2';

import { DATABASE_CONNECTION } from '../database/database.module.js';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: typeof DbInstance,
  ) {
    super({
      clientID: requireEnv('GITHUB_CLIENT_ID'),
      clientSecret: requireEnv('GITHUB_CLIENT_SECRET'),
      callbackURL: requireEnv('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: unknown) => void,
  ) {
    const oauthId = profile.id;
    const email = profile.emails?.[0]?.value ?? '';
    const name = profile.displayName || profile.username || 'GitHub User';

    const [existingUser] = await this.db
      .select()
      .from(user)
      .where(and(eq(user.oauthProvider, 'github'), eq(user.oauthId, oauthId)));

    if (existingUser) {
      done(null, existingUser);
      return;
    }

    const [newUser] = await this.db
      .insert(user)
      .values({ email, name, oauthProvider: 'github', oauthId })
      .returning();

    done(null, newUser);
  }
}
