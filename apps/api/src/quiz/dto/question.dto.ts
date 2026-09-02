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
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

import { ChoiceDto } from './choice.dto.js';

export enum QuestionType {
  Choice = 'choice',
  TrueFalse = 'true_false',
  Survey = 'survey',
}

@ValidatorConstraint({ name: 'hasExactlyOneCorrectChoice', async: false })
export class HasExactlyOneCorrectChoiceConstraint implements ValidatorConstraintInterface {
  validate(choices: ChoiceDto[], args: ValidationArguments) {
    const questionDto = args.object as QuestionDto;
    const correctCount = choices.filter((c) => c.isCorrect).length;

    if (questionDto.type === QuestionType.Survey) {
      return correctCount === 0;
    }

    return correctCount === 1;
  }

  defaultMessage(args: ValidationArguments) {
    const questionDto = args.object as QuestionDto;
    if (questionDto.type === QuestionType.Survey) {
      return 'アンケートの選択肢は、正解(isCorrect)を設定できません';
    }
    return '正解となる選択肢は、ちょうど1つ選んでください';
  }
}

const REQUIRED_CHOICE_COUNT: Record<QuestionType, number | null> = {
  [QuestionType.Choice]: 4,
  [QuestionType.TrueFalse]: 2,
  [QuestionType.Survey]: null,
};

@ValidatorConstraint({ name: 'hasCorrectChoiceCount', async: false })
export class HasCorrectChoiceCountConstraint implements ValidatorConstraintInterface {
  validate(choices: ChoiceDto[], args: ValidationArguments) {
    const questionDto = args.object as QuestionDto;
    const requiredCount = REQUIRED_CHOICE_COUNT[questionDto.type];

    if (requiredCount === null) {
      return true;
    }

    return choices.length === requiredCount;
  }

  defaultMessage(args: ValidationArguments) {
    const questionDto = args.object as QuestionDto;
    const requiredCount = REQUIRED_CHOICE_COUNT[questionDto.type];
    return `${questionDto.type}タイプの選択肢は${requiredCount}個である必要があります`;
  }
}

@ValidatorConstraint({ name: 'hasUniqueChoiceOrder', async: false })
export class HasUniqueChoiceOrderConstraint implements ValidatorConstraintInterface {
  validate(choices: ChoiceDto[]) {
    const orders = choices.map((c) => c.order);
    return new Set(orders).size === orders.length;
  }

  defaultMessage() {
    return '選択肢のorderが重複しています';
  }
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
  @Validate(HasExactlyOneCorrectChoiceConstraint)
  @Validate(HasCorrectChoiceCountConstraint)
  @Validate(HasUniqueChoiceOrderConstraint)
  choices!: ChoiceDto[];
}
