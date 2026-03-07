import type { GameEntities, EnemyEntity, BulletEntity, GateEntity, DebrisEntity } from '@/types/entities';
import { createPlayer } from '@/engine/entities/Player';
import {
  LOGICAL_WIDTH,
  MAX_ENEMIES,
  MAX_PLAYER_BULLETS,
  MAX_ENEMY_BULLETS,
  MAX_GATES,
  MAX_DEBRIS,
  getScreenMetrics,
} from '@/constants/dimensions';

function createInactiveEnemy(): EnemyEntity {
  return {
    id: '', type: 'enemy', enemyType: 'stationary',
    x: -100, y: -100, width: 0, height: 0,
    active: false, hp: 0, maxHp: 0,
    shootTimer: 0, moveTimer: 0, moveDirection: 1,
  };
}

function createInactiveBullet(type: 'playerBullet' | 'enemyBullet'): BulletEntity {
  return {
    id: '', type, x: -100, y: -100, width: 0, height: 0,
    active: false, damage: 0, speed: 0, homing: false,
  };
}

function createInactiveGate(): GateEntity {
  return {
    id: '', type: 'gate', gateType: 'enhance',
    x: -100, y: -100, width: 0, height: 0,
    active: false, displayLabel: '', effects: [], passed: false,
  };
}

function createInactiveDebris(): DebrisEntity {
  return {
    id: '', type: 'debris',
    x: -100, y: -100, width: 0, height: 0,
    active: false, hp: 0, maxHp: 0,
  };
}

export function createGameEntities(
  screenWidth: number,
  screenHeight: number
): GameEntities {
  const { scale, visibleHeight } = getScreenMetrics(screenWidth, screenHeight);

  const playerX = LOGICAL_WIDTH / 2 - 16; // center player
  const playerY = visibleHeight * 0.75;

  return {
    player: createPlayer(playerX, playerY),
    enemies: Array.from({ length: MAX_ENEMIES }, createInactiveEnemy),
    playerBullets: Array.from({ length: MAX_PLAYER_BULLETS }, () => createInactiveBullet('playerBullet')),
    enemyBullets: Array.from({ length: MAX_ENEMY_BULLETS }, () => createInactiveBullet('enemyBullet')),
    gates: Array.from({ length: MAX_GATES }, createInactiveGate),
    debris: Array.from({ length: MAX_DEBRIS }, createInactiveDebris),
    boss: null,
    stageTime: 0,
    stageDuration: 0,
    isBossStage: false,
    timelineIndex: 0,
    isBossPhase: false,
    scrollY: 0,
    screen: { width: screenWidth, height: screenHeight, scale, visibleHeight },
  };
}
