import type { DifficultyParams } from '@/types/stages';

/** Calculate difficulty parameters from stage ID (§7.2) */
export function getDifficultyForStage(stageId: number): DifficultyParams {
  return {
    scrollSpeedMultiplier: 1.0 + (stageId - 1) * 0.05,
    enemySpawnInterval: Math.max(1.5, 3.0 - (stageId - 1) * 0.15),
    enemyHpMultiplier: 1.0 + (stageId - 1) * 0.1,
    enemyAtkMultiplier: 1.0 + (stageId - 1) * 0.06,
    maxConcurrentEnemies: Math.min(6, 2 + Math.floor(stageId / 2)),
  };
}

/** Calculate boss HP (§7.3) */
export function getBossHp(bossIndex: number): number {
  return 500 * (1 + (bossIndex - 1) * 0.5);
}
