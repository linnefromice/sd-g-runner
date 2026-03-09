import type { GameEntities } from '@/types/entities';
import {
  PARTICLE_DEFAULT_LIFE,
  PARTICLE_DEFAULT_SPEED,
  PARTICLE_DEFAULT_SIZE,
  PARTICLE_BOSS_SIZE,
  PARTICLE_ENEMY_KILL_COUNT,
  PARTICLE_PLAYER_HIT_COUNT,
  PARTICLE_GATE_PASS_COUNT,
  PARTICLE_EX_BURST_COUNT,
  PARTICLE_PARRY_COUNT,
  PARTICLE_BOSS_KILL_COUNT,
  PARTICLE_BULLET_IMPACT_COUNT,
  PARTICLE_BULLET_IMPACT_LIFE,
  PARTICLE_DEBRIS_DESTROY_COUNT,
  SCORE_POPUP_SPEED,
  SCORE_POPUP_LIFE,
  HIT_STOP_ENEMY_KILL,
  HIT_STOP_PLAYER_HIT,
  HIT_STOP_PARRY,
  HIT_STOP_BOSS_KILL,
  SHAKE_ENEMY_KILL_INTENSITY,
  SHAKE_ENEMY_KILL_DURATION,
  SHAKE_PLAYER_HIT_INTENSITY,
  SHAKE_PLAYER_HIT_DURATION,
  SHAKE_PARRY_INTENSITY,
  SHAKE_PARRY_DURATION,
  SHAKE_BOSS_KILL_INTENSITY,
  SHAKE_BOSS_KILL_DURATION,
  JUST_TF_SCORE,
  GRAZE_SCORE,
  GRAZE_CLOSE_SCORE,
  GRAZE_EXTREME_SCORE,
  PARTICLE_GRAZE_NORMAL_COUNT,
  PARTICLE_GRAZE_CLOSE_COUNT,
  PARTICLE_GRAZE_EXTREME_COUNT,
  DEBRIS_DESTROY_SCORE,
  PARTICLE_KILL_FLASH_COUNT,
  PARTICLE_KILL_FLASH_LIFE,
  PARTICLE_KILL_FLASH_SIZE,
  GRAZE_RING_DURATION,
  SCORE_POPUP_THRESHOLD_MEDIUM,
  SCORE_POPUP_THRESHOLD_LARGE,
  PARTICLE_COMBO_MAX_COUNT,
  SHOCKWAVE_EFFECT_DURATION,
} from '@/constants/balance';
import { SCORE_POPUP_COLORS } from '@/constants/colors';

export type GrazeTier = 'normal' | 'close' | 'extreme';

/** Pick popup color based on score magnitude (A1) */
function getScorePopupColor(score: number): string {
  if (score >= SCORE_POPUP_THRESHOLD_LARGE) return SCORE_POPUP_COLORS.large;
  if (score >= SCORE_POPUP_THRESHOLD_MEDIUM) return SCORE_POPUP_COLORS.medium;
  return SCORE_POPUP_COLORS.small;
}

// --- Low-level spawners ---

function spawnParticles(
  entities: GameEntities,
  x: number,
  y: number,
  count: number,
  color: string,
  life: number = PARTICLE_DEFAULT_LIFE,
  speed: number = PARTICLE_DEFAULT_SPEED,
  size: number = PARTICLE_DEFAULT_SIZE,
  pattern: 'radial' | 'horizontal' | 'upward' = 'radial',
) {
  let spawned = 0;
  for (const p of entities.particles) {
    if (spawned >= count) break;
    if (p.active) continue;

    p.active = true;
    p.x = x;
    p.y = y;
    p.size = size;
    p.color = color;
    p.life = life;
    p.maxLife = life;

    switch (pattern) {
      case 'radial': {
        const angle = (Math.PI * 2 * spawned) / count + (Math.random() - 0.5) * 0.5;
        const s = speed * (0.7 + Math.random() * 0.6);
        p.vx = Math.cos(angle) * s;
        p.vy = Math.sin(angle) * s;
        break;
      }
      case 'horizontal': {
        p.vx = (spawned % 2 === 0 ? 1 : -1) * speed * (0.5 + Math.random() * 0.5);
        p.vy = (Math.random() - 0.5) * speed * 0.3;
        break;
      }
      case 'upward': {
        const spread = (Math.random() - 0.5) * speed;
        p.vx = spread;
        p.vy = -speed * (0.5 + Math.random() * 0.5);
        break;
      }
    }

    spawned++;
  }
}

function spawnScorePopup(
  entities: GameEntities,
  x: number,
  y: number,
  text: string,
  color: string,
) {
  for (const popup of entities.scorePopups) {
    if (popup.active) continue;
    popup.active = true;
    popup.x = x;
    popup.y = y;
    popup.vy = -SCORE_POPUP_SPEED;
    popup.text = text;
    popup.color = color;
    popup.life = SCORE_POPUP_LIFE;
    popup.maxLife = SCORE_POPUP_LIFE;
    return;
  }
}

function triggerHitStop(entities: GameEntities, duration: number) {
  entities.hitStopTimer = Math.max(entities.hitStopTimer, duration);
}

function triggerShake(entities: GameEntities, intensity: number, duration: number) {
  if (intensity >= entities.shakeIntensity || entities.shakeTimer <= 0) {
    entities.shakeIntensity = intensity;
    entities.shakeTimer = duration;
  }
}

// --- High-level event triggers ---

