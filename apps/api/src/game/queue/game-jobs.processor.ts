import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { GameService } from '../game.service.js';

@Processor('game-jobs')
export class GameJobsProcessor extends WorkerHost {
  constructor(private readonly gameService: GameService) {
    super();
  }

  async process(job: Job<{ roomCode: string }>): Promise<void> {
    switch (job.name) {
      case 'aggregate-result':
        await this.gameService.aggregateGameResult(job.data.roomCode);
        break;
      case 'expire-room':
        await this.gameService.expireRoomIfWaiting(job.data.roomCode);
        break;
    }
  }
}
