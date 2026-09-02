import { choice, db as DbInstance, question, quiz } from '@neo-hoot/db';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { eq, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { UpdateQuizDto } from './dto/update-quiz.dto.js';

@Injectable()
export class QuizService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: typeof DbInstance,
  ) {}

  async getQuizzes(userId: string) {
    return this.db.select().from(quiz).where(eq(quiz.userId, userId));
  }

  async getQuizById(userId: string, quizId: string) {
    const [foundQuiz] = await this.db
      .select()
      .from(quiz)
      .where(eq(quiz.id, quizId));

    if (!foundQuiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (foundQuiz.userId !== userId) {
      throw new ForbiddenException('You do not have access to this quiz');
    }

    const questions = await this.db
      .select()
      .from(question)
      .where(eq(question.quizId, quizId));

    const questionIds = questions.map((q) => q.id);
    const choices =
      questionIds.length > 0
        ? await this.db
            .select()
            .from(choice)
            .where(inArray(choice.questionId, questionIds))
        : [];

    return {
      ...foundQuiz,
      questions: questions.map((q) => ({
        ...q,
        choices: choices.filter((c) => c.questionId === q.id),
      })),
    };
  }

  async createQuiz(userId: string, dto: CreateQuizDto) {
    return this.db.transaction(async (tx) => {
      const [createdQuiz] = await tx
        .insert(quiz)
        .values({ userId, title: dto.title, description: dto.description })
        .returning();

      if (!createdQuiz) {
        throw new Error('Failed to create quiz');
      }

      for (const questionDto of dto.questions) {
        const [createdQuestion] = await tx
          .insert(question)
          .values({
            quizId: createdQuiz.id,
            type: questionDto.type,
            body: questionDto.body,
            timeLimitSeconds: questionDto.timeLimitSeconds,
            order: questionDto.order,
          })
          .returning();

        if (!createdQuestion) {
          throw new Error('Failed to create question');
        }

        await tx.insert(choice).values(
          questionDto.choices.map((choiceDto) => ({
            questionId: createdQuestion.id,
            body: choiceDto.body,
            isCorrect: choiceDto.isCorrect,
            order: choiceDto.order,
          })),
        );
      }

      return createdQuiz;
    });
  }

  async updateQuiz(userId: string, quizId: string, dto: UpdateQuizDto) {
    const [existingQuiz] = await this.db
      .select()
      .from(quiz)
      .where(eq(quiz.id, quizId));

    if (!existingQuiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (existingQuiz.userId !== userId) {
      throw new ForbiddenException('You do not have access to this quiz');
    }

    try {
      await this.db.transaction(async (tx) => {
        if (dto.title !== undefined || dto.description !== undefined) {
          await tx
            .update(quiz)
            .set({ title: dto.title, description: dto.description })
            .where(eq(quiz.id, quizId));
        }

        if (dto.questions !== undefined) {
          const existingQuestions = await tx
            .select({ id: question.id })
            .from(question)
            .where(eq(question.quizId, quizId));
          const questionIds = existingQuestions.map((q) => q.id);

          if (questionIds.length > 0) {
            await tx
              .delete(choice)
              .where(inArray(choice.questionId, questionIds));
          }
          await tx.delete(question).where(eq(question.quizId, quizId));

          for (const questionDto of dto.questions) {
            const [createdQuestion] = await tx
              .insert(question)
              .values({
                quizId,
                type: questionDto.type,
                body: questionDto.body,
                timeLimitSeconds: questionDto.timeLimitSeconds,
                order: questionDto.order,
              })
              .returning();

            if (!createdQuestion) {
              throw new Error('Failed to update question');
            }

            await tx.insert(choice).values(
              questionDto.choices.map((choiceDto) => ({
                questionId: createdQuestion.id,
                body: choiceDto.body,
                isCorrect: choiceDto.isCorrect,
                order: choiceDto.order,
              })),
            );
          }
        }
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'cause' in error &&
        error.cause &&
        typeof error.cause === 'object' &&
        'code' in error.cause &&
        error.cause.code === '23503'
      ) {
        throw new ConflictException(
          '開催履歴のある設問・選択肢が含まれているため編集できません',
        );
      }
      throw error;
    }

    return this.getQuizById(userId, quizId);
  }

  async deleteQuiz(userId: string, quizId: string) {
    const [existingQuiz] = await this.db
      .select()
      .from(quiz)
      .where(eq(quiz.id, quizId));

    if (!existingQuiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (existingQuiz.userId !== userId) {
      throw new ForbiddenException('You do not have access to this quiz');
    }

    try {
      await this.db.delete(quiz).where(eq(quiz.id, quizId));
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'cause' in error &&
        error.cause &&
        typeof error.cause === 'object' &&
        'code' in error.cause &&
        error.cause.code === '23503'
      ) {
        throw new ConflictException('開催履歴があるため削除できません');
      }
      throw error;
    }
  }
}
