import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { requireEnv } from './require-env.js';

interface JwtPayload {
  userId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req.cookies as Record<string, string> | undefined)?.access_token ??
          null,
      ]),
      secretOrKey: requireEnv('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload.userId };
  }
}
