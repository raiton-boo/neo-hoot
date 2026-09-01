import { Controller, Delete, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { Request } from 'express';

import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  async deleteMe(@Req() req: Request) {
    const authenticatedUser = req.user as { id: string };
    await this.usersService.deleteAccount(authenticatedUser.id);
  }
}
