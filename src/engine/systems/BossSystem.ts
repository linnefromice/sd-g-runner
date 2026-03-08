import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import {
  BOSS_HOVER_AMPLITUDE,
  BOSS_HOVER_PERIOD,
  BOSS_Y_POSITION,
  BOSS_SPREAD_COUNT,
  BOSS_DRONE_COUNT,
  BOSS_DRONE_COUNTS,
  BOSS_LASER_WARNING_DURATION,
  BOSS_LASER_FIRE_DURATION,
  BOSS_LASER_WIDTH,
  BOSS_LASER_DAMAGE,
  BOSS_LASER_TICK_INTERVAL,
  BOSS_LASER_COOLDOWN,
  IFRAME_DURATION,
} from '@/constants/balance';
import { LOGICAL_WIDTH } from '@/constants/dimensions';
import { createEnemyBullet } from '@/engine/entities/Bullet';
import { createEnemy } from '@/engine/entities/Enemy';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { onPlayerHit } from '@/engine/effects';

export function createBossSystem(): GameSystem<GameEntities> {
  let laserCooldown = 0;
  let useSpread = true;

  function updateLaser(entities: GameEntities, dtMs: number) {
    const boss = entities.boss!;
    switch (boss.laserState) {
      case 'idle': {
        laserCooldown += dtMs;
        if (laserCooldown >= BOSS_LASER_COOLDOWN && !useSpread) {
          boss.laserState = 'warning';
          boss.laserTimer = BOSS_LASER_WARNING_DURATION;
          boss.laserX = boss.x + boss.width / 2;
          boss.laserTickTimer = 0;
          laserCooldown = 0;
          useSpread = true;
        }
        break;
      }
      case 'warning': {
        boss.laserTimer -= dtMs;
        if (boss.laserTimer <= 0) {
          boss.laserState = 'firing';
          boss.laserTimer = BOSS_LASER_FIRE_DURATION;
          boss.laserTickTimer = 0;
        }
        break;
      }
      case 'firing': {
        boss.laserTimer -= dtMs;
        boss.laserTickTimer += dtMs;

        if (boss.laserTickTimer >= BOSS_LASER_TICK_INTERVAL) {
          boss.laserTickTimer -= BOSS_LASER_TICK_INTERVAL;
          const player = entities.player;
          if (player.active && !player.isInvincible) {
            const playerCenterX = player.x + player.width / 2;
            if (Math.abs(playerCenterX - boss.laserX) <= BOSS_LASER_WIDTH / 2) {
              applyLaserDamage(entities, player, BOSS_LASER_DAMAGE);
            }
          }
        }

        if (boss.laserTimer <= 0) {
          boss.laserState = 'idle';
        }
        break;
      }
    }
  }

  return (entities, { time }) => {
    const boss = entities.boss;
    if (!boss || !boss.active) return;

    const dt = time.delta / 1000;
    const dtMs = time.delta;

    // Slide in from top
    if (boss.y < BOSS_Y_POSITION) {
      boss.y += 30 * dt;
      if (boss.y > BOSS_Y_POSITION) boss.y = BOSS_Y_POSITION;
      return;
    }

    // Hover left-right
    boss.hoverTimer += time.delta;
    const hoverPhase = (boss.hoverTimer / BOSS_HOVER_PERIOD) * Math.PI * 2;
    const centerX = (LOGICAL_WIDTH - boss.width) / 2;
    boss.x = centerX + Math.sin(hoverPhase) * BOSS_HOVER_AMPLITUDE;

    // Laser state machine (active in phase 'laser' or 'all')
    if (boss.phase !== 'spread') {
      updateLaser(entities, dtMs);
    }

    // Spread attack (only when laser is idle)
    if (boss.laserState === 'idle') {
      boss.attackTimer += dt;
      const shouldSpread = boss.phase === 'spread' || useSpread;

      if (shouldSpread && boss.attackTimer >= 2.0) {
        fireSpreadShot(entities, boss);
        boss.attackTimer = 0;
        if (boss.phase !== 'spread') useSpread = false;
      }
    }

    // Drone summon (HP 25%~)
    if (boss.hp / boss.maxHp <= 0.25 && boss.drones.length === 0) {
      spawnDrones(entities, boss);
    }
  };
}

function fireSpreadShot(entities: GameEntities, boss: NonNullable<GameEntities['boss']>) {
  const bCenterX = boss.x + boss.width / 2;
  const startY = boss.y + boss.height;
  for (let i = 0; i < BOSS_SPREAD_COUNT; i++) {
    const slot = entities.enemyBullets.find((b) => !b.active);
    if (!slot) break;
    const angle = ((i - Math.floor(BOSS_SPREAD_COUNT / 2)) * 15 * Math.PI) / 180;
    const bullet = createEnemyBullet(bCenterX + Math.sin(angle) * 20, startY, 15);
    Object.assign(slot, bullet);
    slot.active = true;
  }
}

function applyLaserDamage(
  entities: GameEntities,
  player: GameEntities['player'],
  damage: number,
) {
  const store = useGameSessionStore.getState();
  store.takeDamage(damage);
  player.isInvincible = true;
  player.invincibleTimer = IFRAME_DURATION;
  store.resetCombo();
  onPlayerHit(entities, player.x + player.width / 2, player.y + player.height / 2);
}

function spawnDrones(entities: GameEntities, boss: NonNullable<GameEntities['boss']>) {
  const droneCount = BOSS_DRONE_COUNTS[boss.bossIndex as keyof typeof BOSS_DRONE_COUNTS] ?? BOSS_DRONE_COUNT;
  for (let i = 0; i < droneCount; i++) {
    const slot = entities.enemies.find((e) => !e.active);
    if (!slot) break;
    const x = boss.x + (i + 1) * (boss.width / (droneCount + 1));
    const drone = createEnemy('stationary', x, boss.y + boss.height + 20, 0.5);
    Object.assign(slot, drone);
    slot.active = true;
    boss.drones.push(drone.id);
  }
}
