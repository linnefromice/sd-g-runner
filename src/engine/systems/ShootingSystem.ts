import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { MechaFormDefinition } from '@/types/forms';
import { BASE_FIRE_INTERVAL } from '@/constants/balance';
import { createPlayerBullet } from '@/engine/entities/Bullet';
import { acquireFromPool } from '@/engine/pool';

const SPREAD_ANGLE = 15; // degrees between spread bullets

export function createShootingSystem(getForm: () => MechaFormDefinition): GameSystem<GameEntities> {
  let fireTimer = 0;

  return (entities, { time }) => {
    const form = getForm();
    const interval = BASE_FIRE_INTERVAL / form.fireRateMultiplier;

    fireTimer += time.delta;
    if (fireTimer < interval) return;
    fireTimer -= interval;

    const p = entities.player;
    if (!p.active) return;

    const bulletConfig = form.bulletConfig;
    const damage = 10 * form.attackMultiplier;
    const isHoming = form.specialAbility === 'homing_invincible';
    const specialAbility = form.specialAbility;
    const count = bulletConfig.count;
    const centerX = p.x + p.width / 2;

    if (count <= 1) {
      // Single bullet (original behavior)
      const bullet = createPlayerBullet(centerX, p.y, damage, {
        width: bulletConfig.width,
        height: bulletConfig.height,
        speed: bulletConfig.speed,
        homing: isHoming,
        specialAbility,
      });
      acquireFromPool(entities.playerBullets, bullet);
    } else {
      // Multi-bullet spread
      const halfSpread = ((count - 1) * SPREAD_ANGLE) / 2;
      for (let i = 0; i < count; i++) {
        const angleDeg = -halfSpread + i * SPREAD_ANGLE;
        const offsetX = Math.tan((angleDeg * Math.PI) / 180) * 20;
        const bullet = createPlayerBullet(centerX + offsetX, p.y, damage, {
          width: bulletConfig.width,
          height: bulletConfig.height,
          speed: bulletConfig.speed,
          homing: isHoming,
          specialAbility,
        });
        if (!acquireFromPool(entities.playerBullets, bullet)) break;
      }
    }
  };
}
