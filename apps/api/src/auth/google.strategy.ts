import { db as DbInstance } from '@neo-hoot/db';
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Profile, Strategy } from 'passport-google-oauth20';

import { DATABASE_CONNECTION } from '../database/database.module.js';
import { findOrLinkUser } from './find-or-link-user.js';

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: typeof DbInstance,
  ) {
    super({
      clientID: requireEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
      callbackURL: requireEnv('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: unknown, user?: unknown) => void,
  ) {
    const linkedUser = await findOrLinkUser(this.db, {
      provider: 'google',
      oauthId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      name: profile.displayName || 'Google User',
    });

    done(null, linkedUser);
  }
}
