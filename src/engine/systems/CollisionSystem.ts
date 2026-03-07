import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { checkAABBOverlap, getPlayerHitbox, getPlayerVisualHitbox } from '@/engine/collision';
import { deactivateBullet } from '@/engine/entities/Bullet';
import { IFRAME_DURATION, EXPLOSION_RADIUS, ENEMY_STATS, GRAZE_EX_GAIN, GRAZE_TF_GAIN, GRAZE_SCORE, DEBRIS_CONTACT_DAMAGE, DEBRIS_DESTROY_SCORE, GROWTH_GATE_INITIAL_RATIO, GROWTH_GATE_PER_HIT, JUST_TF_SHOCKWAVE_RADIUS, JUST_TF_SHOCKWAVE_DAMAGE, JUST_TF_SCORE, JUST_TF_EX_GAIN, SHOCKWAVE_EFFECT_DURATION } from '@/constants/balance';
import { generateGateLabel } from '@/engine/entities/Gate';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { updateBossPhase } from '@/engine/systems/bossPhase';
import { applyEnemyKillReward } from '@/engine/systems/enemyKillReward';
import { deactivateDebris } from '@/engine/entities/Debris';
import { onPlayerHit, onParry, onGraze, onDebrisDestroy, onBossKill } from '@/engine/effects';

