import type { MechaFormId } from '@/types/forms';
import type { FormSkillChoice, FormSkillPassiveId } from '@/types/formSkills';
import { getFormSkillLevel } from '@/game/formSkills';

export interface ResolvedFormStats {
  bulletSpeedMul: number;
  bulletSizeMul: number;
  fireRateMul: number;
  damageMul: number;
  moveSpeedMul: number;
  aoeRadiusMul: number;
  bulletCountAdd: number;
  pierceCountAdd: number;
  passives: Set<FormSkillPassiveId>;
}

export function resolveFormSkills(formId: MechaFormId, skills: FormSkillChoice[]): ResolvedFormStats {
  const result: ResolvedFormStats = {
    bulletSpeedMul: 1,
    bulletSizeMul: 1,
    fireRateMul: 1,
    damageMul: 1,
    moveSpeedMul: 1,
    aoeRadiusMul: 1,
    bulletCountAdd: 0,
    pierceCountAdd: 0,
    passives: new Set(),
  };

  for (const skill of skills) {
    const def = getFormSkillLevel(formId, skill.level);
    if (!def) continue;
    const option = skill.choice === 'A' ? def.choiceA : def.choiceB;
    const effect = option.effect;

    switch (effect.type) {
      case 'stat_multiply':
        switch (effect.stat) {
          case 'bulletSpeed': result.bulletSpeedMul *= effect.value; break;
          case 'bulletSize': result.bulletSizeMul *= effect.value; break;
          case 'fireRate': result.fireRateMul *= effect.value; break;
          case 'damage': result.damageMul *= effect.value; break;
          case 'moveSpeed': result.moveSpeedMul *= effect.value; break;
          case 'aoeRadius': result.aoeRadiusMul *= effect.value; break;
        }
        break;
      case 'stat_add':
        switch (effect.stat) {
          case 'bulletCount': result.bulletCountAdd += effect.value; break;
          case 'pierceCount': result.pierceCountAdd += effect.value; break;
        }
        break;
      case 'passive':
        result.passives.add(effect.id);
        break;
    }
  }

  return result;
}