export function onEnemyKill(entities: GameEntities, x: number, y: number, score: number) {
  triggerHitStop(entities, HIT_STOP_ENEMY_KILL);
  triggerShake(entities, SHAKE_ENEMY_KILL_INTENSITY, SHAKE_ENEMY_KILL_DURATION);
  // White flash burst: large, very brief particles for impact feel (F1)
  spawnParticles(entities, x, y, PARTICLE_KILL_FLASH_COUNT, '#FFFFFF', PARTICLE_KILL_FLASH_LIFE, PARTICLE_DEFAULT_SPEED * 0.5, PARTICLE_KILL_FLASH_SIZE);
  spawnParticles(entities, x, y, PARTICLE_ENEMY_KILL_COUNT, '#FF4444');
  spawnScorePopup(entities, x, y, `+${score}`, getScorePopupColor(score));
}

export function onPlayerHit(entities: GameEntities, x: number, y: number) {
  triggerHitStop(entities, HIT_STOP_PLAYER_HIT);
  triggerShake(entities, SHAKE_PLAYER_HIT_INTENSITY, SHAKE_PLAYER_HIT_DURATION);
  spawnParticles(entities, x, y, PARTICLE_PLAYER_HIT_COUNT, '#4488FF');
}

export function onGatePass(entities: GameEntities, x: number, y: number, color: string) {
  spawnParticles(entities, x, y, PARTICLE_GATE_PASS_COUNT, color, 300, PARTICLE_DEFAULT_SPEED, PARTICLE_DEFAULT_SIZE, 'horizontal');
}

export function onEXBurst(entities: GameEntities, x: number, y: number) {
  spawnParticles(entities, x, y, PARTICLE_EX_BURST_COUNT, '#00E5FF', 500, PARTICLE_DEFAULT_SPEED, PARTICLE_DEFAULT_SIZE, 'upward');
  // Shockwave ring effect
  entities.shockwaveTimer = SHOCKWAVE_EFFECT_DURATION;
  // Screen shake
  triggerShake(entities, 4, 300);
}

export function onParry(entities: GameEntities, x: number, y: number) {
  triggerHitStop(entities, HIT_STOP_PARRY);
  triggerShake(entities, SHAKE_PARRY_INTENSITY, SHAKE_PARRY_DURATION);
  spawnParticles(entities, x, y, PARTICLE_PARRY_COUNT, '#FFFFFF');
  spawnScorePopup(entities, x, y, `+${JUST_TF_SCORE}`, '#FFFFFF');
}

export function onBossKill(entities: GameEntities, x: number, y: number) {
  triggerHitStop(entities, HIT_STOP_BOSS_KILL);
  triggerShake(entities, SHAKE_BOSS_KILL_INTENSITY, SHAKE_BOSS_KILL_DURATION);
  spawnParticles(entities, x, y, PARTICLE_BOSS_KILL_COUNT, '#FF4444', 600, PARTICLE_DEFAULT_SPEED * 1.5, PARTICLE_BOSS_SIZE);
  spawnParticles(entities, x, y, PARTICLE_BOSS_KILL_COUNT, '#FF8800', 600, PARTICLE_DEFAULT_SPEED, PARTICLE_BOSS_SIZE);
}

export function onBulletImpact(entities: GameEntities, x: number, y: number) {
  spawnParticles(entities, x, y, PARTICLE_BULLET_IMPACT_COUNT, '#00D4FF', PARTICLE_BULLET_IMPACT_LIFE);
}

export function onGraze(entities: GameEntities, x: number, y: number, tier: GrazeTier = 'normal') {
  let color: string;
  let particleCount: number;
  let score: number;

  switch (tier) {
    case 'extreme':
      color = '#FF3366';
      particleCount = PARTICLE_GRAZE_EXTREME_COUNT;
      score = GRAZE_EXTREME_SCORE;
      break;
    case 'close':
      color = '#FFD600';
      particleCount = PARTICLE_GRAZE_CLOSE_COUNT;
      score = GRAZE_CLOSE_SCORE;
      break;
    default:
      color = '#FFFFFF';
      particleCount = PARTICLE_GRAZE_NORMAL_COUNT;
      score = GRAZE_SCORE;
      break;
  }

  spawnParticles(entities, x, y, particleCount, color);
  spawnScorePopup(entities, x, y, `+${score}`, color);
  // Graze ring visual effect (F3)
  entities.grazeRingTimer = GRAZE_RING_DURATION;
}

export function onComboMax(entities: GameEntities, x: number, y: number) {
  spawnParticles(entities, x, y, PARTICLE_COMBO_MAX_COUNT, '#FFD600', 300, PARTICLE_DEFAULT_SPEED * 0.8, PARTICLE_DEFAULT_SIZE, 'radial');
}

export function onAwaken(entities: GameEntities, x: number, y: number) {
  // 20 golden radial particles for dramatic burst
  spawnParticles(entities, x, y, 20, '#FFD600', 500, PARTICLE_DEFAULT_SPEED * 1.5, PARTICLE_DEFAULT_SIZE * 1.5, 'radial');
  // Additional white flash particles
  spawnParticles(entities, x, y, 10, '#FFFFFF', 300, PARTICLE_DEFAULT_SPEED, PARTICLE_KILL_FLASH_SIZE);
  triggerShake(entities, 5, 400);
}

export function onDebrisDestroy(entities: GameEntities, x: number, y: number) {
  spawnParticles(entities, x, y, PARTICLE_DEBRIS_DESTROY_COUNT, '#8B7355');
  spawnScorePopup(entities, x, y, `+${DEBRIS_DESTROY_SCORE}`, '#00FF88');
}
