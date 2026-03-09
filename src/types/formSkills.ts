import type { MechaFormId } from './forms';

export type FormSkillStatType =
  | 'bulletSpeed'
  | 'bulletSize'
  | 'fireRate'
  | 'damage'
  | 'moveSpeed'
  | 'aoeRadius';

export type FormSkillPassiveId =
  | 'pierce'
  | 'double_shot'
  | 'slow_on_hit'
  | 'double_explosion'
  | 'afterimage'
  | 'speed_atk_bonus'
  | 'auto_charge'
  | 'xp_on_crit'
  | 'omnidirectional'
  | 'heal_on_hit'
  | 'armor'
  | 'graze_expand'
  | 'critical_chance';

export type FormSkillEffect =
  | { type: 'stat_multiply'; stat: FormSkillStatType; value: number }
  | { type: 'stat_add'; stat: 'bulletCount' | 'pierceCount'; value: number }
  | { type: 'passive'; id: FormSkillPassiveId };

export interface FormSkillOption {
  label: string;
  effect: FormSkillEffect;
}

export interface FormSkillLevel {
  formId: MechaFormId;
  level: number;
  choiceA: FormSkillOption;
  choiceB: FormSkillOption;
}

export interface FormSkillChoice {
  level: number;
  choice: 'A' | 'B';
}

export interface FormXPState {
  xp: number;
  level: number;
  skills: FormSkillChoice[];
}
