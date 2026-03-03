import type { EnemyEntity } from '@/types/entities';
import type { EnemyType } from '@/types/enemies';
import { HITBOX } from '@/constants/dimensions';
import { ENEMY_STATS } from '@/constants/balance';

let nextId = 0;

export function createEnemy(
  enemyType: EnemyType,
  x: number,
  y: number,
  hpMultiplier: number = 1.0
): EnemyEntity {
  const stats = ENEMY_STATS[enemyType];
  return {
    id: `enemy_${nextId++}`,
    type: 'enemy',
    enemyType,
    x: x - HITBOX.enemy.width / 2,
    y,
    width: HITBOX.enemy.width,
    height: HITBOX.enemy.height,
    active: true,
    hp: Math.round(stats.hp * hpMultiplier),
    maxHp: Math.round(stats.hp * hpMultiplier),
    shootTimer: 0,
    moveTimer: 0,
    moveDirection: 1,
  };
}

export function deactivateEnemy(enemy: EnemyEntity): void {
  enemy.active = false;
  enemy.x = -100;
  enemy.y = -100;
}
