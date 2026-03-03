import type { EnemyType } from './enemies';
import type { GatePairConfig } from './gates';

export interface DifficultyParams {
  scrollSpeedMultiplier: number;
  enemySpawnInterval: number;
  enemyHpMultiplier: number;
  enemyAtkMultiplier: number;
  maxConcurrentEnemies: number;
}

export type StageEvent =
  | { time: number; type: 'enemy_spawn'; enemyType: EnemyType; x: number; count?: number }
  | { time: number; type: 'gate_spawn'; gateConfig: GatePairConfig }
  | { time: number; type: 'boss_spawn'; bossId: string };

export interface StageDefinition {
  id: number;
  name: string;
  isBossStage: boolean;
  duration: number;
  difficulty: DifficultyParams;
  timeline: StageEvent[];
}
