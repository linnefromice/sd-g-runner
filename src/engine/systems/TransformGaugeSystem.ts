import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { resolveFormSkills } from '@/engine/formSkillResolver';
import { TRANSFORM_GAIN_PER_SECOND } from '@/constants/balance';

export const transformGaugeSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const store = useGameSessionStore.getState();

  // Count down parry timers
  if (entities.justTFTimer > 0) {
    entities.justTFTimer = Math.max(0, entities.justTFTimer - time.delta);
  }
  if (entities.shockwaveTimer > 0) {
    entities.shockwaveTimer = Math.max(0, entities.shockwaveTimer - time.delta);
  }

  // Count down transform buff timer
  if (entities.transformBuffTimer > 0) {
    entities.transformBuffTimer = Math.max(0, entities.transformBuffTimer - time.delta);
    if (entities.transformBuffTimer <= 0) {
      store.deactivateTransformBuff();
    }
  }

  // Passive: hp_regen — recover 1 HP per second
  const formXPState = store.formXP[store.currentForm];
  if (formXPState) {
    const skills = resolveFormSkills(store.currentForm, formXPState.skills);
    if (skills.passives.has('hp_regen') && store.hp < store.maxHp) {
      store.heal(time.delta / 1000);
    }
  }

  if (store.isAwakened) return;
  store.addTransformGauge(TRANSFORM_GAIN_PER_SECOND * time.delta / 1000);
};
