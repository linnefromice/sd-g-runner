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
  DEBRIS_DESTROY_SCORE,
} from '@/constants/balance';

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
  spawnParticles(entities, x, y, PARTICLE_ENEMY_KILL_COUNT, '#FF4444');
  spawnScorePopup(entities, x, y, `+${score}`, '#FFD600');
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

export function onGraze(entities: GameEntities, x: number, y: number) {
  spawnScorePopup(entities, x, y, `+${GRAZE_SCORE}`, '#00E5FF');
}

export function onDebrisDestroy(entities: GameEntities, x: number, y: number) {
  spawnParticles(entities, x, y, 4, '#8B7355');
  spawnScorePopup(entities, x, y, `+${DEBRIS_DESTROY_SCORE}`, '#00FF88');
}
