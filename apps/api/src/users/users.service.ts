import {
  answer,
  choice,
  db as DbInstance,
  gameSession,
  participant,
  question,
  quiz,
  user,
} from '@neo-hoot/db';
import { Inject, Injectable } from '@nestjs/common';

import { eq, inArray } from 'drizzle-orm';

import { DATABASE_CONNECTION } from '../database/database.module.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: typeof DbInstance,
  ) {}

  async deleteAccount(userId: string) {
    await this.db.transaction(async (tx) => {
      const quizzes = await tx
        .select({ id: quiz.id })
        .from(quiz)
        .where(eq(quiz.userId, userId));
      const quizIds = quizzes.map((q) => q.id);

      if (quizIds.length > 0) {
        const sessions = await tx
          .select({ id: gameSession.id })
          .from(gameSession)
          .where(inArray(gameSession.quizId, quizIds));
        const sessionIds = sessions.map((s) => s.id);

        if (sessionIds.length > 0) {
          await tx
            .delete(answer)
            .where(inArray(answer.gameSessionId, sessionIds));
          await tx
            .delete(participant)
            .where(inArray(participant.gameSessionId, sessionIds));
          await tx
            .delete(gameSession)
            .where(inArray(gameSession.id, sessionIds));
        }

        const questions = await tx
          .select({ id: question.id })
          .from(question)
          .where(inArray(question.quizId, quizIds));
        const questionIds = questions.map((q) => q.id);

        if (questionIds.length > 0) {
          await tx
            .delete(choice)
            .where(inArray(choice.questionId, questionIds));
        }

        await tx.delete(question).where(inArray(question.quizId, quizIds));
        await tx.delete(quiz).where(inArray(quiz.id, quizIds));
      }

      await tx.delete(user).where(eq(user.id, userId));
    });
  }
}
