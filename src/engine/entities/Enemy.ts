import type { EnemyEntity } from '@/types/entities';
import type { EnemyType } from '@/types/enemies';
import { HITBOX } from '@/constants/dimensions';
import { ENEMY_STATS } from '@/constants/balance';

let nextId = 0;

function getEnemyHitbox(enemyType: EnemyType) {
  switch (enemyType) {
    case 'swarm':      return HITBOX.swarm;
    case 'phalanx':    return HITBOX.phalanx;
    case 'juggernaut': return HITBOX.juggernaut;
    case 'dodger':     return HITBOX.dodger;
    case 'splitter':   return HITBOX.splitter;
    case 'summoner':   return HITBOX.summoner;
    case 'sentinel':   return HITBOX.sentinel;
    case 'carrier':    return HITBOX.carrier;
    default:           return HITBOX.enemy;
  }
}

export function createEnemy(
  enemyType: EnemyType,
  x: number,
  y: number,
  hpMultiplier: number = 1.0
): EnemyEntity {
  const stats = ENEMY_STATS[enemyType];
  const hitbox = getEnemyHitbox(enemyType);
  return {
    id: `enemy_${nextId++}`,
    type: 'enemy',
    enemyType,
    x: x - hitbox.width / 2,
    y,
    width: hitbox.width,
    height: hitbox.height,
    active: true,
    hp: Math.round(stats.hp * hpMultiplier),
    maxHp: Math.round(stats.hp * hpMultiplier),
    shootTimer: 0,
    moveTimer: 0,
    moveDirection: 1,
    flashTimer: 0,
    spawnTime: 0,
  };
}

export function deactivateEnemy(enemy: EnemyEntity): void {
  enemy.active = false;
  enemy.x = -100;
  enemy.y = -100;
}
