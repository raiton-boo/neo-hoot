import { IsUUID } from 'class-validator';

export class CreateRoomDto {
  @IsUUID()
  quizId!: string;
}
