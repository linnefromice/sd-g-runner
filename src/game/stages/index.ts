import type { StageDefinition } from '@/types/stages';
import { STAGE_1 } from './stage1';

const STAGES: Record<number, StageDefinition> = {
  1: STAGE_1,
};

export function getStage(id: number): StageDefinition {
  const stage = STAGES[id];
  if (!stage) throw new Error(`Unknown stage: ${id}`);
  return stage;
}

export function getAvailableStageIds(): number[] {
  return Object.keys(STAGES).map(Number).sort((a, b) => a - b);
}
