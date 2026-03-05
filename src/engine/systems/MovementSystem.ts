import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities, BulletEntity } from '@/types/entities';
import type { MechaFormDefinition } from '@/types/forms';
import {
  PLAYER_MIN_X,
  PLAYER_MAX_X,
  PLAYER_Y_TOP_RATIO,
  PLAYER_Y_BOTTOM_MARGIN,
} from '@/constants/dimensions';
import { PLAYER_MOVE_SPEED, BASE_SCROLL_SPEED } from '@/constants/balance';
import { deactivateBullet } from '@/engine/entities/Bullet';
import { deactivateEnemy } from '@/engine/entities/Enemy';

/** How strongly homing bullets turn toward targets (0-1 blend per second) */
const HOMING_TURN_RATE = 3.0;

export function createMovementSystem(
  getForm: () => MechaFormDefinition
): GameSystem<GameEntities> {
  return (entities, { time }) => {
  const dt = time.delta / 1000;
  const { visibleHeight } = entities.screen;
  const form = getForm();

  // Smooth slide toward tap target (if set)
  const p = entities.player;
  if (p.targetX != null && p.targetY != null) {
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = PLAYER_MOVE_SPEED * form.moveSpeedMultiplier * dt;

    if (dist <= step) {
      // Arrived at target
      p.x = p.targetX;
      p.y = p.targetY;
      p.targetX = null;
      p.targetY = null;
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
    }
  }

  // Clamp player position to allowed bounds (§3.1)
  const minY = visibleHeight * PLAYER_Y_TOP_RATIO;
  const maxY = visibleHeight - PLAYER_Y_BOTTOM_MARGIN;
  p.x = Math.max(PLAYER_MIN_X, Math.min(PLAYER_MAX_X - p.width, p.x));
  p.y = Math.max(minY, Math.min(maxY - p.height, p.y));

  // Move player bullets
  for (const b of entities.playerBullets) {
    if (!b.active) continue;

    if (b.homing) {
      moveHomingBullet(b, entities, dt);
    } else {
      b.y -= b.speed * dt;
    }

    if (b.y + b.height < 0 || b.y > visibleHeight) deactivateBullet(b);
  }

  // Move enemy bullets downward
  for (const b of entities.enemyBullets) {
    if (!b.active) continue;
    b.y += b.speed * dt;
    if (b.y > visibleHeight) deactivateBullet(b);
  }

  // Move enemies (scroll down + deactivate off-screen)
  for (const e of entities.enemies) {
    if (!e.active) continue;
    e.y += BASE_SCROLL_SPEED * dt;
    if (e.y > visibleHeight + 50) {
      deactivateEnemy(e);
    }
  }

  // Move gates downward
  for (const g of entities.gates) {
    if (!g.active) continue;
    g.y += BASE_SCROLL_SPEED * dt;
    if (g.y > visibleHeight + 50) {
      g.active = false;
    }
  }
  };
}

function moveHomingBullet(
  bullet: BulletEntity,
  entities: GameEntities,
  dt: number
): void {
  const target = findNearestTarget(bullet, entities);
  if (!target) {
    // No target — fly straight up
    bullet.y -= bullet.speed * dt;
    return;
  }

  // Direction to target center
  const dx = (target.x + target.width / 2) - (bullet.x + bullet.width / 2);
  const dy = (target.y + target.height / 2) - (bullet.y + bullet.height / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 1) {
    bullet.y -= bullet.speed * dt;
    return;
  }

  // Blend homing direction with upward direction for natural trajectory
  const homingStrength = Math.min(1.0, HOMING_TURN_RATE * dt);
  const moveX = (dx / dist) * bullet.speed * dt;
  const moveY = (dy / dist) * bullet.speed * dt;

  bullet.x += moveX * homingStrength;
  bullet.y += moveY * homingStrength + (-bullet.speed * dt) * (1 - homingStrength);
}

function findNearestTarget(
  bullet: BulletEntity,
  entities: GameEntities
): { x: number; y: number; width: number; height: number } | null {
  let nearest: { x: number; y: number; width: number; height: number } | null = null;
  let nearestDist = Infinity;

  const bx = bullet.x + bullet.width / 2;
  const by = bullet.y + bullet.height / 2;

  for (const e of entities.enemies) {
    if (!e.active) continue;
    const dist = Math.sqrt((e.x + e.width / 2 - bx) ** 2 + (e.y + e.height / 2 - by) ** 2);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = e;
    }
  }

  if (entities.boss?.active) {
    const boss = entities.boss;
    const dist = Math.sqrt((boss.x + boss.width / 2 - bx) ** 2 + (boss.y + boss.height / 2 - by) ** 2);
    if (dist < nearestDist) {
      nearest = boss;
    }
  }

  return nearest;
}
