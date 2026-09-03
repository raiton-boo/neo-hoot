import { IsString, Matches } from 'class-validator';

export class RoomCodeDto {
  @IsString()
  @Matches(/^\d{4}$/, { message: 'ルームコードは4桁の数字です' })
  roomCode!: string;
}
