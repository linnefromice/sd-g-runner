import { SCORE, CREDITS } from '@/constants/balance';
import type { EnemyType } from '@/types/enemies';

export function getEnemyScore(enemyType: EnemyType): number {
  return enemyType === 'patrol' ? SCORE.patrolKill : SCORE.enemyKill;
}

export function getEnemyCredits(): number {
  const { min, max } = CREDITS.enemyKill;
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function getStageClearScore(isBossStage: boolean): number {
  return isBossStage ? SCORE.bossStageClear : SCORE.stageClear;
}

export function getStageClearCredits(isBossStage: boolean): number {
  return isBossStage ? CREDITS.bossStageClear : CREDITS.stageClear;
}
