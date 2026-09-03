export interface Choice {
  id: string;
  questionId: string;
  body: string;
  isCorrect: boolean;
  order: number;
}

export interface Question {
  id: string;
  quizId: string;
  type: 'choice' | 'true_false' | 'survey';
  body: string;
  timeLimitSeconds: number;
  order: number;
  choices: Choice[];
}

export interface Quiz {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface QuizWithQuestions extends Quiz {
  questions: Question[];
}
