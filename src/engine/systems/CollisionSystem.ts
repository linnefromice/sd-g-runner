import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { checkAABBOverlap, getPlayerHitbox, getPlayerVisualHitbox, getCenter, getDistance, expandHitbox } from '@/engine/collision';
import { deactivateBullet } from '@/engine/entities/Bullet';
import { createEnemy } from '@/engine/entities/Enemy';
import { acquireFromPool } from '@/engine/pool';
import { IFRAME_DURATION, EXPLOSION_RADIUS, ENEMY_STATS, GRAZE_EX_GAIN, GRAZE_TF_GAIN, GRAZE_SCORE, DEBRIS_CONTACT_DAMAGE, GROWTH_GATE_INITIAL_RATIO, GROWTH_GATE_PER_HIT, JUST_TF_SHOCKWAVE_RADIUS, JUST_TF_SHOCKWAVE_DAMAGE, JUST_TF_SCORE, JUST_TF_EX_GAIN, SHOCKWAVE_EFFECT_DURATION, BOSS_COLLISION_DAMAGE, HIT_FLASH_DURATION, GRAZE_CLOSE_EXPAND, GRAZE_EXTREME_EXPAND, GRAZE_CLOSE_SCORE, GRAZE_CLOSE_EX_GAIN, GRAZE_CLOSE_TF_GAIN, GRAZE_EXTREME_SCORE, GRAZE_EXTREME_EX_GAIN, GRAZE_EXTREME_TF_GAIN, FORM_XP_GRAZE, FORM_XP_GRAZE_CLOSE, FORM_XP_GRAZE_EXTREME, SPLITTER_SPAWN_OFFSETS, SENTINEL_SHIELD_REDUCTION } from '@/constants/balance';
import { AudioManager } from '@/audio/AudioManager';
import { HapticsManager } from '@/audio/HapticsManager';
import { generateGateLabel } from '@/engine/entities/Gate';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { resolveFormSkills, type ResolvedFormStats } from '@/engine/formSkillResolver';
import { FORM_DEFINITIONS } from '@/game/forms';
import { updateBossPhase } from '@/engine/systems/bossPhase';
import { applyEnemyKillReward } from '@/engine/systems/enemyKillReward';
import { applyBossKill } from '@/engine/systems/bossKill';
import { applyDebrisDestroyReward } from '@/engine/systems/debrisDestroyReward';
import { onPlayerHit, onParry, onGraze, onBulletImpact, type GrazeTier } from '@/engine/effects';

type Store = ReturnType<typeof useGameSessionStore.getState>;
type Passives = ResolvedFormStats['passives'];

export const collisionSystem: GameSystem<GameEntities> = (entities) => {
  const player = entities.player;
  if (!player.active) return;

  const playerHB = getPlayerHitbox(player);
  const store = useGameSessionStore.getState();

  // Resolve form skills once per frame
  const formXPState = store.formXP[store.currentForm];
  const skills = formXPState ? resolveFormSkills(store.currentForm, formXPState.skills) : null;
  const passives = skills?.passives ?? new Set<never>();

  // Offensive collisions (player bullets outgoing)
  checkPlayerBulletsVsEnemies(entities, store, passives, skills?.aoeRadiusMul ?? 1);
  checkPlayerBulletsVsDebris(entities, store, skills?.aoeRadiusMul ?? 1);
  checkPlayerBulletsVsGrowthGates(entities);
  checkPlayerBulletsVsBoss(entities, store, passives, skills?.aoeRadiusMul ?? 1);

  // Graze detection
  checkGraze(entities, player, playerHB, store, passives);

  // Defensive collisions (damage to player)
  if (!player.isInvincible) {
    checkDamageToPlayer(entities, player, playerHB, store, passives, skills?.damageReduceMul ?? 1);
  }
};

// --- Offensive: Player bullets outgoing ---

function checkPlayerBulletsVsEnemies(entities: GameEntities, store: Store, passives: Passives, aoeRadiusMul: number) {
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
      const dmgMul = enemy.enemyType === 'sentinel' ? SENTINEL_SHIELD_REDUCTION : 1;
      enemy.hp -= bullet.damage * dmgMul;
      enemy.flashTimer = HIT_FLASH_DURATION;

      if (bullet.specialAbility === 'pierce') {
        bullet.piercedEnemyIds?.add(enemy.id);
      } else if (bullet.specialAbility === 'explosion_radius') {
        deactivateBullet(bullet);
        applyExplosionAoE(entities, hit.x, hit.y, bullet.damage, aoeRadiusMul);
      } else {
        deactivateBullet(bullet);
      }

      // Passive: ex_on_hit — gain EX on every hit
      if (passives.has('ex_on_hit') && !store.isEXBurstActive) {
        store.addExGauge(1);
      }

      if (enemy.hp <= 0) {
        AudioManager.playSe('enemyDestroy');
        HapticsManager.enemyDestroy();
        // Splitter: spawn 3 swarms on death
        if (enemy.enemyType === 'splitter') {
          const cx = enemy.x + enemy.width / 2;
          const cy = enemy.y + enemy.height / 2;
          for (const offset of SPLITTER_SPAWN_OFFSETS) {
            const sw = createEnemy('swarm', cx + offset, cy, 1.0);
            sw.spawnTime = entities.stageTime;
            acquireFromPool(entities.enemies, sw);
          }
        }
        applyEnemyKillReward(enemy, entities);
        // Passive: heal_on_hit — recover 1 HP per kill
        if (passives.has('heal_on_hit')) store.heal(1);
      } else if (bullet.specialAbility !== 'pierce') {
        onBulletImpact(entities, hit.x, hit.y);
      }

      if (bullet.specialAbility !== 'pierce') break;
    }
  }
}

