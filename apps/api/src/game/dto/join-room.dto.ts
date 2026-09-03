import { IsString, Matches, MaxLength } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @Matches(/^\d{4}$/, { message: 'ルームコードは4桁の数字です' })
  roomCode!: string;

  @IsString()
  @MaxLength(20)
  nickname!: string;
}
