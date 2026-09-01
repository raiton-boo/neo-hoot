import { db as DbInstance } from '@neo-hoot/db';
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { Profile, Strategy } from 'passport-github2';

import { DATABASE_CONNECTION } from '../database/database.module.js';
import { findOrLinkUser } from './find-or-link-user.js';
import { requireEnv } from './require-env.js';

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
    const linkedUser = await findOrLinkUser(this.db, {
      provider: 'github',
      oauthId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
      name: profile.displayName || profile.username || 'GitHub User',
    });

    done(null, linkedUser);
  }
}
