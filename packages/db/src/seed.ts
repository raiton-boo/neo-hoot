import { client, db } from './client.js';
import {
  answer,
  choice,
  gameSession,
  oauthIdentity,
  participant,
  question,
  quiz,
  user,
} from './schema/index.js';

function at<T>(rows: T[], index: number): T {
  const row = rows[index];
  if (row === undefined) {
    throw new Error(`Expected a row at index ${index}, but there was none.`);
  }
  return row;
}

await db.transaction(async (tx) => {
  await tx.delete(answer);
  await tx.delete(participant);
  await tx.delete(gameSession);
  await tx.delete(choice);
  await tx.delete(question);
  await tx.delete(quiz);
  await tx.delete(oauthIdentity);
  await tx.delete(user);

  const host = at(
    await tx
      .insert(user)
      .values({
        email: 'demo@example.com',
        name: 'デモホスト',
      })
      .returning(),
    0
  );

  await tx.insert(oauthIdentity).values({
    userId: host.id,
    provider: 'google',
    oauthId: 'demo-google-id',
  });

  // --- クイズ1: 日本地理クイズ ---
  const geoQuiz = at(
    await tx
      .insert(quiz)
      .values({
        userId: host.id,
        title: '日本地理クイズ',
        description: '都道府県に関する基本問題',
      })
      .returning(),
    0
  );

  const geoQuestions = await tx
    .insert(question)
    .values([
      {
        quizId: geoQuiz.id,
        type: 'choice',
        body: '日本で一番面積が大きい都道府県は？',
        timeLimitSeconds: 20,
        order: 1,
      },
      {
        quizId: geoQuiz.id,
        type: 'true_false',
        body: '富士山は静岡県と山梨県の両方にまたがっている',
        timeLimitSeconds: 15,
        order: 2,
      },
      {
        quizId: geoQuiz.id,
        type: 'survey',
        body: '好きな季節はどれですか？',
        timeLimitSeconds: 30,
        order: 3,
      },
    ])
    .returning();
  const geoQ1 = at(geoQuestions, 0);
  const geoQ2 = at(geoQuestions, 1);
  const geoQ3 = at(geoQuestions, 2);

  const geoQ1Choices = await tx
    .insert(choice)
    .values([
      { questionId: geoQ1.id, body: '北海道', isCorrect: true, order: 1 },
      { questionId: geoQ1.id, body: '岩手県', order: 2 },
      { questionId: geoQ1.id, body: '福島県', order: 3 },
      { questionId: geoQ1.id, body: '長野県', order: 4 },
    ])
    .returning();
  const hokkaido = at(geoQ1Choices, 0);
  const iwate = at(geoQ1Choices, 1);

  const geoQ2Choices = await tx
    .insert(choice)
    .values([
      { questionId: geoQ2.id, body: 'はい', isCorrect: true, order: 1 },
      { questionId: geoQ2.id, body: 'いいえ', order: 2 },
    ])
    .returning();
  const yes = at(geoQ2Choices, 0);
  const no = at(geoQ2Choices, 1);

  const geoQ3Choices = await tx
    .insert(choice)
    .values([
      { questionId: geoQ3.id, body: '春', order: 1 },
      { questionId: geoQ3.id, body: '夏', order: 2 },
      { questionId: geoQ3.id, body: '秋', order: 3 },
      { questionId: geoQ3.id, body: '冬', order: 4 },
    ])
    .returning();
  const summer = at(geoQ3Choices, 1);
  const winter = at(geoQ3Choices, 3);

  // --- クイズ2: 動物クイズ(まだ開催していない) ---
  const animalQuiz = at(
    await tx
      .insert(quiz)
      .values({
        userId: host.id,
        title: '動物クイズ',
        description: '身近な動物についての問題',
      })
      .returning(),
    0
  );

  const animalQuestions = await tx
    .insert(question)
    .values([
      {
        quizId: animalQuiz.id,
        type: 'choice',
        body: 'ライオンの鳴き声は？',
        timeLimitSeconds: 15,
        order: 1,
      },
      {
        quizId: animalQuiz.id,
        type: 'survey',
        body: '好きな動物はどれですか？',
        timeLimitSeconds: 20,
        order: 2,
      },
    ])
    .returning();
  const animalQ1 = at(animalQuestions, 0);
  const animalQ2 = at(animalQuestions, 1);

  await tx.insert(choice).values([
    { questionId: animalQ1.id, body: 'ガオー', isCorrect: true, order: 1 },
    { questionId: animalQ1.id, body: 'ワン', order: 2 },
    { questionId: animalQ1.id, body: 'ニャー', order: 3 },
    { questionId: animalQ1.id, body: 'モー', order: 4 },
  ]);

  await tx.insert(choice).values([
    { questionId: animalQ2.id, body: 'イヌ', order: 1 },
    { questionId: animalQ2.id, body: 'ネコ', order: 2 },
    { questionId: animalQ2.id, body: 'ウサギ', order: 3 },
    { questionId: animalQ2.id, body: 'ゾウ', order: 4 },
  ]);

  // --- 開催履歴のサンプル(日本地理クイズを1回開催した想定) ---
  const session = at(
    await tx
      .insert(gameSession)
      .values({
        quizId: geoQuiz.id,
        roomCode: '1234',
        status: 'finished',
        startedAt: new Date('2026-08-01T10:00:00Z'),
        finishedAt: new Date('2026-08-01T10:15:00Z'),
      })
      .returning(),
    0
  );

  const participants = await tx
    .insert(participant)
    .values([
      { gameSessionId: session.id, nickname: 'はなこ' },
      { gameSessionId: session.id, nickname: 'たろう' },
      { gameSessionId: session.id, nickname: 'じろう' },
    ])
    .returning();
  const hanako = at(participants, 0);
  const taro = at(participants, 1);
  const jiro = at(participants, 2);

  await tx.insert(answer).values([
    {
      gameSessionId: session.id,
      participantId: hanako.id,
      questionId: geoQ1.id,
      choiceId: hokkaido.id,
      responseTimeMs: 3200,
      score: 950,
    },
    {
      gameSessionId: session.id,
      participantId: taro.id,
      questionId: geoQ1.id,
      choiceId: hokkaido.id,
      responseTimeMs: 5400,
      score: 820,
    },
    {
      gameSessionId: session.id,
      participantId: jiro.id,
      questionId: geoQ1.id,
      choiceId: iwate.id,
      responseTimeMs: 4100,
      score: 0,
    },
    {
      gameSessionId: session.id,
      participantId: hanako.id,
      questionId: geoQ2.id,
      choiceId: yes.id,
      responseTimeMs: 2100,
      score: 980,
    },
    {
      gameSessionId: session.id,
      participantId: taro.id,
      questionId: geoQ2.id,
      choiceId: no.id,
      responseTimeMs: 6000,
      score: 0,
    },
    {
      gameSessionId: session.id,
      participantId: jiro.id,
      questionId: geoQ2.id,
      choiceId: yes.id,
      responseTimeMs: 3300,
      score: 900,
    },
    {
      gameSessionId: session.id,
      participantId: hanako.id,
      questionId: geoQ3.id,
      choiceId: summer.id,
      responseTimeMs: 4000,
      score: 0,
    },
    {
      gameSessionId: session.id,
      participantId: taro.id,
      questionId: geoQ3.id,
      choiceId: winter.id,
      responseTimeMs: 3800,
      score: 0,
    },
    {
      gameSessionId: session.id,
      participantId: jiro.id,
      questionId: geoQ3.id,
      choiceId: summer.id,
      responseTimeMs: 5200,
      score: 0,
    },
  ]);
});

console.log('✅ Seed完了');

await client.end();
