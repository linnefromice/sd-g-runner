import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { BASE_SCROLL_SPEED } from '@/constants/balance';

export const scrollSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const dt = time.delta / 1000;
  const speed = BASE_SCROLL_SPEED * entities.screen.scale;
  const multiplier = entities.isBossPhase ? 0.5 : 1.0;

  // Advance stage time
  entities.stageTime += dt;

  // Update scroll offset (wrapping for seamless background)
  entities.scrollY += speed * multiplier * dt;
};
