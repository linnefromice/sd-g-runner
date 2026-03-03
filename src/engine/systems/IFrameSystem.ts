import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';

export const iframeSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const player = entities.player;
  if (!player.isInvincible) return;

  player.invincibleTimer -= time.delta;
  if (player.invincibleTimer <= 0) {
    player.isInvincible = false;
    player.invincibleTimer = 0;
  }
};
