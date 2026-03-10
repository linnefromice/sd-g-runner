import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { DifficultyParams } from '@/types/stages';
import { ENEMY_STATS, ENEMY_BULLET_SPEED, BASE_SCROLL_SPEED, RUSH_SPEED, PATROL_SPEED, PHALANX_SPEED, JUGGERNAUT_SCROLL_FACTOR, DODGER_DETECT_RADIUS, DODGER_SPEED, DODGER_COOLDOWN, SUMMONER_INTERVAL, SUMMONER_MAX_SPAWNS, CARRIER_SPAWN_INTERVAL, CARRIER_SPAWN_COUNT, SLOW_ON_HIT_FACTOR } from '@/constants/balance';
import { createEnemyBullet } from '@/engine/entities/Bullet';
import { createEnemy } from '@/engine/entities/Enemy';
import { acquireFromPool } from '@/engine/pool';

/** Spread shot half-angle in radians (~15 degrees) */
const SPREAD_HALF_ANGLE = Math.PI / 12;

/** Sine-wave bullet amplitude for stationary enemies (logical units) */
const WAVE_BULLET_AMPLITUDE = 60;

export function createEnemyAISystem(difficulty: DifficultyParams): GameSystem<GameEntities> {
  const bulletSpeedMul = difficulty.bulletSpeedMultiplier;
  const atkIntervalMul = difficulty.attackIntervalMultiplier;

  return (entities, { time }) => {
    const dt = time.delta / 1000;
    const player = entities.player;

    for (const enemy of entities.enemies) {
      if (!enemy.active) continue;

      // Tick flash timer
      if (enemy.flashTimer > 0) enemy.flashTimer = Math.max(0, enemy.flashTimer - time.delta);
      // Tick slow debuff timer
      if (enemy.slowTimer != null && enemy.slowTimer > 0) {
        enemy.slowTimer = Math.max(0, enemy.slowTimer - time.delta);
      }
      const slowMul = (enemy.slowTimer ?? 0) > 0 ? SLOW_ON_HIT_FACTOR : 1;

      const stats = ENEMY_STATS[enemy.enemyType];

      // Movement
      switch (enemy.enemyType) {
        case 'rush': {
          // Fast descent toward player's X position + contact damage
          enemy.y += RUSH_SPEED * slowMul * dt;
          if (player.active) {
            const targetX = player.x + player.width / 2 - enemy.width / 2;
            const dx = targetX - enemy.x;
            enemy.x += Math.sign(dx) * Math.min(Math.abs(dx), RUSH_SPEED * 0.5 * slowMul * dt);
          }
          break;
        }
        case 'patrol': {
          enemy.x += enemy.moveDirection * PATROL_SPEED * slowMul * dt;
          if (enemy.x < 16 || enemy.x + enemy.width > 304) {
            enemy.moveDirection *= -1;
          }
          break;
        }
        case 'swarm': {
          enemy.y += BASE_SCROLL_SPEED * slowMul * dt;
          enemy.x += Math.cos(enemy.moveTimer * 3) * 40 * slowMul * dt;
          enemy.moveTimer += dt;
          break;
        }
        case 'phalanx': {
          enemy.x += enemy.moveDirection * PHALANX_SPEED * slowMul * dt;
          if (enemy.x < 16 || enemy.x + enemy.width > 304) {
            enemy.moveDirection *= -1;
          }
          break;
        }
        case 'juggernaut': {
          enemy.y += BASE_SCROLL_SPEED * JUGGERNAUT_SCROLL_FACTOR * slowMul * dt;
          enemy.x += Math.sin(enemy.moveTimer * 1.5) * 20 * slowMul * dt;
          enemy.moveTimer += dt;
          break;
        }
        case 'dodger': {
          // Detect incoming player bullets and dodge sideways
          if (enemy.moveTimer <= 0) {
            for (const b of entities.playerBullets) {
              if (!b.active) continue;
              const dx = (b.x + b.width / 2) - (enemy.x + enemy.width / 2);
              const dy = (b.y + b.height / 2) - (enemy.y + enemy.height / 2);
              if (Math.abs(dx) < DODGER_DETECT_RADIUS && dy > 0 && dy < DODGER_DETECT_RADIUS * 2) {
                enemy.moveDirection = dx > 0 ? -1 : 1;
                enemy.x += enemy.moveDirection * DODGER_SPEED * dt;
                enemy.moveTimer = DODGER_COOLDOWN;
                break;
              }
            }
          } else {
            enemy.moveTimer -= dt;
          }
          if (enemy.x < 16) enemy.x = 16;
          if (enemy.x + enemy.width > 304) enemy.x = 304 - enemy.width;
          break;
        }
        case 'summoner': {
          // Static position, summon swarms periodically
          enemy.shootTimer += dt;
          if (enemy.shootTimer >= SUMMONER_INTERVAL) {
            enemy.shootTimer = 0;
            let swarmCount = 0;
            for (const e of entities.enemies) {
              if (e.active && e.enemyType === 'swarm') swarmCount++;
            }
            if (swarmCount < SUMMONER_MAX_SPAWNS) {
              for (let i = 0; i < 2; i++) {
                const spawnX = enemy.x + enemy.width / 2 + (i === 0 ? -20 : 20);
                const sw = createEnemy('swarm', spawnX, enemy.y + enemy.height, 1.0);
                sw.spawnTime = entities.stageTime;
                acquireFromPool(entities.enemies, sw);
              }
            }
          }
          break;
        }
        case 'sentinel': {
          // Static — no movement, turret-style
          break;
        }
        case 'carrier': {
          // Slow descent + patrol + spawn patrol enemies
          enemy.y += BASE_SCROLL_SPEED * 0.5 * slowMul * dt;
          enemy.x += enemy.moveDirection * PATROL_SPEED * 0.6 * slowMul * dt;
          if (enemy.x < 16 || enemy.x + enemy.width > 304) {
            enemy.moveDirection *= -1;
          }
          enemy.shootTimer += dt;
          if (enemy.shootTimer >= CARRIER_SPAWN_INTERVAL) {
            enemy.shootTimer = 0;
            for (let i = 0; i < CARRIER_SPAWN_COUNT; i++) {
              const spawnX = enemy.x + enemy.width / 2 + (i === 0 ? -25 : 25);
              const p = createEnemy('patrol', spawnX, enemy.y + enemy.height, 1.0);
              p.spawnTime = entities.stageTime;
              acquireFromPool(entities.enemies, p);
            }
          }
          break;
        }
        default:
          break;
      }

      // Shooting
      if (stats.attackInterval <= 0) continue;

      enemy.shootTimer += dt;
      const adjustedInterval = stats.attackInterval * atkIntervalMul;
      if (enemy.shootTimer >= adjustedInterval) {
        enemy.shootTimer = 0;

        const fireX = enemy.x + enemy.width / 2;
        const fireY = enemy.y + enemy.height;
        const baseSpeed = ENEMY_BULLET_SPEED * bulletSpeedMul;

        switch (enemy.enemyType) {
          case 'patrol': {
            // Aimed shot: bullet directed toward player
            if (player.active) {
              const dx = (player.x + player.width / 2) - fireX;
              const dy = (player.y + player.height / 2) - fireY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 0) {
                const vx = (dx / dist) * baseSpeed;
                const vy = (dy / dist) * baseSpeed;
                const bullet = createEnemyBullet(fireX, fireY, stats.attackDamage, { speed: baseSpeed, vx, vy });
                acquireFromPool(entities.enemyBullets, bullet);
              }
            } else {
              const bullet = createEnemyBullet(fireX, fireY, stats.attackDamage, { speed: baseSpeed });
              acquireFromPool(entities.enemyBullets, bullet);
            }
            break;
          }
          case 'phalanx': {
            // 3-way spread shot
            for (let i = -1; i <= 1; i++) {
              const angle = Math.PI / 2 + i * SPREAD_HALF_ANGLE;
              const vx = Math.cos(angle) * baseSpeed;
              const vy = Math.sin(angle) * baseSpeed;
              const bullet = createEnemyBullet(fireX, fireY, stats.attackDamage, { speed: baseSpeed, vx, vy });
              acquireFromPool(entities.enemyBullets, bullet);
            }
            break;
          }
          case 'juggernaut': {
            // 3-turret sequential firing + speed scaling
            const offsets = [0.2, 0.5, 0.8];
            const turretPhase = Math.floor(enemy.moveTimer / adjustedInterval) % 3;
            const turretX = enemy.x + enemy.width * offsets[turretPhase];
            const bullet = createEnemyBullet(turretX, fireY, stats.attackDamage, { speed: baseSpeed });
            acquireFromPool(entities.enemyBullets, bullet);
            break;
          }
          case 'stationary': {
            // Sine-wave bullet: oscillates horizontally as it falls
            const bullet = createEnemyBullet(fireX, fireY, stats.attackDamage, {
              speed: baseSpeed,
              waveAmplitude: WAVE_BULLET_AMPLITUDE,
            });
            acquireFromPool(entities.enemyBullets, bullet);
            break;
          }
          case 'dodger': {
            if (player.active) {
              const dx = (player.x + player.width / 2) - fireX;
              const dy = (player.y + player.height / 2) - fireY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 0) {
                const vx = (dx / dist) * baseSpeed;
                const vy = (dy / dist) * baseSpeed;
                const bullet = createEnemyBullet(fireX, fireY, stats.attackDamage, { speed: baseSpeed, vx, vy });
                acquireFromPool(entities.enemyBullets, bullet);
              }
            }
            break;
          }
          case 'sentinel': {
            // 3-direction spread: center + left 30° + right 30°
            const spreadAngle = Math.PI / 6;
            for (let i = -1; i <= 1; i++) {
              const angle = Math.PI / 2 + i * spreadAngle;
              const vx = Math.cos(angle) * baseSpeed;
              const vy = Math.sin(angle) * baseSpeed;
              const bullet = createEnemyBullet(fireX, fireY, stats.attackDamage, { speed: baseSpeed, vx, vy });
              acquireFromPool(entities.enemyBullets, bullet);
            }
            break;
          }
          default: {
            const bullet = createEnemyBullet(fireX, fireY, stats.attackDamage, { speed: baseSpeed });
            acquireFromPool(entities.enemyBullets, bullet);
            break;
          }
        }
      }
    }
  };
}
