import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { TRANSFORM_GAIN_PER_SECOND } from '@/constants/balance';

export const transformGaugeSystem: GameSystem<GameEntities> = (_entities, { time }) => {
  const store = useGameSessionStore.getState();
  if (store.isAwakened) return;
  store.addTransformGauge(TRANSFORM_GAIN_PER_SECOND * time.delta / 1000);
};
