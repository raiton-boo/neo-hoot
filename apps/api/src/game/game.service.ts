import { db as DbInstance, gameSession, quiz } from '@neo-hoot/db';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { eq } from 'drizzle-orm';
import postgres from 'postgres';

import { DATABASE_CONNECTION } from '../database/database.module.js';

const MAX_ROOM_CODE_ATTEMPTS = 10;
const UNIQUE_VIOLATION_CODE = '23505';

@Injectable()
export class GameService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: typeof DbInstance,
  ) {}

  async createRoom(quizId: string) {
    const [targetQuiz] = await this.db
      .select({ id: quiz.id })
      .from(quiz)
      .where(eq(quiz.id, quizId));

    if (!targetQuiz) {
      throw new NotFoundException('クイズが見つかりません');
    }

    for (let attempt = 0; attempt < MAX_ROOM_CODE_ATTEMPTS; attempt++) {
      const roomCode = this.generateRoomCode();

      try {
        const [session] = await this.db
          .insert(gameSession)
          .values({ quizId, roomCode, status: 'waiting' })
          .returning();

        if (!session) {
          throw new Error('セッションの作成に失敗しました');
        }

        return session;
      } catch (error) {
        if (this.isRoomCodeConflict(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new ConflictException(
      'ルームコードの生成に失敗しました。もう一度お試しください。',
    );
  }

  private generateRoomCode(): string {
    return Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
  }

  private isRoomCodeConflict(error: unknown): boolean {
    const cause = error instanceof Error ? error.cause : undefined;
    return (
      cause instanceof postgres.PostgresError &&
      cause.code === UNIQUE_VIOLATION_CODE
    );
  }
}
