import { Controller, Delete, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { Request } from 'express';

import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: Request) {
    const authenticatedUser = req.user as { id: string };
    return this.usersService.getCurrentUser(authenticatedUser.id);
  }

  @Delete('me')
  @UseGuards(AuthGuard('jwt'))
  async deleteMe(@Req() req: Request) {
    const authenticatedUser = req.user as { id: string };
    await this.usersService.deleteAccount(authenticatedUser.id);
  }
}
