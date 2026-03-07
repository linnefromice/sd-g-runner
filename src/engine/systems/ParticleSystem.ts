import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';

export const particleSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const dt = time.delta / 1000; // seconds

  for (const p of entities.particles) {
    if (!p.active) continue;

    p.life -= time.delta;
    if (p.life <= 0) {
      p.active = false;
      p.x = -100;
      p.y = -100;
      continue;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  for (const popup of entities.scorePopups) {
    if (!popup.active) continue;

    popup.life -= time.delta;
    if (popup.life <= 0) {
      popup.active = false;
      popup.x = -100;
      popup.y = -100;
      continue;
    }

    popup.y += popup.vy * dt;
  }
};
