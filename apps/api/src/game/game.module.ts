import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { GameStateService } from './game-state/game-state.service.js';
import { GameGateway } from './game.gateway.js';
import { GameService } from './game.service.js';
import { GameJobsProcessor } from './queue/game-jobs.processor.js';

@Module({
  imports: [BullModule.registerQueue({ name: 'game-jobs' })],
  providers: [GameGateway, GameService, GameStateService, GameJobsProcessor],
})
export class GameModule {}