export const collisionSystem: GameSystem<GameEntities> = (entities) => {
  const player = entities.player;
  if (!player.active) return;

  const playerHB = getPlayerHitbox(player);
  const store = useGameSessionStore.getState();

  // Player bullets → Enemies
  for (const bullet of entities.playerBullets) {
    if (!bullet.active) continue;
    for (const enemy of entities.enemies) {
      if (!enemy.active) continue;
      // Pierce: skip enemies already hit by this bullet
      if (bullet.specialAbility === 'pierce' && bullet.piercedEnemyIds?.has(enemy.id)) continue;
      if (checkAABBOverlap(bullet, enemy)) {
        // Phalanx shield: upper half blocks normal bullets
        if (enemy.enemyType === 'phalanx') {
          const bulletCenterY = bullet.y + bullet.height / 2;
          const enemyCenterY = enemy.y + enemy.height / 2;
          if (bulletCenterY < enemyCenterY) {
            // Shield hit — only explosion, pierce, and shield_pierce bypass
            const ability = bullet.specialAbility;
            if (ability !== 'explosion_radius' && ability !== 'pierce' && ability !== 'shield_pierce') {
              deactivateBullet(bullet);
              break;
            }
          }
        }

        enemy.hp -= bullet.damage;

        if (bullet.specialAbility === 'pierce') {
          // Pierce: don't deactivate, record hit
          bullet.piercedEnemyIds?.add(enemy.id);
        } else if (bullet.specialAbility === 'explosion_radius') {
          // Explosion: capture impact point BEFORE deactivating (deactivate resets position)
          const impactX = bullet.x + bullet.width / 2;
          const impactY = bullet.y + bullet.height / 2;
          deactivateBullet(bullet);
          for (const other of entities.enemies) {
            if (!other.active || other.id === enemy.id) continue;
            const otherCX = other.x + other.width / 2;
            const otherCY = other.y + other.height / 2;
            const dist = Math.sqrt((impactX - otherCX) ** 2 + (impactY - otherCY) ** 2);
            if (dist <= EXPLOSION_RADIUS) {
              other.hp -= bullet.damage;
              if (other.hp <= 0) applyEnemyKillReward(other, entities);
            }
          }
        } else {
          // Normal: deactivate bullet
          deactivateBullet(bullet);
        }

        // Kill check for the directly-hit enemy
        if (enemy.hp <= 0) applyEnemyKillReward(enemy, entities);

        // Pierce continues to next enemy; others break
        if (bullet.specialAbility !== 'pierce') break;
      }
    }
  }

  // Player bullets → Debris
  for (const bullet of entities.playerBullets) {
    if (!bullet.active) continue;
    for (const debris of entities.debris) {
      if (!debris.active) continue;
      if (checkAABBOverlap(bullet, debris)) {
        if (bullet.specialAbility === 'pierce') {
          // Pierce bullets pass through debris entirely
          continue;
        }
        if (bullet.specialAbility === 'explosion_radius') {
          // Explosion: damage debris, deactivate bullet, AoE to nearby enemies
          debris.hp -= bullet.damage;
          const impactX = bullet.x + bullet.width / 2;
          const impactY = bullet.y + bullet.height / 2;
          deactivateBullet(bullet);
          for (const enemy of entities.enemies) {
            if (!enemy.active) continue;
            const ecx = enemy.x + enemy.width / 2;
            const ecy = enemy.y + enemy.height / 2;
            const dist = Math.sqrt((impactX - ecx) ** 2 + (impactY - ecy) ** 2);
            if (dist <= EXPLOSION_RADIUS) {
              enemy.hp -= bullet.damage;
              if (enemy.hp <= 0) applyEnemyKillReward(enemy, entities);
            }
          }
          if (debris.hp <= 0) {
            deactivateDebris(debris);
            store.addScore(DEBRIS_DESTROY_SCORE);
            onDebrisDestroy(entities, debris.x + debris.width / 2, debris.y + debris.height / 2);
          }
          break; // bullet consumed
        }
        // Normal/homing/shield_pierce bullets: absorbed by debris (no damage to debris)
        deactivateBullet(bullet);
        break;
      }
    }
  }

  // Player bullets → Growth Gates
  for (const bullet of entities.playerBullets) {
    if (!bullet.active) continue;
    for (const gate of entities.gates) {
      if (!gate.active || gate.passed || gate.gateType !== 'growth') continue;
      if (checkAABBOverlap(bullet, gate)) {
        gate.growthHits = (gate.growthHits ?? 0) + 1;
        if (gate.baseEffectValue != null && gate.growthMax != null) {
          const newValue = Math.min(
            gate.growthMax,
            gate.baseEffectValue * GROWTH_GATE_INITIAL_RATIO + gate.growthHits * GROWTH_GATE_PER_HIT
          );
          if (gate.effects.length > 0 && gate.effects[0].kind !== 'refit') {
            gate.effects[0] = { ...gate.effects[0], value: newValue };
          }
          gate.displayLabel = generateGateLabel(gate.effects[0]);
        }
        deactivateBullet(bullet);
        break;
      }
    }
  }

  // Player bullets → Boss
  if (entities.boss?.active) {
    for (const bullet of entities.playerBullets) {
      if (!bullet.active) continue;
      // Pierce: skip boss if already hit by this bullet
      if (bullet.specialAbility === 'pierce' && bullet.piercedEnemyIds?.has(entities.boss.id)) continue;
      if (checkAABBOverlap(bullet, entities.boss)) {
        const prevPercent = Math.floor((entities.boss.hp / entities.boss.maxHp) * 100);
        entities.boss.hp -= bullet.damage;
        const newPercent = Math.floor((entities.boss.hp / entities.boss.maxHp) * 100);

        if (bullet.specialAbility === 'pierce') {
          // Don't deactivate pierce bullets on boss, record hit
          bullet.piercedEnemyIds?.add(entities.boss.id);
        } else if (bullet.specialAbility === 'explosion_radius') {
          // Capture impact point BEFORE deactivating (deactivate resets position)
          const impactX = bullet.x + bullet.width / 2;
          const impactY = bullet.y + bullet.height / 2;
          deactivateBullet(bullet);
          for (const enemy of entities.enemies) {
            if (!enemy.active) continue;
            const ecx = enemy.x + enemy.width / 2;
            const ecy = enemy.y + enemy.height / 2;
            if (Math.sqrt((impactX - ecx) ** 2 + (impactY - ecy) ** 2) <= EXPLOSION_RADIUS) {
              enemy.hp -= bullet.damage;
              if (enemy.hp <= 0) applyEnemyKillReward(enemy, entities);
            }
          }
        } else {
          deactivateBullet(bullet);
        }

        const percentDamaged = prevPercent - newPercent;
        if (percentDamaged > 0) {
          store.addScore(percentDamaged * 50);
        }
        if (!store.isEXBurstActive) store.addExGauge(2);

        updateBossPhase(entities.boss);

        if (entities.boss.hp <= 0) {
          const bcx = entities.boss.x + entities.boss.width / 2;
          const bcy = entities.boss.y + entities.boss.height / 2;
          entities.boss.active = false;
          store.setFinalStageTime(entities.stageTime);
          store.setStageClear(true);
          onBossKill(entities, bcx, bcy);
        }
      }
    }
  }

  // Graze detection: near-miss between visual hitbox and actual hitbox
  if (!player.isInvincible && !store.isAwakened) {
    const playerVisualHB = getPlayerVisualHitbox(player);
    for (const bullet of entities.enemyBullets) {
      if (!bullet.active || bullet.grazed) continue;
      const overlapVisual = checkAABBOverlap(playerVisualHB, bullet);
      const overlapActual = checkAABBOverlap(playerHB, bullet);
      if (overlapVisual && !overlapActual) {
        bullet.grazed = true;
        store.addScore(GRAZE_SCORE);
        if (!store.isEXBurstActive) store.addExGauge(GRAZE_EX_GAIN);
        store.addTransformGauge(GRAZE_TF_GAIN);
        onGraze(entities, bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
      }
    }
  }

  // Skip damage checks if player is invincible
  if (player.isInvincible) return;

  // Awakened with homing_invincible: immune to body contact damage
  const isAwakenedInvincible = store.isAwakened;

  // Enemy bullets → Player (always takes damage, even when awakened)
  for (const bullet of entities.enemyBullets) {
    if (!bullet.active) continue;
    if (checkAABBOverlap(playerHB, bullet)) {
      // Just TF Parry check
      if (entities.justTFTimer > 0) {
        deactivateBullet(bullet);
        applyParryShockwave(entities, store);
        return; // No damage taken
      }

      deactivateBullet(bullet);
      applyDamage(entities, player, bullet.damage, store);
      return;
    }
  }

  // Enemy collision → Player (skip if awakened)
  if (!isAwakenedInvincible) {
    for (const enemy of entities.enemies) {
      if (!enemy.active) continue;
      if (checkAABBOverlap(playerHB, enemy)) {
        applyDamage(entities, player, ENEMY_STATS[enemy.enemyType].attackDamage, store);
        return;
      }
    }
  }

  // Debris collision → Player (skip if awakened)
  if (!isAwakenedInvincible) {
    for (const debris of entities.debris) {
      if (!debris.active) continue;
      if (checkAABBOverlap(playerHB, debris)) {
        applyDamage(entities, player, DEBRIS_CONTACT_DAMAGE, store);
        return;
      }
    }
  }

  // Boss collision → Player (skip if awakened)
  if (!isAwakenedInvincible && entities.boss?.active && checkAABBOverlap(playerHB, entities.boss)) {
    // Just TF Parry check for boss contact
    if (entities.justTFTimer > 0) {
      applyParryShockwave(entities, store);
      return;
    }
    applyDamage(entities, player, 50, store); // §6.2 boss collision
  }
};

function applyDamage(
  entities: GameEntities,
  player: GameEntities['player'],
  damage: number,
  store: ReturnType<typeof useGameSessionStore.getState>
) {
  store.takeDamage(damage);
  player.isInvincible = true;
  player.invincibleTimer = IFRAME_DURATION;
  store.resetCombo();
  onPlayerHit(entities, player.x + player.width / 2, player.y + player.height / 2);
}

function applyParryShockwave(
  entities: GameEntities,
  store: ReturnType<typeof useGameSessionStore.getState>
) {
  entities.justTFTimer = 0;

  const pcx = entities.player.x + entities.player.width / 2;
  const pcy = entities.player.y + entities.player.height / 2;

  for (const enemy of entities.enemies) {
    if (!enemy.active) continue;
    const ecx = enemy.x + enemy.width / 2;
    const ecy = enemy.y + enemy.height / 2;
    const dist = Math.sqrt((pcx - ecx) ** 2 + (pcy - ecy) ** 2);
    if (dist <= JUST_TF_SHOCKWAVE_RADIUS) {
      enemy.hp -= JUST_TF_SHOCKWAVE_DAMAGE;
      if (enemy.hp <= 0) applyEnemyKillReward(enemy, entities);
    }
  }

  for (const b of entities.enemyBullets) {
    if (!b.active) continue;
    const bcx = b.x + b.width / 2;
    const bcy = b.y + b.height / 2;
    const dist = Math.sqrt((pcx - bcx) ** 2 + (pcy - bcy) ** 2);
    if (dist <= JUST_TF_SHOCKWAVE_RADIUS) {
      deactivateBullet(b);
    }
  }

  store.addScore(JUST_TF_SCORE);
  if (!store.isEXBurstActive) store.addExGauge(JUST_TF_EX_GAIN);
  entities.shockwaveTimer = SHOCKWAVE_EFFECT_DURATION;

  onParry(entities, pcx, pcy);
}
