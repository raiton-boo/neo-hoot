import { choice, gameSession, question, quiz, user } from '@neo-hoot/db';

import { eq } from 'drizzle-orm';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { closeTestDb, testDb } from '../../test/test-db.js';
import { closeTestQueue, testQueue } from '../../test/test-queue.js';
import { GameService } from './game.service.js';

const service = new GameService(testDb, testQueue);

describe('GameService', () => {
  let userId: string;
  let quizId: string;
  let questionId: string;
  let correctChoiceId: string;
  let wrongChoiceId: string;

  beforeAll(async () => {
    const [testUser] = await testDb
      .insert(user)
      .values({
        email: 'game-service-test@example.com',
        name: 'Test User',
        oauthProvider: 'test',
        oauthId: 'game-service-test',
      })
      .returning();

    if (!testUser) {
      throw new Error('Failed to create test user');
    }
    userId = testUser.id;

    const [testQuiz] = await testDb
      .insert(quiz)
      .values({ userId, title: 'テストクイズ' })
      .returning();

    if (!testQuiz) {
      throw new Error('Failed to create test quiz');
    }
    quizId = testQuiz.id;

    const [testQuestion] = await testDb
      .insert(question)
      .values({
        quizId,
        type: 'choice',
        body: 'テスト問題',
        timeLimitSeconds: 15,
        order: 1,
      })
      .returning();

    if (!testQuestion) {
      throw new Error('Failed to create test question');
    }
    questionId = testQuestion.id;

    const [correct] = await testDb
      .insert(choice)
      .values({ questionId, body: '正解', isCorrect: true, order: 1 })
      .returning();
    const [wrong] = await testDb
      .insert(choice)
      .values({ questionId, body: '不正解', isCorrect: false, order: 2 })
      .returning();

    if (!correct || !wrong) {
      throw new Error('Failed to create choices');
    }
    correctChoiceId = correct.id;
    wrongChoiceId = wrong.id;
  });

  afterEach(async () => {
    await testDb.delete(gameSession).where(eq(gameSession.quizId, quizId));
  });

  afterAll(async () => {
    await testDb.delete(quiz).where(eq(quiz.id, quizId));
    await testDb.delete(user).where(eq(user.id, userId));
    await closeTestQueue();
    await closeTestDb();
  });

  it('createRoom: 4桁のroomCodeでwaiting状態のセッションを作成する', async () => {
    const session = await service.createRoom(quizId);
    expect(session.status).toBe('waiting');
    expect(session.roomCode).toMatch(/^\d{4}$/);
  });

  it('createRoom: 存在しないクイズIDだとエラーになる', async () => {
    await expect(
      service.createRoom('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow();
  });

  it('joinRoom: waiting状態のルームに参加できる', async () => {
    const session = await service.createRoom(quizId);
    const p = await service.joinRoom(session.roomCode, 'たろう');
    expect(p.nickname).toBe('たろう');
  });

  it('joinRoom: 同じニックネームで2回参加するとエラーになる', async () => {
    const session = await service.createRoom(quizId);
    await service.joinRoom(session.roomCode, 'たろう');
    await expect(
      service.joinRoom(session.roomCode, 'たろう'),
    ).rejects.toThrow();
  });

  it('joinRoom: waiting状態でないルームには参加できない', async () => {
    const session = await service.createRoom(quizId);
    await service.startQuizIfNeeded(session.roomCode);
    await expect(
      service.joinRoom(session.roomCode, 'たろう'),
    ).rejects.toThrow();
  });

  it('getQuestionByOrder: 1問目を取得できる(choicesにisCorrectを含まない)', async () => {
    const session = await service.createRoom(quizId);
    const q = await service.getQuestionByOrder(session.roomCode, 1);
    expect(q?.id).toBe(questionId);
    expect(q?.choices).toHaveLength(2);
    expect(q?.choices[0]).not.toHaveProperty('isCorrect');
  });

  it('getQuestionByOrder: 存在しない順番だとnullを返す', async () => {
    const session = await service.createRoom(quizId);
    const q = await service.getQuestionByOrder(session.roomCode, 99);
    expect(q).toBeNull();
  });

  it('getCorrectChoiceId: 正解の選択肢IDを返す', async () => {
    const id = await service.getCorrectChoiceId(questionId);
    expect(id).toBe(correctChoiceId);
  });

  it('submitAnswer: 正解なら満点に近い点数でisCorrectがtrueになる', async () => {
    const session = await service.createRoom(quizId);
    const p = await service.joinRoom(session.roomCode, 'たろう');
    const result = await service.submitAnswer({
      roomCode: session.roomCode,
      participantId: p.id,
      questionId,
      choiceId: correctChoiceId,
      responseTimeMs: 0,
      timeLimitSeconds: 15,
    });
    expect(result.isCorrect).toBe(true);
    expect(result.score).toBe(100);
  });

  it('submitAnswer: 不正解なら0点になる', async () => {
    const session = await service.createRoom(quizId);
    const p = await service.joinRoom(session.roomCode, 'たろう');
    const result = await service.submitAnswer({
      roomCode: session.roomCode,
      participantId: p.id,
      questionId,
      choiceId: wrongChoiceId,
      responseTimeMs: 0,
      timeLimitSeconds: 15,
    });
    expect(result.isCorrect).toBe(false);
    expect(result.score).toBe(0);
  });

  it('submitAnswer: 制限時間ぴったりの正解は最低保証の50点になる', async () => {
    const session = await service.createRoom(quizId);
    const p = await service.joinRoom(session.roomCode, 'たろう');
    const result = await service.submitAnswer({
      roomCode: session.roomCode,
      participantId: p.id,
      questionId,
      choiceId: correctChoiceId,
      responseTimeMs: 15000,
      timeLimitSeconds: 15,
    });
    expect(result.score).toBe(50);
  });

  it('submitAnswer: 同じ設問に2回回答するとエラーになる', async () => {
    const session = await service.createRoom(quizId);
    const p = await service.joinRoom(session.roomCode, 'たろう');
    await service.submitAnswer({
      roomCode: session.roomCode,
      participantId: p.id,
      questionId,
      choiceId: correctChoiceId,
      responseTimeMs: 0,
      timeLimitSeconds: 15,
    });

    await expect(
      service.submitAnswer({
        roomCode: session.roomCode,
        participantId: p.id,
        questionId,
        choiceId: correctChoiceId,
        responseTimeMs: 0,
        timeLimitSeconds: 15,
      }),
    ).rejects.toThrow();
  });

  it('hasAllParticipantsAnswered: 除外人数を考慮して判定する', async () => {
    const session = await service.createRoom(quizId);
    const p1 = await service.joinRoom(session.roomCode, 'たろう');
    const p2 = await service.joinRoom(session.roomCode, 'じろう');

    expect(
      await service.hasAllParticipantsAnswered(session.roomCode, questionId),
    ).toBe(false);

    await service.submitAnswer({
      roomCode: session.roomCode,
      participantId: p1.id,
      questionId,
      choiceId: correctChoiceId,
      responseTimeMs: 0,
      timeLimitSeconds: 15,
    });

    expect(
      await service.hasAllParticipantsAnswered(session.roomCode, questionId),
    ).toBe(false);
    expect(
      await service.hasAllParticipantsAnswered(session.roomCode, questionId, 1),
    ).toBe(true);

    await service.submitAnswer({
      roomCode: session.roomCode,
      participantId: p2.id,
      questionId,
      choiceId: wrongChoiceId,
      responseTimeMs: 0,
      timeLimitSeconds: 15,
    });

    expect(
      await service.hasAllParticipantsAnswered(session.roomCode, questionId),
    ).toBe(true);
  });

  it('getAnswerDistribution: 選択肢ごとの回答数を集計する', async () => {
    const session = await service.createRoom(quizId);
    const p1 = await service.joinRoom(session.roomCode, 'たろう');
    const p2 = await service.joinRoom(session.roomCode, 'じろう');

    await service.submitAnswer({
      roomCode: session.roomCode,
      participantId: p1.id,
      questionId,
      choiceId: correctChoiceId,
      responseTimeMs: 0,
      timeLimitSeconds: 15,
    });
    await service.submitAnswer({
      roomCode: session.roomCode,
      participantId: p2.id,
      questionId,
      choiceId: correctChoiceId,
      responseTimeMs: 0,
      timeLimitSeconds: 15,
    });

    const distribution = await service.getAnswerDistribution(questionId);
    const entry = distribution.find((d) => d.choiceId === correctChoiceId);
    expect(entry?.count).toBe(2);
  });

  it('getTopRanking: 合計点の降順で、数値型のtotalScoreを返す', async () => {
    const session = await service.createRoom(quizId);
    const p1 = await service.joinRoom(session.roomCode, 'たろう');
    const p2 = await service.joinRoom(session.roomCode, 'じろう');

    await service.submitAnswer({
      roomCode: session.roomCode,
      participantId: p1.id,
      questionId,
      choiceId: correctChoiceId,
      responseTimeMs: 0,
      timeLimitSeconds: 15,
    });
    await service.submitAnswer({
      roomCode: session.roomCode,
      participantId: p2.id,
      questionId,
      choiceId: wrongChoiceId,
      responseTimeMs: 0,
      timeLimitSeconds: 15,
    });

    const ranking = await service.getTopRanking(session.roomCode);
    expect(ranking[0]?.participantId).toBe(p1.id);
    expect(typeof ranking[0]?.totalScore).toBe('number');
    expect(ranking[1]?.totalScore).toBe(0);
  });

  it('finishGame: in_progressからfinishedに更新する', async () => {
    const session = await service.createRoom(quizId);
    await service.startQuizIfNeeded(session.roomCode);
    await service.finishGame(session.roomCode);

    const [updated] = await testDb
      .select({ status: gameSession.status })
      .from(gameSession)
      .where(eq(gameSession.id, session.id));

    expect(updated?.status).toBe('finished');
  });
});
