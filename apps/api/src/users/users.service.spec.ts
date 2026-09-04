import {
  answer,
  choice,
  gameSession,
  participant,
  question,
  quiz,
  user,
} from '@neo-hoot/db';

import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';

import { closeTestDb, testDb } from '../../test/test-db.js';
import { UsersService } from './users.service.js';

const service = new UsersService(testDb);

describe('UsersService', () => {
  afterAll(async () => {
    await closeTestDb();
  });

  it('getCurrentUser: ユーザー情報を返す', async () => {
    const [testUser] = await testDb
      .insert(user)
      .values({
        email: 'users-service-test-1@example.com',
        name: 'テストユーザー',
      })
      .returning();

    if (!testUser) {
      throw new Error('Failed to create test user');
    }

    const found = await service.getCurrentUser(testUser.id);
    expect(found).toEqual({
      id: testUser.id,
      email: 'users-service-test-1@example.com',
      name: 'テストユーザー',
    });

    await testDb.delete(user).where(eq(user.id, testUser.id));
  });

  it('getCurrentUser: 存在しないユーザーだとエラーになる', async () => {
    await expect(
      service.getCurrentUser('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow();
  });

  it('deleteAccount: クイズ・開催履歴を含めて全て削除する', async () => {
    const [testUser] = await testDb
      .insert(user)
      .values({
        email: 'users-service-test-2@example.com',
        name: 'テストユーザー2',
      })
      .returning();
    if (!testUser) throw new Error('Failed to create test user');

    const [testQuiz] = await testDb
      .insert(quiz)
      .values({ userId: testUser.id, title: 'テストクイズ' })
      .returning();
    if (!testQuiz) throw new Error('Failed to create test quiz');

    const [testQuestion] = await testDb
      .insert(question)
      .values({
        quizId: testQuiz.id,
        type: 'choice',
        body: 'テスト問題',
        timeLimitSeconds: 10,
        order: 1,
      })
      .returning();
    if (!testQuestion) throw new Error('Failed to create test question');

    const [correctChoice] = await testDb
      .insert(choice)
      .values({
        questionId: testQuestion.id,
        body: '正解',
        isCorrect: true,
        order: 1,
      })
      .returning();
    if (!correctChoice) throw new Error('Failed to create test choice');

    const [session] = await testDb
      .insert(gameSession)
      .values({ quizId: testQuiz.id, roomCode: '9999', status: 'finished' })
      .returning();
    if (!session) throw new Error('Failed to create test session');

    const [testParticipant] = await testDb
      .insert(participant)
      .values({ gameSessionId: session.id, nickname: 'たろう' })
      .returning();
    if (!testParticipant) throw new Error('Failed to create test participant');

    await testDb.insert(answer).values({
      gameSessionId: session.id,
      participantId: testParticipant.id,
      questionId: testQuestion.id,
      choiceId: correctChoice.id,
      responseTimeMs: 1000,
      score: 100,
    });

    await service.deleteAccount(testUser.id);

    const [remainingUser] = await testDb
      .select()
      .from(user)
      .where(eq(user.id, testUser.id));
    expect(remainingUser).toBeUndefined();

    const [remainingQuiz] = await testDb
      .select()
      .from(quiz)
      .where(eq(quiz.id, testQuiz.id));
    expect(remainingQuiz).toBeUndefined();

    const [remainingSession] = await testDb
      .select()
      .from(gameSession)
      .where(eq(gameSession.id, session.id));
    expect(remainingSession).toBeUndefined();
  });
});
