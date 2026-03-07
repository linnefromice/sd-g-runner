import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { useGameSessionStore } from '@/stores/gameSessionStore';
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

  if (store.isAwakened) return;
  store.addTransformGauge(TRANSFORM_GAIN_PER_SECOND * time.delta / 1000);
};
