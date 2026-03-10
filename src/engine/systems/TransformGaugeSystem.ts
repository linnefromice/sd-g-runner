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

  // Resolve form skills for passive checks
  const formXPState = store.formXP[store.currentForm];
  if (formXPState) {
    const skills = resolveFormSkills(store.currentForm, formXPState.skills);
    // Passive: hp_regen — recover 1 HP per second
    if (skills.passives.has('hp_regen') && store.hp < store.maxHp) {
      store.heal(time.delta / 1000);
    }
    // Passive: shield — regenerate shield after cooldown
    if (skills.passives.has('shield')) {
      if (store.shieldHp <= 0) {
        if (entities.shieldRegenTimer > 0) {
          entities.shieldRegenTimer = Math.max(0, entities.shieldRegenTimer - time.delta);
        }
        if (entities.shieldRegenTimer <= 0) {
          store.setShieldHp(1);
        }
      }
    }
  }

  if (store.isAwakened) return;
  store.addTransformGauge(TRANSFORM_GAIN_PER_SECOND * time.delta / 1000);
};
