import type { StageDefinition } from '@/types/stages';
import { STAGE_1 } from './stage1';
import { STAGE_2 } from './stage2';
import { STAGE_3 } from './stage3';
import { STAGE_4 } from './stage4';
import { STAGE_5 } from './stage5';
import { STAGE_6 } from './stage6';
import { STAGE_7 } from './stage7';
import { STAGE_8 } from './stage8';
import { STAGE_9 } from './stage9';
import { STAGE_10 } from './stage10';
import { STAGE_11 } from './stage11';
import { STAGE_12 } from './stage12';
import { STAGE_13 } from './stage13';
import { STAGE_14 } from './stage14';
import { STAGE_15 } from './stage15';

const STAGES: Record<number, StageDefinition> = {
  1: STAGE_1,
  2: STAGE_2,
  3: STAGE_3,
  4: STAGE_4,
  5: STAGE_5,
  6: STAGE_6,
  7: STAGE_7,
  8: STAGE_8,
  9: STAGE_9,
  10: STAGE_10,
  11: STAGE_11,
  12: STAGE_12,
  13: STAGE_13,
  14: STAGE_14,
  15: STAGE_15,
  99: {
    id: 99,
    name: 'Endless',
    duration: Infinity,
    isBossStage: false,
    isEndless: true,
    timeline: [], // generated dynamically by createEndlessSpawnSystem
    difficulty: {
      scrollSpeedMultiplier: 1.0,
      enemySpawnInterval: 2.5,
      enemyHpMultiplier: 1.0,
      enemyAtkMultiplier: 1.0,
      maxConcurrentEnemies: 6,
      bulletSpeedMultiplier: 1.0,
      attackIntervalMultiplier: 1.0,
    },
  },
};

export function getStage(id: number): StageDefinition {
  const stage = STAGES[id];
  if (!stage) throw new Error(`Unknown stage: ${id}`);
  return stage;
}

/** Returns stage IDs for normal campaign stages (1-15). Endless mode (99) is excluded. */
export function getAvailableStageIds(): number[] {
  return Object.keys(STAGES)
    .map(Number)
    .filter((id) => id <= 15)
    .sort((a, b) => a - b);
}
