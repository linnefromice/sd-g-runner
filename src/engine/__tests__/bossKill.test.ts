import { applyBossKill } from '../systems/bossKill';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { createGameEntities } from '@/engine/createGameEntities';
import type { BossEntity } from '@/types/entities';

function createTestBoss(overrides: Partial<BossEntity> = {}): BossEntity {
  return {
    id: 'boss-1',
    type: 'boss',
    bossIndex: 1,
    x: 100,
    y: 40,
    width: 200,
    height: 120,
    active: true,
    hp: 100,
    maxHp: 500,
    phase: 'spread',
    attackTimer: 0,
    hoverTimer: 0,
    hoverDirection: 1,
    drones: [],
    laserState: 'idle',
    laserTimer: 0,
    laserX: 0,
    laserTickTimer: 0,
    ...overrides,
  };
}

describe('applyBossKill', () => {
  beforeEach(() => {
    useGameSessionStore.getState().resetSession(1);
  });

  it('deactivates boss and sets stage clear', () => {
    const entities = createGameEntities(320, 568);
    entities.boss = createTestBoss();
    entities.stageTime = 45;

    applyBossKill(entities);

    expect(entities.boss.active).toBe(false);
    const store = useGameSessionStore.getState();
    expect(store.isStageClear).toBe(true);
    expect(store.finalStageTime).toBe(45);
  });

  it('does nothing if boss is null', () => {
    const entities = createGameEntities(320, 568);
    entities.boss = null;

    applyBossKill(entities);

    const store = useGameSessionStore.getState();
    expect(store.isStageClear).toBe(false);
  });

  it('does nothing if boss is already inactive', () => {
    const entities = createGameEntities(320, 568);
    entities.boss = createTestBoss({ active: false });

    applyBossKill(entities);

    const store = useGameSessionStore.getState();
    expect(store.isStageClear).toBe(false);
  });
});
