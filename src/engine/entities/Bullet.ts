import type { BulletEntity } from '@/types/entities';
import type { SpecialAbilityType } from '@/types/forms';
import { HITBOX } from '@/constants/dimensions';
import { PLAYER_BULLET_SPEED, ENEMY_BULLET_SPEED } from '@/constants/balance';

let nextId = 0;

export function createPlayerBullet(
  x: number,
  y: number,
  damage: number,
  config?: { width?: number; height?: number; speed?: number; homing?: boolean; specialAbility?: SpecialAbilityType; isCritical?: boolean; vx?: number; vy?: number }
): BulletEntity {
  const ability = config?.specialAbility ?? 'none';
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
    homing: config?.homing ?? false,
    specialAbility: ability,
    ...(ability === 'pierce' ? { piercedEnemyIds: new Set<string>() } : {}),
    ...(config?.isCritical ? { isCritical: true } : {}),
    ...(config?.vx != null ? { vx: config.vx } : {}),
    ...(config?.vy != null ? { vy: config.vy } : {}),
  };
}

export function createEnemyBullet(
  x: number,
  y: number,
  damage: number,
  config?: { speed?: number; vx?: number; vy?: number; waveAmplitude?: number; homing?: boolean }
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
    speed: config?.speed ?? ENEMY_BULLET_SPEED,
    homing: config?.homing ?? false,
    vx: config?.vx,
    vy: config?.vy,
    waveAmplitude: config?.waveAmplitude,
  };
}

export function deactivateBullet(bullet: BulletEntity): void {
  bullet.active = false;
  bullet.x = -100;
  bullet.y = -100;
  bullet.grazed = false;
}
