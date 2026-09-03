import { IsString, Matches } from 'class-validator';

export class NextQuestionDto {
  @IsString()
  @Matches(/^\d{4}$/, { message: 'ルームコードは4桁の数字です' })
  roomCode!: string;
}
