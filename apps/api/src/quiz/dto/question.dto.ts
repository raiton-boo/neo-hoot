import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsEnum,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { ChoiceDto } from './choice.dto.js';

export enum QuestionType {
  Choice = 'choice',
  TrueFalse = 'true_false',
  Survey = 'survey',
}

export class QuestionDto {
  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsString()
  @MaxLength(100)
  body!: string;

  @IsInt()
  @Min(5)
  @Max(120)
  timeLimitSeconds!: number;

  @IsInt()
  @Min(1)
  order!: number;

  @ValidateNested({ each: true })
  @Type(() => ChoiceDto)
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  choices!: ChoiceDto[];
}
