import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';

export const screenShakeSystem: GameSystem<GameEntities> = (entities, { time }) => {
  if (entities.shakeTimer <= 0) {
    entities.shakeOffsetX = 0;
    entities.shakeOffsetY = 0;
    return;
  }

  entities.shakeTimer = Math.max(0, entities.shakeTimer - time.delta);

  // Random offset scaled by intensity
  const intensity = entities.shakeIntensity;
  entities.shakeOffsetX = (Math.random() * 2 - 1) * intensity;
  entities.shakeOffsetY = (Math.random() * 2 - 1) * intensity;

  if (entities.shakeTimer <= 0) {
    entities.shakeOffsetX = 0;
    entities.shakeOffsetY = 0;
    entities.shakeIntensity = 0;
  }
};
