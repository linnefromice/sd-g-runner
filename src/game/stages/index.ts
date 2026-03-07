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
};

export function getStage(id: number): StageDefinition {
  const stage = STAGES[id];
  if (!stage) throw new Error(`Unknown stage: ${id}`);
  return stage;
}

export function getAvailableStageIds(): number[] {
  return Object.keys(STAGES).map(Number).sort((a, b) => a - b);
}
