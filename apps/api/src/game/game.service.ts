import {
  answer,
  choice,
  db as DbInstance,
  gameResult,
  gameSession,
  participant,
  question,
  quiz,
} from '@neo-hoot/db';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { and, asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import postgres from 'postgres';

import { DATABASE_CONNECTION } from '../database/database.module.js';

const MAX_ROOM_CODE_ATTEMPTS = 10;
const UNIQUE_VIOLATION_CODE = '23505';
const ROOM_EXPIRY_DELAY_MS = 10 * 60 * 1000;

@Injectable()
export class GameService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: typeof DbInstance,
    @InjectQueue('game-jobs') private readonly gameJobsQueue: Queue,
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

        await this.gameJobsQueue.add(
          'expire-room',
          { roomCode: session.roomCode },
          { delay: ROOM_EXPIRY_DELAY_MS },
        );

        return session;
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          continue;
        }
        throw error;
      }
    }

    throw new ConflictException(
      'ルームコードの生成に失敗しました。もう一度お試しください。',
    );
  }

  async joinRoom(roomCode: string, nickname: string) {
    const [session] = await this.db
      .select({ id: gameSession.id })
      .from(gameSession)
      .where(
        and(
          eq(gameSession.roomCode, roomCode),
          eq(gameSession.status, 'waiting'),
        ),
      );

    if (!session) {
      throw new NotFoundException('参加可能なルームが見つかりません');
    }

    try {
      const [newParticipant] = await this.db
        .insert(participant)
        .values({ gameSessionId: session.id, nickname })
        .returning();

      if (!newParticipant) {
        throw new Error('参加者の作成に失敗しました');
      }

      return newParticipant;
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('このニックネームは既に使用されています');
      }
      throw error;
    }
  }

  async getCorrectChoiceId(questionId: string): Promise<string | null> {
    const [correctChoice] = await this.db
      .select({ id: choice.id })
      .from(choice)
      .where(
        and(eq(choice.questionId, questionId), eq(choice.isCorrect, true)),
      );

    return correctChoice?.id ?? null;
  }

  async hasAllParticipantsAnswered(
    roomCode: string,
    questionId: string,
    excludedParticipantCount = 0,
  ): Promise<boolean> {
    const [session] = await this.db
      .select({ id: gameSession.id })
      .from(gameSession)
      .where(eq(gameSession.roomCode, roomCode));

    if (!session) {
      return false;
    }

    const [participantCount] = await this.db
      .select({ value: count() })
      .from(participant)
      .where(eq(participant.gameSessionId, session.id));

    const [answerCount] = await this.db
      .select({ value: count() })
      .from(answer)
      .where(
        and(
          eq(answer.gameSessionId, session.id),
          eq(answer.questionId, questionId),
        ),
      );

    const totalParticipants =
      (participantCount?.value ?? 0) - excludedParticipantCount;
    const totalAnswers = answerCount?.value ?? 0;

    return totalParticipants > 0 && totalAnswers >= totalParticipants;
  }

  async getAnswerDistribution(questionId: string) {
    return this.db
      .select({ choiceId: answer.choiceId, count: count() })
      .from(answer)
      .where(eq(answer.questionId, questionId))
      .groupBy(answer.choiceId);
  }

  async getTopRanking(roomCode: string, limit?: number) {
    const [session] = await this.db
      .select({ id: gameSession.id })
      .from(gameSession)
      .where(eq(gameSession.roomCode, roomCode));

    if (!session) {
      return [];
    }

    const totalScore = sql<number>`coalesce(sum(${answer.score}), 0)::int`;

    const query = this.db
      .select({
        participantId: participant.id,
        nickname: participant.nickname,
        totalScore,
      })
      .from(participant)
      .leftJoin(answer, eq(answer.participantId, participant.id))
      .where(eq(participant.gameSessionId, session.id))
      .groupBy(participant.id, participant.nickname)
      .orderBy(desc(totalScore));

    return limit === undefined ? query : query.limit(limit);
  }

  async submitAnswer(params: {
    roomCode: string;
    participantId: string;
    questionId: string;
    choiceId: string;
    responseTimeMs: number;
    timeLimitSeconds: number;
  }) {
    const [session] = await this.db
      .select({ id: gameSession.id })
      .from(gameSession)
      .where(eq(gameSession.roomCode, params.roomCode));

    if (!session) {
      throw new NotFoundException('ルームが見つかりません');
    }

    const [selectedChoice] = await this.db
      .select({ isCorrect: choice.isCorrect })
      .from(choice)
      .where(eq(choice.id, params.choiceId));

    if (!selectedChoice) {
      throw new NotFoundException('選択肢が見つかりません');
    }

    const score = this.calculateScore(
      selectedChoice.isCorrect,
      params.responseTimeMs,
      params.timeLimitSeconds,
    );

    try {
      const [newAnswer] = await this.db
        .insert(answer)
        .values({
          gameSessionId: session.id,
          participantId: params.participantId,
          questionId: params.questionId,
          choiceId: params.choiceId,
          responseTimeMs: params.responseTimeMs,
          score,
        })
        .returning();

      if (!newAnswer) {
        throw new Error('回答の保存に失敗しました');
      }

      return { ...newAnswer, isCorrect: selectedChoice.isCorrect };
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('既に回答済みです');
      }
      throw error;
    }
  }

  private calculateScore(
    isCorrect: boolean,
    responseTimeMs: number,
    timeLimitSeconds: number,
  ): number {
    if (!isCorrect) {
      return 0;
    }

    const BASE_POINTS = 100;
    const timeLimitMs = timeLimitSeconds * 1000;
    const ratio = Math.min(responseTimeMs / timeLimitMs, 1);

    return Math.round(BASE_POINTS * (1 - ratio * 0.5));
  }

  async startQuizIfNeeded(roomCode: string): Promise<void> {
    await this.db
      .update(gameSession)
      .set({ status: 'in_progress', startedAt: new Date() })
      .where(
        and(
          eq(gameSession.roomCode, roomCode),
          eq(gameSession.status, 'waiting'),
        ),
      );
  }

  async finishGame(roomCode: string): Promise<void> {
    await this.db
      .update(gameSession)
      .set({ status: 'finished', finishedAt: new Date() })
      .where(
        and(
          eq(gameSession.roomCode, roomCode),
          eq(gameSession.status, 'in_progress'),
        ),
      );

    await this.gameJobsQueue.add('aggregate-result', { roomCode });
  }

  async getQuestionByOrder(roomCode: string, order: number) {
    const [session] = await this.db
      .select({ quizId: gameSession.quizId })
      .from(gameSession)
      .where(
        and(
          eq(gameSession.roomCode, roomCode),
          inArray(gameSession.status, ['waiting', 'in_progress']),
        ),
      );

    if (!session) {
      throw new NotFoundException('ルームが見つかりません');
    }

    const [targetQuestion] = await this.db
      .select()
      .from(question)
      .where(
        and(eq(question.quizId, session.quizId), eq(question.order, order)),
      );

    if (!targetQuestion) {
      return null;
    }

    const questionChoices = await this.db
      .select({ id: choice.id, body: choice.body, order: choice.order })
      .from(choice)
      .where(eq(choice.questionId, targetQuestion.id))
      .orderBy(asc(choice.order));

    return { ...targetQuestion, choices: questionChoices };
  }

  private generateRoomCode(): string {
    return Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
  }

  private isUniqueViolation(error: unknown): boolean {
    const cause = error instanceof Error ? error.cause : undefined;
    return (
      cause instanceof postgres.PostgresError &&
      cause.code === UNIQUE_VIOLATION_CODE
    );
  }

  async expireRoomIfWaiting(roomCode: string): Promise<void> {
    await this.db
      .update(gameSession)
      .set({ status: 'expired' })
      .where(
        and(
          eq(gameSession.roomCode, roomCode),
          eq(gameSession.status, 'waiting'),
        ),
      );
  }

  async aggregateGameResult(roomCode: string): Promise<void> {
    const [session] = await this.db
      .select({ id: gameSession.id, quizId: gameSession.quizId })
      .from(gameSession)
      .where(eq(gameSession.roomCode, roomCode));

    if (!session) {
      return;
    }

    const participantStats = await this.db
      .select({
        participantId: participant.id,
        nickname: participant.nickname,
        totalScore: sql<number>`coalesce(sum(${answer.score}), 0)::int`,
        correctCount: sql<number>`coalesce(sum(case when ${choice.isCorrect} then 1 else 0 end), 0)::int`,
        answeredCount: count(answer.id),
        averageResponseTimeMs: sql<number>`coalesce(avg(${answer.responseTimeMs}), 0)::int`,
      })
      .from(participant)
      .leftJoin(answer, eq(answer.participantId, participant.id))
      .leftJoin(choice, eq(choice.id, answer.choiceId))
      .where(eq(participant.gameSessionId, session.id))
      .groupBy(participant.id, participant.nickname);

    const questionStats = await this.db
      .select({
        questionId: question.id,
        order: question.order,
        body: question.body,
        correctCount: sql<number>`coalesce(sum(case when ${choice.isCorrect} then 1 else 0 end), 0)::int`,
        answeredCount: count(answer.id),
        averageResponseTimeMs: sql<number>`coalesce(avg(${answer.responseTimeMs}), 0)::int`,
      })
      .from(question)
      .leftJoin(
        answer,
        and(
          eq(answer.questionId, question.id),
          eq(answer.gameSessionId, session.id),
        ),
      )
      .leftJoin(choice, eq(choice.id, answer.choiceId))
      .where(eq(question.quizId, session.quizId))
      .groupBy(question.id, question.order, question.body)
      .orderBy(asc(question.order));

    await this.db
      .insert(gameResult)
      .values({
        gameSessionId: session.id,
        participantStats,
        questionStats,
      })
      .onConflictDoUpdate({
        target: gameResult.gameSessionId,
        set: { participantStats, questionStats },
      });
  }
}
