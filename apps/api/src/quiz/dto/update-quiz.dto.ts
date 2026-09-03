import { PartialType } from '@nestjs/mapped-types';

import { CreateQuizDto } from './create-quiz.dto.js';

export class UpdateQuizDto extends PartialType(CreateQuizDto) {}
