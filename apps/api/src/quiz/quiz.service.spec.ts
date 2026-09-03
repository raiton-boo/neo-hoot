import { gameSession, quiz, user } from '@neo-hoot/db';

import { eq, inArray } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { closeTestDb, testDb } from '../../test/test-db.js';
import { CreateQuizDto } from './dto/create-quiz.dto.js';
import { QuestionType } from './dto/question.dto.js';
import { QuizService } from './quiz.service.js';

const service = new QuizService(testDb);

const validQuizInput: CreateQuizDto = {
  title: 'テストクイズ',
  questions: [
    {
      type: QuestionType.TrueFalse,
      body: 'テスト問題',
      timeLimitSeconds: 10,
      order: 1,
      choices: [
        { body: 'はい', isCorrect: true, order: 1 },
        { body: 'いいえ', isCorrect: false, order: 2 },
      ],
    },
  ],
};

describe('QuizService', () => {
  let userId: string;

  beforeAll(async () => {
    const [testUser] = await testDb
      .insert(user)
      .values({
        email: 'quiz-service-test@example.com',
        name: 'Test User',
      })
      .returning();

    if (!testUser) {
      throw new Error('Failed to create test user');
    }
    userId = testUser.id;
  });

  afterEach(async () => {
    const userQuizzes = await testDb
      .select({ id: quiz.id })
      .from(quiz)
      .where(eq(quiz.userId, userId));
    const quizIds = userQuizzes.map((q) => q.id);

    if (quizIds.length > 0) {
      await testDb
        .delete(gameSession)
        .where(inArray(gameSession.quizId, quizIds));
    }
    await testDb.delete(quiz).where(eq(quiz.userId, userId));
  });

  afterAll(async () => {
    await testDb.delete(user).where(eq(user.id, userId));
    await closeTestDb();
  });

  it('createQuiz: クイズと設問・選択肢を作成できる', async () => {
    const created = await service.createQuiz(userId, validQuizInput);

    const found = await service.getQuizById(userId, created.id);
    expect(found.title).toBe('テストクイズ');
    expect(found.questions).toHaveLength(1);
    expect(found.questions[0]?.choices).toHaveLength(2);
  });

  it('getQuizzes: アーカイブ済みのクイズは除外される', async () => {
    const created = await service.createQuiz(userId, validQuizInput);
    await service.archiveQuiz(userId, created.id);

    const activeQuizzes = await service.getQuizzes(userId);
    expect(activeQuizzes.find((q) => q.id === created.id)).toBeUndefined();

    const archivedQuizzes = await service.getArchivedQuizzes(userId);
    expect(archivedQuizzes.find((q) => q.id === created.id)).toBeDefined();
  });

  it('getQuizById: 他人のクイズにはアクセスできない', async () => {
    const created = await service.createQuiz(userId, validQuizInput);

    await expect(
      service.getQuizById('00000000-0000-0000-0000-000000000000', created.id),
    ).rejects.toThrow();
  });

  it('deleteQuiz: 開催履歴があるクイズは削除できない', async () => {
    const created = await service.createQuiz(userId, validQuizInput);
    await testDb.insert(gameSession).values({
      quizId: created.id,
      roomCode: '1234',
      status: 'finished',
    });

    await expect(service.deleteQuiz(userId, created.id)).rejects.toThrow();
  });
});
