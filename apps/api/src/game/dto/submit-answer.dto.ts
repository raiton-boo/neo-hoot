import { IsString, IsUUID, Matches } from 'class-validator';

export class SubmitAnswerDto {
  @IsString()
  @Matches(/^\d{4}$/, { message: 'ルームコードは4桁の数字です' })
  roomCode!: string;

  @IsUUID()
  participantId!: string;

  @IsUUID()
  choiceId!: string;
}
