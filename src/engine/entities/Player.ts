import type { PlayerEntity } from '@/types/entities';
import { HITBOX } from '@/constants/dimensions';
import { TRAIL_HISTORY_SIZE } from '@/constants/balance';

let nextId = 0;

export function createPlayer(x: number, y: number): PlayerEntity {
  return {
    id: `player_${nextId++}`,
    type: 'player',
    x,
    y,
    width: HITBOX.playerVisual.width,
    height: HITBOX.playerVisual.height,
    active: true,
    isInvincible: false,
    invincibleTimer: 0,
    targetX: null,
    targetY: null,
    trailHistory: Array.from({ length: TRAIL_HISTORY_SIZE }, () => ({ x, y })),
    trailIndex: 0,
    trailFrameCount: 0,
  };
}
