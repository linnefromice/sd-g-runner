import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { MechaFormDefinition } from '@/types/forms';
import { BASE_FIRE_INTERVAL, AUTO_CHARGE_INTERVAL, AUTO_CHARGE_DAMAGE_MUL, AFTERIMAGE_DAMAGE_MUL } from '@/constants/balance';
import { createPlayerBullet } from '@/engine/entities/Bullet';
import { acquireFromPool } from '@/engine/pool';
import { resolveFormSkills } from '@/engine/formSkillResolver';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { AudioManager } from '@/audio/AudioManager';

const SPREAD_ANGLE = 15; // degrees between spread bullets

export function createShootingSystem(getForm: () => MechaFormDefinition): GameSystem<GameEntities> {
  let fireTimer = 0;
  let autoChargeTimer = 0;

  return (entities, { time }) => {
    const form = getForm();
    const p = entities.player;

    // Resolve form skill multipliers (once per frame, not per bullet)
    const store = useGameSessionStore.getState();
    const formXPState = store.formXP[store.currentForm];
    const skills = formXPState ? resolveFormSkills(store.currentForm, formXPState.skills) : null;
    const passives = skills?.passives;
    const bulletConfig = form.bulletConfig;
    const bulletSpeed = bulletConfig.speed * (skills?.bulletSpeedMul ?? 1);

    // Passive: auto_charge — fire high-damage charged shot every 3 seconds (independent timer)
    if (passives?.has('auto_charge') && p.active) {
      autoChargeTimer += time.delta;
      if (autoChargeTimer >= AUTO_CHARGE_INTERVAL) {
        autoChargeTimer -= AUTO_CHARGE_INTERVAL;
        const chargeDamage = store.atk * form.attackMultiplier * AUTO_CHARGE_DAMAGE_MUL * store.transformBuffAtkMul;
        const cx = p.x + p.width / 2;
        const bullet = createPlayerBullet(cx, p.y, chargeDamage, {
          width: bulletConfig.width * 2, height: bulletConfig.height * 2, speed: bulletSpeed,
        });
        acquireFromPool(entities.playerBullets, bullet);
      }
    }

    const interval = BASE_FIRE_INTERVAL / (form.fireRateMultiplier * store.fireRate * (skills?.fireRateMul ?? 1) * store.transformBuffFireRateMul);

    fireTimer += time.delta;
    if (fireTimer < interval) return;
    fireTimer -= interval;

    if (!p.active) return;

    AudioManager.playSe('shoot');

    let damage = store.atk * form.attackMultiplier * (skills?.damageMul ?? 1) * store.transformBuffAtkMul;
    // Passive: speed_atk_bonus — ATK scales with speed stat
    if (passives?.has('speed_atk_bonus')) damage *= (1 + (store.speed - 1) * 0.5);
    // Passive: critical_chance — 15% chance for 2x damage
    const hasCrit = passives?.has('critical_chance') ?? false;
    const isCrit = hasCrit && Math.random() < 0.15;
    if (isCrit) damage *= 2;
    const isHoming = form.specialAbility === 'homing_invincible' || (passives?.has('weak_homing') ?? false);
    // Passive pierce/explosion overrides form specialAbility
    const specialAbility = passives?.has('pierce') ? 'pierce' as const : form.specialAbility;
    const bulletWidth = bulletConfig.width * (skills?.bulletSizeMul ?? 1);
    const bulletHeight = bulletConfig.height * (skills?.bulletSizeMul ?? 1);
    const count = bulletConfig.count + (skills?.bulletCountAdd ?? 0);
    const centerX = p.x + p.width / 2;
    const hasDoubleShot = passives?.has('double_shot') ?? false;

    // Passive: omnidirectional — fire bullets in all 360° directions
    if (passives?.has('omnidirectional')) {
      const omniCount = Math.max(count, 8);
      for (let i = 0; i < omniCount; i++) {
        const angle = (i * Math.PI * 2) / omniCount;
        const vx = Math.sin(angle) * bulletSpeed;
        const vy = -Math.cos(angle) * bulletSpeed;
        const bullet = createPlayerBullet(centerX, p.y + p.height / 2, damage, {
          width: bulletWidth, height: bulletHeight, speed: 0,
          specialAbility, isCritical: isCrit || undefined, vx, vy,
        });
        if (!acquireFromPool(entities.playerBullets, bullet)) break;
      }
    } else if (count <= 1) {
      // Single bullet (original behavior)
      const bullet = createPlayerBullet(centerX, p.y, damage, {
        width: bulletWidth,
        height: bulletHeight,
        speed: bulletSpeed,
        homing: isHoming,
        specialAbility,
        isCritical: isCrit || undefined,
      });
      acquireFromPool(entities.playerBullets, bullet);
      if (hasDoubleShot) {
        const b2 = createPlayerBullet(centerX + 10, p.y, damage, {
          width: bulletWidth, height: bulletHeight, speed: bulletSpeed,
          homing: isHoming, specialAbility, isCritical: isCrit || undefined,
        });
        acquireFromPool(entities.playerBullets, b2);
      }
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
          isCritical: isCrit || undefined,
        });
        if (!acquireFromPool(entities.playerBullets, bullet)) break;
      }
      if (hasDoubleShot) {
        for (let i = 0; i < count; i++) {
          const angleDeg = -halfSpread + i * SPREAD_ANGLE;
          const offsetX = Math.tan((angleDeg * Math.PI) / 180) * 20;
          const b2 = createPlayerBullet(centerX + offsetX + 10, p.y, damage, {
            width: bulletWidth, height: bulletHeight, speed: bulletSpeed,
            homing: isHoming, specialAbility, isCritical: isCrit || undefined,
          });
          if (!acquireFromPool(entities.playerBullets, b2)) break;
        }
      }
    }

    // Passive: afterimage — fire extra bullets from recent trail positions
    if (passives?.has('afterimage')) {
      const trailDamage = damage * AFTERIMAGE_DAMAGE_MUL;
      for (let i = 0; i < p.trailHistory.length; i++) {
        const pos = p.trailHistory[i];
        const b = createPlayerBullet(pos.x + p.width / 2, pos.y, trailDamage, {
          width: bulletWidth, height: bulletHeight, speed: bulletSpeed,
        });
        acquireFromPool(entities.playerBullets, b);
      }
    }
  };
}