function checkPlayerBulletsVsDebris(entities: GameEntities, store: Store, aoeRadiusMul: number) {
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
        applyExplosionAoE(entities, impact.x, impact.y, bullet.damage, aoeRadiusMul);
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

function checkPlayerBulletsVsBoss(entities: GameEntities, store: Store, passives: Passives, aoeRadiusMul: number) {
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
      applyExplosionAoE(entities, hit.x, hit.y, bullet.damage, aoeRadiusMul);
    } else {
      deactivateBullet(bullet);
    }

    // Passive: ex_on_hit — gain EX on every boss hit
    if (passives.has('ex_on_hit') && !store.isEXBurstActive) {
      store.addExGauge(1);
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
  passives: Passives,
) {
  if (player.isInvincible || store.isAwakened) return;

  // Passive: graze_expand — widen graze detection area
  const grazeExpand = passives.has('graze_expand') ? 4 : 0;
  const playerVisualHB = grazeExpand > 0
    ? expandHitbox(getPlayerVisualHitbox(player), grazeExpand)
    : getPlayerVisualHitbox(player);
  const closeHB = expandHitbox(playerHB, GRAZE_CLOSE_EXPAND);
  const extremeHB = expandHitbox(playerHB, GRAZE_EXTREME_EXPAND);

  for (const bullet of entities.enemyBullets) {
    if (!bullet.active || bullet.grazed) continue;
    const overlapVisual = checkAABBOverlap(playerVisualHB, bullet);
    const overlapActual = checkAABBOverlap(playerHB, bullet);
    if (overlapVisual && !overlapActual) {
      bullet.grazed = true;

      const overlapExtreme = checkAABBOverlap(extremeHB, bullet);
      const overlapClose = checkAABBOverlap(closeHB, bullet);

      let score: number;
      let exGain: number;
      let tfGain: number;
      let xpGain: number;
      let tier: GrazeTier;

      if (overlapExtreme) {
        score = GRAZE_EXTREME_SCORE;
        exGain = GRAZE_EXTREME_EX_GAIN;
        tfGain = GRAZE_EXTREME_TF_GAIN;
        xpGain = FORM_XP_GRAZE_EXTREME;
        tier = 'extreme';
      } else if (overlapClose) {
        score = GRAZE_CLOSE_SCORE;
        exGain = GRAZE_CLOSE_EX_GAIN;
        tfGain = GRAZE_CLOSE_TF_GAIN;
        xpGain = FORM_XP_GRAZE_CLOSE;
        tier = 'close';
      } else {
        score = GRAZE_SCORE;
        exGain = GRAZE_EX_GAIN;
        tfGain = GRAZE_TF_GAIN;
        xpGain = FORM_XP_GRAZE;
        tier = 'normal';
      }

      store.addScore(score);
      if (!store.isEXBurstActive) store.addExGauge(exGain);
      store.addTransformGauge(tfGain);
      store.addFormXP(store.currentForm, xpGain);

      const bc = getCenter(bullet);
      onGraze(entities, bc.x, bc.y, tier);
    }
  }
}

// --- Defensive: Damage to player ---

function checkDamageToPlayer(
  entities: GameEntities,
  player: GameEntities['player'],
  playerHB: ReturnType<typeof getPlayerHitbox>,
  store: Store,
  passives: Passives,
  damageReduceMul: number,
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
    applyDamage(entities, player, bullet.damage, store, passives, damageReduceMul);
    return;
  }

  // Enemy collision → Player (skip if awakened)
  if (!isAwakenedInvincible) {
    for (const enemy of entities.enemies) {
      if (!enemy.active) continue;
      if (checkAABBOverlap(playerHB, enemy)) {
        applyDamage(entities, player, ENEMY_STATS[enemy.enemyType].attackDamage, store, passives, damageReduceMul);
        return;
      }
    }
  }

  // Debris collision → Player (skip if awakened)
  if (!isAwakenedInvincible) {
    for (const debris of entities.debris) {
      if (!debris.active) continue;
      if (checkAABBOverlap(playerHB, debris)) {
        applyDamage(entities, player, DEBRIS_CONTACT_DAMAGE, store, passives, damageReduceMul);
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
    applyDamage(entities, player, BOSS_COLLISION_DAMAGE, store, passives, damageReduceMul);
  }
}

// --- Shared helpers ---

function applyExplosionAoE(entities: GameEntities, x: number, y: number, damage: number, aoeRadiusMul = 1) {
  const radius = EXPLOSION_RADIUS * aoeRadiusMul;
  for (const other of entities.enemies) {
    if (!other.active) continue;
    const oc = getCenter(other);
    if (getDistance(x, y, oc.x, oc.y) <= radius) {
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
  passives?: Passives,
  damageReduceMul?: number,
) {
  // Check for damage_reduce ability (form + skill + passive armor)
  const formId = store.currentForm;
  const form = FORM_DEFINITIONS[formId];
  let finalDamage = form?.specialAbility === 'damage_reduce' ? Math.round(damage * 0.7) : damage;
  // Passive: armor — 20% damage reduction (stacks with form ability)
  if (passives?.has('armor')) finalDamage = Math.round(finalDamage * 0.8);
  // Skill: damageReduce stat multiplier (Guardian Lv1-B)
  if (damageReduceMul != null && damageReduceMul !== 1) finalDamage = Math.round(finalDamage / damageReduceMul);
  store.takeDamage(finalDamage);
  AudioManager.playSe('damage');
  HapticsManager.damage();
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
