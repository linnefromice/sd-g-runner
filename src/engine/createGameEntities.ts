import type { GameEntities, EnemyEntity, BulletEntity, GateEntity, DebrisEntity, ParticleEntity, ScorePopupEntity } from '@/types/entities';
import { createPlayer } from '@/engine/entities/Player';
import {
  LOGICAL_WIDTH,
  MAX_ENEMIES,
  MAX_PLAYER_BULLETS,
  MAX_ENEMY_BULLETS,
  MAX_GATES,
  MAX_DEBRIS,
  MAX_PARTICLES,
  MAX_SCORE_POPUPS,
  getScreenMetrics,
} from '@/constants/dimensions';

function createInactiveEnemy(): EnemyEntity {
  return {
    id: '', type: 'enemy', enemyType: 'stationary',
    x: -100, y: -100, width: 0, height: 0,
    active: false, hp: 0, maxHp: 0,
    shootTimer: 0, moveTimer: 0, moveDirection: 1, flashTimer: 0, spawnTime: 0,
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
    growthHits: 0,
    growthMax: undefined,
    baseEffectValue: undefined,
    rouletteEffects: undefined,
    rouletteTimer: undefined,
    rouletteIndex: undefined,
  };
}

function createInactiveDebris(): DebrisEntity {
  return {
    id: '', type: 'debris',
    x: -100, y: -100, width: 0, height: 0,
    active: false, hp: 0, maxHp: 0, spawnTime: 0,
  };
}

function createInactiveParticle(): ParticleEntity {
  return {
    x: -100, y: -100, vx: 0, vy: 0,
    life: 0, maxLife: 0, color: '#FFFFFF', size: 4, active: false,
  };
}

function createInactiveScorePopup(): ScorePopupEntity {
  return {
    x: -100, y: -100, vy: 0,
    text: '', life: 0, maxLife: 0, color: '#FFFFFF', active: false,
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
    boostLane: null,
    isPlayerBoosted: false,
    justTFTimer: 0,
    shockwaveTimer: 0,
    awakenedTimer: 0,
    exBurstTimer: 0,
    exBurstTickTimer: 0,
    stageTime: 0,
    stageDuration: 0,
    isBossStage: false,
    timelineIndex: 0,
    isBossPhase: false,
    scrollY: 0,
    screen: { width: screenWidth, height: screenHeight, scale, visibleHeight },
    hitStopTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    shakeOffsetX: 0,
    shakeOffsetY: 0,
    particles: Array.from({ length: MAX_PARTICLES }, createInactiveParticle),
    scorePopups: Array.from({ length: MAX_SCORE_POPUPS }, createInactiveScorePopup),
  };
}
