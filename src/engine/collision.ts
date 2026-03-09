import { HITBOX } from '@/constants/dimensions';

type Box = { x: number; y: number; width: number; height: number };

/** Get center coordinates of an entity */
export function getCenter(e: Box): { x: number; y: number } {
  return { x: e.x + e.width / 2, y: e.y + e.height / 2 };
}

/** Euclidean distance between two points */
export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

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

/**
 * Get the player's visual hitbox (full sprite bounds).
 * Used for graze detection — near-miss zone between visual and actual hitbox.
 */
export function getPlayerVisualHitbox(player: { x: number; y: number; width: number; height: number }) {
  const hb = HITBOX.playerVisual;
  return {
    x: player.x + (player.width - hb.width) / 2,
    y: player.y + (player.height - hb.height) / 2,
    width: hb.width,
    height: hb.height,
  };
}

/** Expand a hitbox by px pixels on all sides */
export function expandHitbox(
  hb: { x: number; y: number; width: number; height: number },
  px: number,
): { x: number; y: number; width: number; height: number } {
  return {
    x: hb.x - px,
    y: hb.y - px,
    width: hb.width + px * 2,
    height: hb.height + px * 2,
  };
}
