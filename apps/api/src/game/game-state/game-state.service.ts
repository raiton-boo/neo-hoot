import { Injectable } from '@nestjs/common';

interface ActiveQuestion {
  questionId: string;
  order: number;
  timeLimitSeconds: number;
  startedAt: number;
  timer: NodeJS.Timeout | null;
  isExpired: boolean;
  isPaused: boolean;
  remainingMs: number | null;
}

type NewActiveQuestion = Pick<
  ActiveQuestion,
  'questionId' | 'order' | 'timeLimitSeconds' | 'startedAt' | 'timer'
>;

@Injectable()
export class GameStateService {
  private readonly activeQuestions = new Map<string, ActiveQuestion>();
  private readonly disconnectedParticipants = new Map<string, Set<string>>();
  private readonly socketParticipants = new Map<
    string,
    { roomCode: string; participantId: string }
  >();

  registerParticipantSocket(
    socketId: string,
    roomCode: string,
    participantId: string,
  ): void {
    this.socketParticipants.set(socketId, { roomCode, participantId });
  }

  handleParticipantDisconnect(
    socketId: string,
  ): { roomCode: string; participantId: string } | undefined {
    const entry = this.socketParticipants.get(socketId);

    if (!entry) {
      return undefined;
    }

    this.socketParticipants.delete(socketId);

    const disconnected =
      this.disconnectedParticipants.get(entry.roomCode) ?? new Set<string>();
    disconnected.add(entry.participantId);
    this.disconnectedParticipants.set(entry.roomCode, disconnected);

    return entry;
  }

  getDisconnectedCount(roomCode: string): number {
    return this.disconnectedParticipants.get(roomCode)?.size ?? 0;
  }

  setActiveQuestion(roomCode: string, state: NewActiveQuestion): void {
    this.clearTimer(roomCode);
    this.activeQuestions.set(roomCode, {
      ...state,
      isExpired: false,
      isPaused: false,
      remainingMs: null,
    });
  }

  getActiveQuestion(roomCode: string): ActiveQuestion | undefined {
    return this.activeQuestions.get(roomCode);
  }

  isAcceptingAnswers(roomCode: string): boolean {
    const current = this.activeQuestions.get(roomCode);
    return current !== undefined && !current.isExpired && !current.isPaused;
  }

  clearTimer(roomCode: string): void {
    const existing = this.activeQuestions.get(roomCode);
    if (existing?.timer) {
      clearTimeout(existing.timer);
    }
  }

  expireActiveQuestion(roomCode: string): boolean {
    const existing = this.activeQuestions.get(roomCode);
    if (!existing || existing.isExpired) {
      return false;
    }
    this.clearTimer(roomCode);
    existing.isExpired = true;
    return true;
  }

  pauseQuestion(roomCode: string): number | null {
    const current = this.activeQuestions.get(roomCode);

    if (!current || current.isExpired || current.isPaused) {
      return null;
    }

    const elapsedMs = Date.now() - current.startedAt;
    const remainingMs = current.timeLimitSeconds * 1000 - elapsedMs;

    this.clearTimer(roomCode);
    current.timer = null;
    current.isPaused = true;
    current.remainingMs = remainingMs;

    return remainingMs;
  }

  resumeQuestion(roomCode: string, timer: NodeJS.Timeout): number | null {
    const current = this.activeQuestions.get(roomCode);

    if (!current || !current.isPaused || current.remainingMs === null) {
      return null;
    }

    const remainingMs = current.remainingMs;
    current.startedAt =
      Date.now() - (current.timeLimitSeconds * 1000 - remainingMs);
    current.timer = timer;
    current.isPaused = false;
    current.remainingMs = null;

    return remainingMs;
  }
}
