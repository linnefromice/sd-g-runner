import { getStage, getAvailableStageIds } from '@/game/stages';

describe('Stage data', () => {
  test('all 15 stages are registered', () => {
    const ids = getAvailableStageIds();
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });

  test.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])('stage %i has valid structure', (id) => {
    const stage = getStage(id);
    expect(stage.id).toBe(id);
    expect(stage.name).toBeTruthy();
    expect(stage.duration).toBeGreaterThan(0);
    expect(stage.timeline.length).toBeGreaterThan(0);
    expect(stage.difficulty.enemyHpMultiplier).toBeGreaterThanOrEqual(1.0);
  });

  test.each([5, 10, 15])('stage %i is a boss stage', (id) => {
    const stage = getStage(id);
    expect(stage.isBossStage).toBe(true);
    const bossEvents = stage.timeline.filter((e) => e.type === 'boss_spawn');
    expect(bossEvents.length).toBe(1);
  });

  test('timeline events are ordered by time', () => {
    for (let id = 1; id <= 15; id++) {
      const stage = getStage(id);
      for (let i = 1; i < stage.timeline.length; i++) {
        expect(stage.timeline[i].time).toBeGreaterThanOrEqual(
          stage.timeline[i - 1].time
        );
      }
    }
  });

  test('non-boss stages are correctly marked', () => {
    for (const id of [1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14]) {
      const stage = getStage(id);
      expect(stage.isBossStage).toBe(false);
    }
  });

  test('throws for unknown stage', () => {
    expect(() => getStage(99)).toThrow('Unknown stage: 99');
  });
});
