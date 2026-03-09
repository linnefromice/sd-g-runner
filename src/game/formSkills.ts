import type { FormSkillLevel } from '@/types/formSkills';

export const FORM_SKILL_TREE: FormSkillLevel[] = [
  // === SD_Standard ===
  {
    formId: 'SD_Standard', level: 1,
    choiceA: { label: 'Bullet Speed +20%', effect: { type: 'stat_multiply', stat: 'bulletSpeed', value: 1.2 } },
    choiceB: { label: 'Bullet Size +30%', effect: { type: 'stat_multiply', stat: 'bulletSize', value: 1.3 } },
  },
  {
    formId: 'SD_Standard', level: 2,
    choiceA: { label: 'Fire Rate +15%', effect: { type: 'stat_multiply', stat: 'fireRate', value: 1.15 } },
    choiceB: { label: 'Damage +20%', effect: { type: 'stat_multiply', stat: 'damage', value: 1.2 } },
  },
  {
    formId: 'SD_Standard', level: 3,
    choiceA: { label: 'Double Shot', effect: { type: 'passive', id: 'double_shot' } },
    choiceB: { label: 'Pierce', effect: { type: 'passive', id: 'pierce' } },
  },
  // === SD_HeavyArtillery ===
  {
    formId: 'SD_HeavyArtillery', level: 1,
    choiceA: { label: 'AoE Range +40%', effect: { type: 'stat_multiply', stat: 'aoeRadius', value: 1.4 } },
    choiceB: { label: 'Explosion DMG +30%', effect: { type: 'stat_multiply', stat: 'damage', value: 1.3 } },
  },
  {
    formId: 'SD_HeavyArtillery', level: 2,
    choiceA: { label: 'Armor (-20% DMG taken)', effect: { type: 'passive', id: 'armor' } },
    choiceB: { label: 'Bullet Speed +25%', effect: { type: 'stat_multiply', stat: 'bulletSpeed', value: 1.25 } },
  },
  {
    formId: 'SD_HeavyArtillery', level: 3,
    choiceA: { label: 'Slow on Hit', effect: { type: 'passive', id: 'slow_on_hit' } },
    choiceB: { label: 'Double Explosion', effect: { type: 'passive', id: 'double_explosion' } },
  },
  // === SD_HighSpeed ===
  {
    formId: 'SD_HighSpeed', level: 1,
    choiceA: { label: 'Move Speed +20%', effect: { type: 'stat_multiply', stat: 'moveSpeed', value: 1.2 } },
    choiceB: { label: 'Graze Range +', effect: { type: 'passive', id: 'graze_expand' } },
  },
  {
    formId: 'SD_HighSpeed', level: 2,
    choiceA: { label: 'Pierce +1', effect: { type: 'stat_add', stat: 'pierceCount', value: 1 } },
    choiceB: { label: 'Fire Rate +20%', effect: { type: 'stat_multiply', stat: 'fireRate', value: 1.2 } },
  },
  {
    formId: 'SD_HighSpeed', level: 3,
    choiceA: { label: 'Afterimage Shots', effect: { type: 'passive', id: 'afterimage' } },
    choiceB: { label: 'Speed ATK Bonus', effect: { type: 'passive', id: 'speed_atk_bonus' } },
  },
  // === SD_Sniper ===
  {
    formId: 'SD_Sniper', level: 1,
    choiceA: { label: 'Bullet Speed +30%', effect: { type: 'stat_multiply', stat: 'bulletSpeed', value: 1.3 } },
    choiceB: { label: 'Critical 15%', effect: { type: 'passive', id: 'critical_chance' } },
  },
  {
    formId: 'SD_Sniper', level: 2,
    choiceA: { label: 'Double Shot', effect: { type: 'passive', id: 'double_shot' } },
    choiceB: { label: 'Pierce + Shield Ignore', effect: { type: 'passive', id: 'pierce' } },
  },
  {
    formId: 'SD_Sniper', level: 3,
    choiceA: { label: 'Auto Charge', effect: { type: 'passive', id: 'auto_charge' } },
    choiceB: { label: 'XP on Crit x2', effect: { type: 'passive', id: 'xp_on_crit' } },
  },
  // === SD_Scatter ===
  {
    formId: 'SD_Scatter', level: 1,
    choiceA: { label: 'Bullet Count +2', effect: { type: 'stat_add', stat: 'bulletCount', value: 2 } },
    choiceB: { label: 'Tighter Spread', effect: { type: 'stat_multiply', stat: 'bulletSize', value: 1.3 } },
  },
  {
    formId: 'SD_Scatter', level: 2,
    choiceA: { label: 'Close Range +40%', effect: { type: 'stat_multiply', stat: 'damage', value: 1.4 } },
    choiceB: { label: 'Weak Homing', effect: { type: 'passive', id: 'weak_homing' } },
  },
  {
    formId: 'SD_Scatter', level: 3,
    choiceA: { label: 'Omnidirectional', effect: { type: 'passive', id: 'omnidirectional' } },
    choiceB: { label: 'Heal on Hit', effect: { type: 'passive', id: 'heal_on_hit' } },
  },
  // === SD_Guardian ===
  {
    formId: 'SD_Guardian', level: 1,
    choiceA: { label: 'HP Regen', effect: { type: 'passive', id: 'hp_regen' } },
    choiceB: { label: 'DMG Reduce +10%', effect: { type: 'stat_multiply', stat: 'damageReduce', value: 1.1 } },
  },
  {
    formId: 'SD_Guardian', level: 2,
    choiceA: { label: 'Counter Shot', effect: { type: 'passive', id: 'counter_shot' } },
    choiceB: { label: 'Shield', effect: { type: 'passive', id: 'shield' } },
  },
  {
    formId: 'SD_Guardian', level: 3,
    choiceA: { label: 'Ally Bullet Speed +20%', effect: { type: 'stat_multiply', stat: 'bulletSpeed', value: 1.2 } },
    choiceB: { label: 'EX on Hit', effect: { type: 'passive', id: 'ex_on_hit' } },
  },
];

export function getFormSkillTree(formId: string): FormSkillLevel[] {
  return FORM_SKILL_TREE.filter(s => s.formId === formId);
}

export function getFormSkillLevel(formId: string, level: number): FormSkillLevel | undefined {
  return FORM_SKILL_TREE.find(s => s.formId === formId && s.level === level);
}
