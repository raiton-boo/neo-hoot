import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import type { Request } from 'express';

import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { UpdateQuizDto } from './dto/update-quiz.dto.js';
import { QuizService } from './quiz.service.js';

@Controller('quizzes')
@UseGuards(AuthGuard('jwt'))
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  getQuizzes(@Req() req: Request) {
    const authenticatedUser = req.user as { id: string };
    return this.quizService.getQuizzes(authenticatedUser.id);
  }

  @Get('archived')
  getArchivedQuizzes(@Req() req: Request) {
    const authenticatedUser = req.user as { id: string };
    return this.quizService.getArchivedQuizzes(authenticatedUser.id);
  }

  @Post(':id/archive')
  archiveQuiz(@Req() req: Request, @Param('id') id: string) {
    const authenticatedUser = req.user as { id: string };
    return this.quizService.archiveQuiz(authenticatedUser.id, id);
  }

  @Post(':id/unarchive')
  unarchiveQuiz(@Req() req: Request, @Param('id') id: string) {
    const authenticatedUser = req.user as { id: string };
    return this.quizService.unarchiveQuiz(authenticatedUser.id, id);
  }

  @Get(':id')
  getQuizById(@Req() req: Request, @Param('id') id: string) {
    const authenticatedUser = req.user as { id: string };
    return this.quizService.getQuizById(authenticatedUser.id, id);
  }

  @Post()
  createQuiz(@Req() req: Request, @Body() dto: CreateQuizDto) {
    const authenticatedUser = req.user as { id: string };
    return this.quizService.createQuiz(authenticatedUser.id, dto);
  }

  @Patch(':id')
  updateQuiz(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateQuizDto,
  ) {
    const authenticatedUser = req.user as { id: string };
    return this.quizService.updateQuiz(authenticatedUser.id, id, dto);
  }

  @Delete(':id')
  deleteQuiz(@Req() req: Request, @Param('id') id: string) {
    const authenticatedUser = req.user as { id: string };
    return this.quizService.deleteQuiz(authenticatedUser.id, id);
  }
}
