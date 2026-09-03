import { Module } from '@nestjs/common';

import { GameStateService } from './game-state/game-state.service.js';
import { GameGateway } from './game.gateway.js';
import { GameService } from './game.service.js';

@Module({
  providers: [GameGateway, GameService, GameStateService],
})
export class GameModule {}
