import { getDifficultyForStage, getBossHp } from '../difficulty';

describe('getDifficultyForStage', () => {
  it('returns base values for stage 1', () => {
    const d = getDifficultyForStage(1);
    expect(d.scrollSpeedMultiplier).toBe(1.0);
    expect(d.enemySpawnInterval).toBe(3.0);
    expect(d.enemyHpMultiplier).toBe(1.0);
    expect(d.enemyAtkMultiplier).toBe(1.0);
    expect(d.maxConcurrentEnemies).toBe(2);
    expect(d.bulletSpeedMultiplier).toBe(1.0);
  });

  it('scales correctly for stage 5', () => {
    const d = getDifficultyForStage(5);
    expect(d.scrollSpeedMultiplier).toBeCloseTo(1.24);
    expect(d.enemySpawnInterval).toBeCloseTo(2.28);
    expect(d.enemyHpMultiplier).toBeCloseTo(1.48);
    expect(d.enemyAtkMultiplier).toBeCloseTo(1.32);
    expect(d.maxConcurrentEnemies).toBe(4);
    expect(d.bulletSpeedMultiplier).toBeCloseTo(1.2);
  });

  it('clamps spawn interval to 1.2 minimum', () => {
    const d = getDifficultyForStage(20);
    expect(d.enemySpawnInterval).toBe(1.2);
  });

  it('clamps max concurrent enemies to 7', () => {
    const d = getDifficultyForStage(20);
    expect(d.maxConcurrentEnemies).toBe(7);
  });
});

describe('getBossHp', () => {
  it('returns 500 for first boss', () => {
    expect(getBossHp(1)).toBe(500);
  });

  it('returns 750 for second boss', () => {
    expect(getBossHp(2)).toBe(750);
  });

  it('returns 1000 for third boss', () => {
    expect(getBossHp(3)).toBe(1000);
  });
});
