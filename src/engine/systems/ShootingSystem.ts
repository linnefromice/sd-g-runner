import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { MechaFormDefinition } from '@/types/forms';
import { BASE_FIRE_INTERVAL } from '@/constants/balance';
import { createPlayerBullet } from '@/engine/entities/Bullet';
import { acquireFromPool } from '@/engine/pool';
import { resolveFormSkills } from '@/engine/formSkillResolver';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { AudioManager } from '@/audio/AudioManager';

const SPREAD_ANGLE = 15; // degrees between spread bullets

export function createShootingSystem(getForm: () => MechaFormDefinition): GameSystem<GameEntities> {
  let fireTimer = 0;

  return (entities, { time }) => {
    const form = getForm();

    // Resolve form skill multipliers (once per frame, not per bullet)
    const store = useGameSessionStore.getState();
    const formXPState = store.formXP[store.currentForm];
    const skills = formXPState ? resolveFormSkills(store.currentForm, formXPState.skills) : null;

    const interval = BASE_FIRE_INTERVAL / (form.fireRateMultiplier * store.fireRate * (skills?.fireRateMul ?? 1));

    fireTimer += time.delta;
    if (fireTimer < interval) return;
    fireTimer -= interval;

    const p = entities.player;
    if (!p.active) return;

    AudioManager.playSe('shoot');

    const bulletConfig = form.bulletConfig;
    const damage = store.atk * form.attackMultiplier * (skills?.damageMul ?? 1);
    const isHoming = form.specialAbility === 'homing_invincible';
    const specialAbility = form.specialAbility;
    const bulletSpeed = bulletConfig.speed * (skills?.bulletSpeedMul ?? 1);
    const bulletWidth = bulletConfig.width * (skills?.bulletSizeMul ?? 1);
    const bulletHeight = bulletConfig.height * (skills?.bulletSizeMul ?? 1);
    const count = bulletConfig.count + (skills?.bulletCountAdd ?? 0);
    const centerX = p.x + p.width / 2;

    if (count <= 1) {
      // Single bullet (original behavior)
      const bullet = createPlayerBullet(centerX, p.y, damage, {
        width: bulletWidth,
        height: bulletHeight,
        speed: bulletSpeed,
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
          width: bulletWidth,
          height: bulletHeight,
          speed: bulletSpeed,
          homing: isHoming,
          specialAbility,
        });
        if (!acquireFromPool(entities.playerBullets, bullet)) break;
      }
    }
  };
}
