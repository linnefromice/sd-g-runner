import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { checkAABBOverlap, getPlayerHitbox, getPlayerVisualHitbox, getCenter, getDistance } from '@/engine/collision';
import { deactivateBullet } from '@/engine/entities/Bullet';
import { IFRAME_DURATION, EXPLOSION_RADIUS, ENEMY_STATS, GRAZE_EX_GAIN, GRAZE_TF_GAIN, GRAZE_SCORE, DEBRIS_CONTACT_DAMAGE, GROWTH_GATE_INITIAL_RATIO, GROWTH_GATE_PER_HIT, JUST_TF_SHOCKWAVE_RADIUS, JUST_TF_SHOCKWAVE_DAMAGE, JUST_TF_SCORE, JUST_TF_EX_GAIN, SHOCKWAVE_EFFECT_DURATION, BOSS_COLLISION_DAMAGE, HIT_FLASH_DURATION } from '@/constants/balance';
import { generateGateLabel } from '@/engine/entities/Gate';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { updateBossPhase } from '@/engine/systems/bossPhase';
import { applyEnemyKillReward } from '@/engine/systems/enemyKillReward';
import { applyBossKill } from '@/engine/systems/bossKill';
import { applyDebrisDestroyReward } from '@/engine/systems/debrisDestroyReward';
import { onPlayerHit, onParry, onGraze, onBulletImpact } from '@/engine/effects';

type Store = ReturnType<typeof useGameSessionStore.getState>;

export const collisionSystem: GameSystem<GameEntities> = (entities) => {
  const player = entities.player;
  if (!player.active) return;

  const playerHB = getPlayerHitbox(player);
  const store = useGameSessionStore.getState();

  // Offensive collisions (player bullets outgoing)
  checkPlayerBulletsVsEnemies(entities, store);
  checkPlayerBulletsVsDebris(entities, store);
  checkPlayerBulletsVsGrowthGates(entities);
  checkPlayerBulletsVsBoss(entities, store);

  // Graze detection
  checkGraze(entities, player, playerHB, store);

  // Defensive collisions (damage to player)
  if (!player.isInvincible) {
    checkDamageToPlayer(entities, player, playerHB, store);
  }
};

// --- Offensive: Player bullets outgoing ---

function checkPlayerBulletsVsEnemies(entities: GameEntities, store: Store) {
  for (const bullet of entities.playerBullets) {
    if (!bullet.active) continue;
    for (const enemy of entities.enemies) {
      if (!enemy.active) continue;
      if (bullet.specialAbility === 'pierce' && bullet.piercedEnemyIds?.has(enemy.id)) continue;
      if (!checkAABBOverlap(bullet, enemy)) continue;

      // Phalanx shield: upper half blocks normal bullets
      if (enemy.enemyType === 'phalanx') {
        const bulletCenterY = bullet.y + bullet.height / 2;
        const enemyCenterY = enemy.y + enemy.height / 2;
        if (bulletCenterY < enemyCenterY) {
          const ability = bullet.specialAbility;
          if (ability !== 'explosion_radius' && ability !== 'pierce' && ability !== 'shield_pierce') {
            deactivateBullet(bullet);
            break;
          }
        }
      }

      const hit = getCenter(bullet);
      enemy.hp -= bullet.damage;
      enemy.flashTimer = HIT_FLASH_DURATION;

      if (bullet.specialAbility === 'pierce') {
        bullet.piercedEnemyIds?.add(enemy.id);
      } else if (bullet.specialAbility === 'explosion_radius') {
        deactivateBullet(bullet);
        applyExplosionAoE(entities, hit.x, hit.y, bullet.damage);
      } else {
        deactivateBullet(bullet);
      }

      if (enemy.hp <= 0) {
        applyEnemyKillReward(enemy, entities);
      } else if (bullet.specialAbility !== 'pierce') {
        onBulletImpact(entities, hit.x, hit.y);
      }

      if (bullet.specialAbility !== 'pierce') break;
    }
  }
}

function checkPlayerBulletsVsDebris(entities: GameEntities, store: Store) {
  for (const bullet of entities.playerBullets) {
    if (!bullet.active) continue;
    for (const debris of entities.debris) {
      if (!debris.active) continue;
      if (!checkAABBOverlap(bullet, debris)) continue;

      if (bullet.specialAbility === 'pierce') continue;

      if (bullet.specialAbility === 'explosion_radius') {
        debris.hp -= bullet.damage;
        const impact = getCenter(bullet);
        deactivateBullet(bullet);
        applyExplosionAoE(entities, impact.x, impact.y, bullet.damage);
        if (debris.hp <= 0) {
          applyDebrisDestroyReward(debris, entities);
        }
        break;
      }

      // Normal/homing/shield_pierce bullets: absorbed by debris
      deactivateBullet(bullet);
      break;
    }
  }
}

