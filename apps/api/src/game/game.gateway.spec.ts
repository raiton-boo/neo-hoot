import { describe, expect, it } from 'vitest';

import { testDb } from '../../test/test-db.js';
import { GameStateService } from './game-state/game-state.service.js';
import { GameGateway } from './game.gateway.js';
import { GameService } from './game.service.js';

describe('GameGateway', () => {
  it('should be defined', () => {
    const gameService = new GameService(testDb);
    const gameStateService = new GameStateService();
    const gateway = new GameGateway(gameService, gameStateService);

    expect(gateway).toBeDefined();
  });
});
