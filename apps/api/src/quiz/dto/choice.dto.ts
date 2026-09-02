import { IsBoolean, IsInt, IsString, MaxLength, Min } from 'class-validator';

export class ChoiceDto {
  @IsString()
  @MaxLength(20)
  body!: string;

  @IsBoolean()
  isCorrect!: boolean;

  @IsInt()
  @Min(1)
  order!: number;
}
