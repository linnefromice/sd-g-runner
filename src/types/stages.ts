import type { EnemyType } from './enemies';
import type { GatePairConfig } from './gates';

export interface DifficultyParams {
  scrollSpeedMultiplier: number;
  enemySpawnInterval: number;
  enemyHpMultiplier: number;
  enemyAtkMultiplier: number;
  maxConcurrentEnemies: number;
  /** Multiplier applied to enemy bullet speed (default 1.0) */
  bulletSpeedMultiplier: number;
  /** Multiplier applied to enemy attack intervals — lower = faster shooting (default 1.0) */
  attackIntervalMultiplier: number;
}

export type StageEvent =
  | { time: number; type: 'enemy_spawn'; enemyType: EnemyType; x: number; count?: number }
  | { time: number; type: 'gate_spawn'; gateConfig: GatePairConfig }
  | { time: number; type: 'boss_spawn'; bossId: string }
  | { time: number; type: 'debris_spawn'; x: number; count?: number }
  | { time: number; type: 'boost_lane_start'; x: number; width: number }
  | { time: number; type: 'boost_lane_end' };

export interface StageDefinition {
  id: number;
  name: string;
  isBossStage: boolean;
  isEndless?: boolean;
  duration: number;
  difficulty: DifficultyParams;
  timeline: StageEvent[];
}
