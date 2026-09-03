import { Injectable } from '@nestjs/common';

interface ActiveQuestion {
  questionId: string;
  order: number;
  timeLimitSeconds: number;
  startedAt: number;
  timer: NodeJS.Timeout;
  isExpired: boolean;
}

@Injectable()
export class GameStateService {
  private readonly activeQuestions = new Map<string, ActiveQuestion>();

  setActiveQuestion(
    roomCode: string,
    state: Omit<ActiveQuestion, 'isExpired'>,
  ): void {
    this.clearTimer(roomCode);
    this.activeQuestions.set(roomCode, { ...state, isExpired: false });
  }

  getActiveQuestion(roomCode: string): ActiveQuestion | undefined {
    return this.activeQuestions.get(roomCode);
  }

  isAcceptingAnswers(roomCode: string): boolean {
    const current = this.activeQuestions.get(roomCode);
    return current !== undefined && !current.isExpired;
  }

  clearTimer(roomCode: string): void {
    const existing = this.activeQuestions.get(roomCode);
    if (existing) {
      clearTimeout(existing.timer);
    }
  }

  expireActiveQuestion(roomCode: string): void {
    const existing = this.activeQuestions.get(roomCode);
    if (existing) {
      clearTimeout(existing.timer);
      existing.isExpired = true;
    }
  }
}
