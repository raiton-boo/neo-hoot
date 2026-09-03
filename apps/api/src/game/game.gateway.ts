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
import { GameService } from './game.service.js';

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly gameService: GameService) {}

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
    const session = await this.gameService.createRoom(dto.quizId);
    await client.join(session.roomCode);
    client.emit('roomCreated', { roomCode: session.roomCode });
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
}
