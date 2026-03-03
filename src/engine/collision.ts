import { HITBOX } from '@/constants/dimensions';

/** AABB overlap check between two entities */
export function checkAABBOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Get the player's hitbox (centered, smaller than visual).
 * Visual: 32×40, Hitbox: 16×16 (§3.2)
 */
export function getPlayerHitbox(player: { x: number; y: number; width: number; height: number }) {
  const hb = HITBOX.player;
  return {
    x: player.x + (player.width - hb.width) / 2,
    y: player.y + (player.height - hb.height) / 2,
    width: hb.width,
    height: hb.height,
  };
}
