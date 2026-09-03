import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { CreateRoomDto } from './dto/create-room.dto.js';
import { JoinRoomDto } from './dto/join-room.dto.js';
import { NextQuestionDto } from './dto/next-question.dto.js';
import { SubmitAnswerDto } from './dto/submit-answer.dto.js';
import { GameStateService } from './game-state/game-state.service.js';
import { GameService } from './game.service.js';

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly gameService: GameService,
    private readonly gameStateService: GameStateService,
  ) {}

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateRoomDto,
  ) {
    try {
      const session = await this.gameService.createRoom(dto.quizId);
      await client.join(session.roomCode);
      client.emit('roomCreated', { roomCode: session.roomCode });
    } catch (error) {
      client.emit('createRoom-error', {
        message:
          error instanceof Error ? error.message : 'ルーム作成に失敗しました',
      });
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    this.server.to(dto.roomCode).emit('participant:connecting');

    try {
      const newParticipant = await this.gameService.joinRoom(
        dto.roomCode,
        dto.nickname,
      );
      await client.join(dto.roomCode);
      this.server.to(dto.roomCode).emit('participant:joined', {
        id: newParticipant.id,
        nickname: newParticipant.nickname,
      });
    } catch (error) {
      client.emit('join-room-error', {
        message: error instanceof Error ? error.message : '参加に失敗しました',
      });
    }
  }

  @SubscribeMessage('next-question')
  async handleNextQuestion(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: NextQuestionDto,
  ): Promise<void> {
    try {
      await this.gameService.startQuizIfNeeded(dto.roomCode);

      const current = this.gameStateService.getActiveQuestion(dto.roomCode);
      const nextOrder = current ? current.order + 1 : 1;

      const nextQuestion = await this.gameService.getQuestionByOrder(
        dto.roomCode,
        nextOrder,
      );

      if (!nextQuestion) {
        this.gameStateService.clearTimer(dto.roomCode);
        this.server.to(dto.roomCode).emit('all-questions-finished');
        return;
      }

      const timer = setTimeout(() => {
        void this.revealAnswer(dto.roomCode, nextQuestion.id);
      }, nextQuestion.timeLimitSeconds * 1000);

      this.gameStateService.setActiveQuestion(dto.roomCode, {
        questionId: nextQuestion.id,
        order: nextQuestion.order,
        timeLimitSeconds: nextQuestion.timeLimitSeconds,
        startedAt: Date.now(),
        timer,
      });

      this.server.to(dto.roomCode).emit('question', {
        id: nextQuestion.id,
        body: nextQuestion.body,
        type: nextQuestion.type,
        order: nextQuestion.order,
        timeLimitSeconds: nextQuestion.timeLimitSeconds,
        choices: nextQuestion.choices,
      });
    } catch (error) {
      client.emit('next-question-error', {
        message: error instanceof Error ? error.message : '出題に失敗しました',
      });
    }
  }

  private async revealAnswer(
    roomCode: string,
    questionId: string,
  ): Promise<void> {
    this.gameStateService.expireActiveQuestion(roomCode);
    const correctChoiceId =
      await this.gameService.getCorrectChoiceId(questionId);
    this.server.to(roomCode).emit('question:timeup', { correctChoiceId });
  }

  @SubscribeMessage('submit-answer')
  async handleSubmitAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SubmitAnswerDto,
  ): Promise<void> {
    try {
      const active = this.gameStateService.getActiveQuestion(dto.roomCode);

      if (!active || !this.gameStateService.isAcceptingAnswers(dto.roomCode)) {
        throw new Error('現在進行中の設問がありません');
      }

      const responseTimeMs = Date.now() - active.startedAt;

      const result = await this.gameService.submitAnswer({
        roomCode: dto.roomCode,
        participantId: dto.participantId,
        questionId: active.questionId,
        choiceId: dto.choiceId,
        responseTimeMs,
        timeLimitSeconds: active.timeLimitSeconds,
      });

      client.emit('answer-submitted', { score: result.score });
    } catch (error) {
      client.emit('submit-answer-error', {
        message:
          error instanceof Error ? error.message : '回答の送信に失敗しました',
      });
    }
  }
}
