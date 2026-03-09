import type { DebrisEntity } from '@/types/entities';
import { HITBOX } from '@/constants/dimensions';
import { DEBRIS_HP } from '@/constants/balance';

let nextId = 0;

export function createDebris(x: number, y: number): DebrisEntity {
  return {
    id: `debris_${nextId++}`,
    type: 'debris',
    x,
    y,
    width: HITBOX.debris.width,
    height: HITBOX.debris.height,
    active: true,
    hp: DEBRIS_HP,
    maxHp: DEBRIS_HP,
    spawnTime: 0,
  };
}

export function deactivateDebris(debris: DebrisEntity): void {
  debris.active = false;
  debris.x = -100;
  debris.y = -100;
}
