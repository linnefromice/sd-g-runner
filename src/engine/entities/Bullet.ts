import type { BulletEntity } from '@/types/entities';
import { HITBOX } from '@/constants/dimensions';
import { PLAYER_BULLET_SPEED, ENEMY_BULLET_SPEED } from '@/constants/balance';

let nextId = 0;

export function createPlayerBullet(
  x: number,
  y: number,
  damage: number,
  config?: { width?: number; height?: number; speed?: number }
): BulletEntity {
  return {
    id: `pb_${nextId++}`,
    type: 'playerBullet',
    x: x - (config?.width ?? HITBOX.playerBullet.width) / 2,
    y,
    width: config?.width ?? HITBOX.playerBullet.width,
    height: config?.height ?? HITBOX.playerBullet.height,
    active: true,
    damage,
    speed: config?.speed ?? PLAYER_BULLET_SPEED,
  };
}

export function createEnemyBullet(
  x: number,
  y: number,
  damage: number,
  speed?: number
): BulletEntity {
  return {
    id: `eb_${nextId++}`,
    type: 'enemyBullet',
    x: x - HITBOX.enemyBullet.width / 2,
    y,
    width: HITBOX.enemyBullet.width,
    height: HITBOX.enemyBullet.height,
    active: true,
    damage,
    speed: speed ?? ENEMY_BULLET_SPEED,
  };
}

export function deactivateBullet(bullet: BulletEntity): void {
  bullet.active = false;
  bullet.x = -100;
  bullet.y = -100;
}