function checkPlayerBulletsVsGrowthGates(entities: GameEntities) {
  for (const bullet of entities.playerBullets) {
    if (!bullet.active) continue;
    for (const gate of entities.gates) {
      if (!gate.active || gate.passed || gate.gateType !== 'growth') continue;
      if (!checkAABBOverlap(bullet, gate)) continue;

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

function checkPlayerBulletsVsBoss(entities: GameEntities, store: Store) {
  if (!entities.boss?.active) return;

  for (const bullet of entities.playerBullets) {
    if (!bullet.active) continue;
    if (bullet.specialAbility === 'pierce' && bullet.piercedEnemyIds?.has(entities.boss.id)) continue;
    if (!checkAABBOverlap(bullet, entities.boss)) continue;

    const hit = getCenter(bullet);
    const prevPercent = Math.floor((entities.boss.hp / entities.boss.maxHp) * 100);
    entities.boss.hp -= bullet.damage;
    const newPercent = Math.floor((entities.boss.hp / entities.boss.maxHp) * 100);

    if (bullet.specialAbility === 'pierce') {
      bullet.piercedEnemyIds?.add(entities.boss.id);
    } else if (bullet.specialAbility === 'explosion_radius') {
      deactivateBullet(bullet);
      applyExplosionAoE(entities, hit.x, hit.y, bullet.damage);
    } else {
      deactivateBullet(bullet);
    }

    const percentDamaged = prevPercent - newPercent;
    if (percentDamaged > 0) store.addScore(percentDamaged * 50);
    if (!store.isEXBurstActive) store.addExGauge(2);

    updateBossPhase(entities.boss);

    if (entities.boss.hp <= 0) {
      applyBossKill(entities);
    } else {
      onBulletImpact(entities, hit.x, hit.y);
    }
  }
}

// --- Graze ---

function checkGraze(
  entities: GameEntities,
  player: GameEntities['player'],
  playerHB: ReturnType<typeof getPlayerHitbox>,
  store: Store,
) {
  if (player.isInvincible || store.isAwakened) return;

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
      const bc = getCenter(bullet);
      onGraze(entities, bc.x, bc.y);
    }
  }
}

// --- Defensive: Damage to player ---

function checkDamageToPlayer(
  entities: GameEntities,
  player: GameEntities['player'],
  playerHB: ReturnType<typeof getPlayerHitbox>,
  store: Store,
) {
  const isAwakenedInvincible = store.isAwakened;

  // Enemy bullets → Player (always takes damage, even when awakened)
  for (const bullet of entities.enemyBullets) {
    if (!bullet.active) continue;
    if (!checkAABBOverlap(playerHB, bullet)) continue;

    if (entities.justTFTimer > 0) {
      deactivateBullet(bullet);
      applyParryShockwave(entities, store);
      return;
    }
    deactivateBullet(bullet);
    applyDamage(entities, player, bullet.damage, store);
    return;
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
    if (entities.justTFTimer > 0) {
      applyParryShockwave(entities, store);
      return;
    }
    applyDamage(entities, player, BOSS_COLLISION_DAMAGE, store);
  }
}

// --- Shared helpers ---

function applyExplosionAoE(entities: GameEntities, x: number, y: number, damage: number) {
  for (const other of entities.enemies) {
    if (!other.active) continue;
    const oc = getCenter(other);
    if (getDistance(x, y, oc.x, oc.y) <= EXPLOSION_RADIUS) {
      other.hp -= damage;
      if (other.hp <= 0) applyEnemyKillReward(other, entities);
    }
  }
}

function applyDamage(
  entities: GameEntities,
  player: GameEntities['player'],
  damage: number,
  store: Store,
) {
  store.takeDamage(damage);
  player.isInvincible = true;
  player.invincibleTimer = IFRAME_DURATION;
  store.resetCombo();
  const pc = getCenter(player);
  onPlayerHit(entities, pc.x, pc.y);
}

function applyParryShockwave(entities: GameEntities, store: Store) {
  entities.justTFTimer = 0;
  const pc = getCenter(entities.player);

  for (const enemy of entities.enemies) {
    if (!enemy.active) continue;
    const ec = getCenter(enemy);
    if (getDistance(pc.x, pc.y, ec.x, ec.y) <= JUST_TF_SHOCKWAVE_RADIUS) {
      enemy.hp -= JUST_TF_SHOCKWAVE_DAMAGE;
      if (enemy.hp <= 0) applyEnemyKillReward(enemy, entities);
    }
  }

  for (const b of entities.enemyBullets) {
    if (!b.active) continue;
    const bc = getCenter(b);
    if (getDistance(pc.x, pc.y, bc.x, bc.y) <= JUST_TF_SHOCKWAVE_RADIUS) {
      deactivateBullet(b);
    }
  }

  store.addScore(JUST_TF_SCORE);
  if (!store.isEXBurstActive) store.addExGauge(JUST_TF_EX_GAIN);
  entities.shockwaveTimer = SHOCKWAVE_EFFECT_DURATION;
  onParry(entities, pc.x, pc.y);
}
