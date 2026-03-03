import type { PlayerEntity } from '@/types/entities';
import { HITBOX } from '@/constants/dimensions';

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
  };
}
