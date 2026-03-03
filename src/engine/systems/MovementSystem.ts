import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import {
  PLAYER_MIN_X,
  PLAYER_MAX_X,
  PLAYER_Y_TOP_RATIO,
  PLAYER_Y_BOTTOM_MARGIN,
} from '@/constants/dimensions';
import { deactivateBullet } from '@/engine/entities/Bullet';
import { deactivateEnemy } from '@/engine/entities/Enemy';

/** Logical scroll speed (units/sec at 1.0x) — used for entity movement */
const BASE_SCROLL_SPEED_LOGICAL = 60;

export const movementSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const dt = time.delta / 1000;
  const { visibleHeight } = entities.screen;

  // Clamp player position to allowed bounds (§3.1)
  const p = entities.player;
  const minY = visibleHeight * PLAYER_Y_TOP_RATIO;
  const maxY = visibleHeight - PLAYER_Y_BOTTOM_MARGIN;
  p.x = Math.max(PLAYER_MIN_X, Math.min(PLAYER_MAX_X - p.width, p.x));
  p.y = Math.max(minY, Math.min(maxY - p.height, p.y));

  // Move player bullets upward
  for (const b of entities.playerBullets) {
    if (!b.active) continue;
    b.y -= b.speed * dt;
    if (b.y + b.height < 0) deactivateBullet(b);
  }

  // Move enemy bullets downward
  for (const b of entities.enemyBullets) {
    if (!b.active) continue;
    b.y += b.speed * dt;
    if (b.y > visibleHeight) deactivateBullet(b);
  }

  // Move enemies (scroll down + deactivate off-screen)
  for (const e of entities.enemies) {
    if (!e.active) continue;
    e.y += BASE_SCROLL_SPEED_LOGICAL * dt;
    if (e.y > visibleHeight + 50) {
      deactivateEnemy(e);
    }
  }

  // Move gates downward
  for (const g of entities.gates) {
    if (!g.active) continue;
    g.y += BASE_SCROLL_SPEED_LOGICAL * dt;
    if (g.y > visibleHeight + 50) {
      g.active = false;
    }
  }
};
