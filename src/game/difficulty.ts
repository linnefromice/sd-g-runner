import type { DifficultyParams } from '@/types/stages';

/** Calculate difficulty parameters from stage ID (§7.2) */
export function getDifficultyForStage(stageId: number): DifficultyParams {
  return {
    scrollSpeedMultiplier: 1.0 + (stageId - 1) * 0.06,
    enemySpawnInterval: Math.max(1.2, 3.0 - (stageId - 1) * 0.18),
    enemyHpMultiplier: 1.0 + (stageId - 1) * 0.12,
    enemyAtkMultiplier: 1.0 + (stageId - 1) * 0.08,
    maxConcurrentEnemies: Math.min(7, 2 + Math.floor(stageId / 2)),
    bulletSpeedMultiplier: 1.0 + (stageId - 1) * 0.05,
  };
}

/** Calculate boss HP (§7.3) */
export function getBossHp(bossIndex: number): number {
  return 500 * (1 + (bossIndex - 1) * 0.5);
}
