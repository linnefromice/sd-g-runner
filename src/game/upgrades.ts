import type { MechaFormId } from '@/types/forms';

export interface UpgradeConfig {
  /** Stat increase per level */
  effect: number;
  maxLevel: number;
  /** Cost formula: costPerLevel * (currentLevel + 1) */
  costPerLevel: number;
  label: string;
}

export type FormUnlockCondition =
  | { type: 'initial' }
  | { type: 'unlock'; requiredStage: number; cost: number }
  | { type: 'combo_only' };

export const UPGRADE_CONFIG: Record<string, UpgradeConfig> = {
  atk:   { effect: 2,    maxLevel: 10, costPerLevel: 100, label: 'ATK' },
  hp:    { effect: 10,   maxLevel: 10, costPerLevel: 100, label: 'HP' },
  speed: { effect: 0.05, maxLevel: 5,  costPerLevel: 100, label: 'Speed' },
};

export const FORM_UNLOCK_CONDITIONS: Record<MechaFormId, FormUnlockCondition> = {
  SD_Standard:       { type: 'initial' },
  SD_HeavyArtillery: { type: 'unlock', requiredStage: 3, cost: 500 },
  SD_HighSpeed:      { type: 'unlock', requiredStage: 7, cost: 500 },
  SD_Awakened:       { type: 'combo_only' },
};

export function getUpgradeCost(stat: string, currentLevel: number): number {
  const config = UPGRADE_CONFIG[stat];
  if (!config) return Infinity;
  return config.costPerLevel * (currentLevel + 1);
}

export function getUpgradeEffect(stat: string, level: number): number {
  const config = UPGRADE_CONFIG[stat];
  if (!config) return 0;
  return config.effect * level;
}

export function canUnlockForm(
  formId: MechaFormId,
  unlockedStages: number[],
  credits: number,
): boolean {
  const cond = FORM_UNLOCK_CONDITIONS[formId];
  if (cond.type !== 'unlock') return false;
  return unlockedStages.includes(cond.requiredStage) && credits >= cond.cost;
}
