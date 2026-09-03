import { Test, TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it } from 'vitest';

import { GameGateway } from './game.gateway.js';

describe('GameGateway', () => {
  let gateway: GameGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameGateway],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
