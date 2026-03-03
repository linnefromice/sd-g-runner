import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { BOSS_HOVER_AMPLITUDE, BOSS_HOVER_PERIOD, BOSS_Y_POSITION, BOSS_SPREAD_COUNT, BOSS_DRONE_COUNT } from '@/constants/balance';
import { LOGICAL_WIDTH } from '@/constants/dimensions';
import { createEnemyBullet } from '@/engine/entities/Bullet';
import { createEnemy } from '@/engine/entities/Enemy';

export const bossSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const boss = entities.boss;
  if (!boss || !boss.active) return;

  const dt = time.delta / 1000;

  // Slide in from top
  if (boss.y < BOSS_Y_POSITION) {
    boss.y += 30 * dt;
    if (boss.y > BOSS_Y_POSITION) boss.y = BOSS_Y_POSITION;
    return; // Don't attack while entering
  }

  // Hover left-right (§13.2: amplitude 30, period 3s)
  boss.hoverTimer += time.delta;
  const hoverPhase = (boss.hoverTimer / BOSS_HOVER_PERIOD) * Math.PI * 2;
  const centerX = (LOGICAL_WIDTH - boss.width) / 2;
  boss.x = centerX + Math.sin(hoverPhase) * BOSS_HOVER_AMPLITUDE;

  // Attack patterns
  boss.attackTimer += dt;

  // Spread shot (HP 100%~): every 2 seconds
  if (boss.attackTimer >= 2.0) {
    fireSpreadShot(entities, boss);
    boss.attackTimer = 0;
  }

  // Laser (HP 50%~): additional attack
  if (boss.hp / boss.maxHp <= 0.5 && boss.phase !== 'spread') {
    // Laser is handled as a special timed attack — simplified for Phase 1
    // TODO: Implement laser warning line + beam visual
  }

  // Drone summon (HP 25%~): one-time summon per threshold
  if (boss.hp / boss.maxHp <= 0.25 && boss.drones.length === 0) {
    spawnDrones(entities, boss);
  }
};

function fireSpreadShot(entities: GameEntities, boss: NonNullable<GameEntities['boss']>) {
  const centerX = boss.x + boss.width / 2;
  const startY = boss.y + boss.height;

  for (let i = 0; i < BOSS_SPREAD_COUNT; i++) {
    const slot = entities.enemyBullets.find((b) => !b.active);
    if (!slot) break;

    const angle = ((i - Math.floor(BOSS_SPREAD_COUNT / 2)) * 15 * Math.PI) / 180;
    const bullet = createEnemyBullet(
      centerX + Math.sin(angle) * 20,
      startY,
      15 // §6.2 boss spread damage
    );
    Object.assign(slot, bullet);
    slot.active = true;
  }
}

function spawnDrones(entities: GameEntities, boss: NonNullable<GameEntities['boss']>) {
  for (let i = 0; i < BOSS_DRONE_COUNT; i++) {
    const slot = entities.enemies.find((e) => !e.active);
    if (!slot) break;

    const x = boss.x + (i + 1) * (boss.width / (BOSS_DRONE_COUNT + 1));
    const drone = createEnemy('stationary', x, boss.y + boss.height + 20, 0.5);
    Object.assign(slot, drone);
    slot.active = true;
    boss.drones.push(drone.id);
  }
}
