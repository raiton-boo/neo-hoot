import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { QuestionDto } from './question.dto.js';

export class CreateQuizDto {
  @IsString()
  @MaxLength(30)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  description?: string;

  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  @ArrayMinSize(1)
  questions!: QuestionDto[];
}
