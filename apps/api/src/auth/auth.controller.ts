import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {
    // ガードがGitHubの認証画面へリダイレクトする
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(@Req() req: Request, @Res() res: Response) {
    const authenticatedUser = req.user as { id: string };
    const token = this.jwtService.sign({ userId: authenticatedUser.id });

    res.cookie('access_token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(process.env.WEB_URL ?? 'http://localhost:3000');
  }
}
