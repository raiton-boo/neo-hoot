import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { QuestionDto } from './question.dto.js';

@ValidatorConstraint({ name: 'hasUniqueQuestionOrder', async: false })
export class HasUniqueQuestionOrderConstraint implements ValidatorConstraintInterface {
  validate(questions: QuestionDto[]) {
    const orders = questions.map((q) => q.order);
    return new Set(orders).size === orders.length;
  }

  defaultMessage() {
    return '設問のorderが重複しています';
  }
}

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
  @Validate(HasUniqueQuestionOrderConstraint)
  questions!: QuestionDto[];
}
