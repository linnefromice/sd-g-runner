import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { RenderEntity } from '@/types/rendering';
import type { SharedValue } from 'react-native-reanimated';
import { IFRAME_BLINK_INTERVAL, SHOCKWAVE_EFFECT_DURATION, JUST_TF_SHOCKWAVE_RADIUS, EX_BURST_WIDTH, BOSS_LASER_WIDTH, TRAIL_HISTORY_SIZE, TRAIL_BASE_OPACITY, TRAIL_OPACITY_DECAY, GLOW_SCALE, DEPTH_SCALE_MIN, SHADOW_OFFSET_X, SHADOW_OFFSET_Y, SPAWN_FADE_DURATION, DANGER_HP_THRESHOLD, DANGER_PULSE_SPEED, BOSS_COLOR_SHIFT_THRESHOLD, GRAZE_RING_RADIUS, GRAZE_RING_DURATION } from '@/constants/balance';
import { COLORS, GATE_COLORS, ENEMY_TYPE_COLORS } from '@/constants/colors';
import { getEntityPath } from '@/rendering/shapes';
import { useGameSessionStore } from '@/stores/gameSessionStore';

export type PopupRenderData = {
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
};

export type OverlayState = {
  dangerOpacity: number;
  bossPhaseOpacity: number;
  awakenedOpacity: number;
};

export type RenderSyncTarget = SharedValue<RenderEntity[]>;
export type PopupSyncTarget = SharedValue<PopupRenderData[]>;

function buildPath(type: string, x: number, y: number, w: number, h: number, scale: number): string | undefined {
  return getEntityPath(type, x * scale, y * scale, w * scale, h * scale) ?? undefined;
}

function buildGlowPath(type: string, x: number, y: number, w: number, h: number, scale: number): string | undefined {
  const gw = w * GLOW_SCALE;
  const gh = h * GLOW_SCALE;
  const gx = x + (w - gw) / 2;
  const gy = y + (h - gh) / 2;
  return getEntityPath(type, gx * scale, gy * scale, gw * scale, gh * scale) ?? undefined;
}

function toGlowColor(hex: string): string {
  return hex + '33';
}

function getHpBarColor(ratio: number): string {
  if (ratio > 0.6) return '#00FF88';
  if (ratio > 0.3) return '#FFD600';
  return '#FF3366';
}

function computeDepthScale(y: number, visibleHeight: number): number {
  const ratio = Math.max(0, Math.min(1, y / visibleHeight));
  return DEPTH_SCALE_MIN + (1 - DEPTH_SCALE_MIN) * ratio;
}

function buildShadowPath(type: string, x: number, y: number, w: number, h: number, scale: number, depthScale: number = 1): string | undefined {
  return getEntityPath(type, (x + SHADOW_OFFSET_X * depthScale) * scale, (y + SHADOW_OFFSET_Y * depthScale) * scale, w * scale, h * scale) ?? undefined;
}

/** Linearly interpolate two hex colors (#RRGGBB). t=0 → a, t=1 → b */
function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

export function createSyncRenderSystem(
  renderData: RenderSyncTarget,
  popupData: PopupSyncTarget,
  scrollYShared: SharedValue<number>,
  overlayState: SharedValue<OverlayState>,
  scale: number = 1,
): GameSystem<GameEntities> {
  const out: RenderEntity[] = [];
  const popups: PopupRenderData[] = [];

  return (entities, { time }) => {
    out.length = 0;
    popups.length = 0;

    const visibleHeight = entities.screen.visibleHeight;

    // Tick graze ring timer (F3)
    if (entities.grazeRingTimer > 0) {
      entities.grazeRingTimer = Math.max(0, entities.grazeRingTimer - time.delta);
    }

    // Boost Lane (background overlay) — no path, rect-based
    if (entities.boostLane?.active) {
      out.push({
        type: 'boostLane',
        x: entities.boostLane.x,
        y: 0,
        width: entities.boostLane.width,
        height: visibleHeight,
        color: '#FFD60033',
        opacity: 1.0,
      });
    }

    // Player trail + player rendering share these values
    const p = entities.player;
    const playerType = p.active ? `player_${useGameSessionStore.getState().currentForm}` : '';

    // Player trail (afterimage) — drawn behind player
    if (p.active) {
      for (let i = 0; i < TRAIL_HISTORY_SIZE; i++) {
        const idx = (p.trailIndex - i - 1 + TRAIL_HISTORY_SIZE * 2) % TRAIL_HISTORY_SIZE;
        const pos = p.trailHistory[idx];
        const tdx = p.x - pos.x;
        const tdy = p.y - pos.y;
        if (tdx * tdx + tdy * tdy < 1) continue;
        const age = i + 1;
        const trailOpacity = TRAIL_BASE_OPACITY * Math.pow(TRAIL_OPACITY_DECAY, age - 1);
        out.push({
          type: playerType,
          x: pos.x,
          y: pos.y,
          width: p.width,
          height: p.height,
          color: COLORS.entityPlayer,
          opacity: trailOpacity,
          path: buildPath(playerType, pos.x, pos.y, p.width, p.height, scale),
        });
      }
    }

    // Player — form-specific shape
    if (p.active) {
      let opacity = 1.0;
      if (p.isInvincible) {
        opacity = Math.floor(p.invincibleTimer / IFRAME_BLINK_INTERVAL) % 2 === 0 ? 0.3 : 1.0;
      }
      out.push({
        type: playerType,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        color: COLORS.entityPlayer,
        opacity,
        path: buildPath(playerType, p.x, p.y, p.width, p.height, scale),
        glowPath: buildGlowPath(playerType, p.x, p.y, p.width, p.height, scale),
        glowColor: toGlowColor(COLORS.entityPlayer),
        shadowPath: buildShadowPath(playerType, p.x, p.y, p.width, p.height, scale),
      });
    }

    // Enemies
    for (const e of entities.enemies) {
      if (!e.active) continue;
      const enemyRenderType = `enemy_${e.enemyType}`;
      const enemyBaseColor = ENEMY_TYPE_COLORS[e.enemyType] ?? COLORS.entityEnemy;
      const enemyColor = e.flashTimer > 0 ? '#FF6644' : enemyBaseColor;
      const ds = computeDepthScale(e.y, visibleHeight);
      const ew = e.width * ds;
      const eh = e.height * ds;
      const ex = e.x + (e.width - ew) / 2;
      const ey = e.y + (e.height - eh) / 2;
      out.push({
        type: enemyRenderType,
        x: ex,
        y: ey,
        width: ew,
        height: eh,
        color: enemyColor,
        opacity: Math.min(1.0, (entities.stageTime - e.spawnTime) / SPAWN_FADE_DURATION),
        path: buildPath(enemyRenderType, ex, ey, ew, eh, scale),
        glowPath: buildGlowPath(enemyRenderType, ex, ey, ew, eh, scale),
        glowColor: toGlowColor(enemyColor),
        shadowPath: buildShadowPath(enemyRenderType, ex, ey, ew, eh, scale, ds),
        hpRatio: e.hp / e.maxHp,
        hpBarColor: getHpBarColor(e.hp / e.maxHp),
        depthScale: ds,
      });
    }

    // Debris
    for (const d of entities.debris) {
      if (!d.active) continue;
      const dRatio = d.hp / d.maxHp;
      const dds = computeDepthScale(d.y, visibleHeight);
      const dw = d.width * dds;
      const dh = d.height * dds;
      const dx = d.x + (d.width - dw) / 2;
      const dy = d.y + (d.height - dh) / 2;
      out.push({
        type: 'debris',
        x: dx,
        y: dy,
        width: dw,
        height: dh,
        color: COLORS.entityDebris,
        opacity: Math.min(1.0, (entities.stageTime - d.spawnTime) / SPAWN_FADE_DURATION),
        path: buildPath('debris', dx, dy, dw, dh, scale),
        shadowPath: buildShadowPath('debris', dx, dy, dw, dh, scale, dds),
        hpRatio: dRatio,
        hpBarColor: getHpBarColor(dRatio),
        depthScale: dds,
      });
    }

    // Player bullets
    for (const b of entities.playerBullets) {
      if (!b.active) continue;
      out.push({
        type: 'playerBullet',
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        color: COLORS.entityPlayerBullet,
        opacity: 1.0,
        path: buildPath('playerBullet', b.x, b.y, b.width, b.height, scale),
        glowPath: buildGlowPath('playerBullet', b.x, b.y, b.width, b.height, scale),
        glowColor: toGlowColor(COLORS.entityPlayerBullet),
        blendMode: 'screen',
      });
    }

    // Enemy bullets
    for (const b of entities.enemyBullets) {
      if (!b.active) continue;
      const bds = computeDepthScale(b.y, visibleHeight);
      const bw = b.width * bds;
      const bh = b.height * bds;
      const bx = b.x + (b.width - bw) / 2;
      const by = b.y + (b.height - bh) / 2;
      out.push({
        type: 'enemyBullet',
        x: bx,
        y: by,
        width: bw,
        height: bh,
        color: COLORS.entityEnemyBullet,
        opacity: 1.0,
        path: buildPath('enemyBullet', bx, by, bw, bh, scale),
        glowPath: buildGlowPath('enemyBullet', bx, by, bw, bh, scale),
        glowColor: toGlowColor(COLORS.entityEnemyBullet),
        depthScale: bds,
      });
    }

    // Gates — no path, rect-based with type-specific rendering
    for (const g of entities.gates) {
      if (!g.active) continue;
      // Compute growth gate progress (0–1)
      let gateProgress: number | undefined;
      if (g.gateType === 'growth' && g.growthMax != null && g.baseEffectValue != null) {
        const currentValue = g.effects[0]?.kind !== 'refit' ? Math.abs(g.effects[0]?.value ?? 0) : 0;
        gateProgress = Math.min(1, currentValue / g.growthMax);
      }
      const gds = computeDepthScale(g.y, visibleHeight);
      const gw = g.width * gds;
      const gh = g.height * gds;
      const gx = g.x + (g.width - gw) / 2;
      const gy = g.y + (g.height - gh) / 2;
      out.push({
        type: 'gate',
        x: gx,
        y: gy,
        width: gw,
        height: gh,
        color: GATE_COLORS[g.gateType],
        opacity: 1.0,
        label: g.displayLabel,
        gateProgress,
        depthScale: gds,
      });
    }

    // Boss — color shifts toward orange as HP decreases below threshold (D1)
    if (entities.boss?.active) {
      const b = entities.boss;
      const bossHpRatio = b.hp / b.maxHp;
      let bossColor: string = COLORS.entityBoss;
      if (bossHpRatio < BOSS_COLOR_SHIFT_THRESHOLD) {
        const t = 1 - bossHpRatio / BOSS_COLOR_SHIFT_THRESHOLD;
        bossColor = lerpColor(COLORS.entityBoss, '#FF8800', t);
      }
      out.push({
        type: 'boss',
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        color: bossColor,
        opacity: 1.0,
        path: buildPath('boss', b.x, b.y, b.width, b.height, scale),
        glowPath: buildGlowPath('boss', b.x, b.y, b.width, b.height, scale),
        glowColor: toGlowColor(bossColor),
        shadowPath: buildShadowPath('boss', b.x, b.y, b.width, b.height, scale),
      });
    }

    // EX Burst beam (vertical beam above player)
    if (entities.exBurstTimer > 0 && p.active) {
      const beamX = p.x + p.width / 2 - EX_BURST_WIDTH / 2;
      out.push({
        type: 'exBeam',
        x: beamX,
        y: 0,
        width: EX_BURST_WIDTH,
        height: p.y,
        color: '#00E5FF',
        opacity: 0.35,
        blendMode: 'screen',
      });
    }

    // Boss laser beam
    if (entities.boss?.active) {
      const boss = entities.boss;
      if (boss.laserState === 'warning') {
        out.push({
          type: 'laserWarning',
          x: boss.laserX - BOSS_LASER_WIDTH / 2,
          y: boss.y + boss.height,
          width: BOSS_LASER_WIDTH,
          height: visibleHeight,
          color: '#FF004488',
          opacity: 0.3,
        });
      } else if (boss.laserState === 'firing') {
        out.push({
          type: 'laserBeam',
          x: boss.laserX - BOSS_LASER_WIDTH / 2,
          y: boss.y + boss.height,
          width: BOSS_LASER_WIDTH,
          height: visibleHeight,
          color: '#FF0044',
          opacity: 0.7,
          blendMode: 'screen',
        });
      }
    }

    // Shockwave effect
    if (entities.shockwaveTimer > 0) {
      const pcx = entities.player.x + entities.player.width / 2;
      const pcy = entities.player.y + entities.player.height / 2;
      const radius = JUST_TF_SHOCKWAVE_RADIUS;
      const opacity = entities.shockwaveTimer / SHOCKWAVE_EFFECT_DURATION;
      const swX = pcx - radius;
      const swY = pcy - radius;
      const swSize = radius * 2;
      out.push({
        type: 'shockwave',
        x: swX,
        y: swY,
        width: swSize,
        height: swSize,
        color: COLORS.white,
        opacity: opacity * 0.5,
        path: buildPath('shockwave', swX, swY, swSize, swSize, scale),
        blendMode: 'screen',
      });
    }

    // Graze ring effect (F3) — smaller ring than shockwave, cyan tint
    if (entities.grazeRingTimer > 0 && entities.player.active) {
      const gcx = entities.player.x + entities.player.width / 2;
      const gcy = entities.player.y + entities.player.height / 2;
      const grOpacity = entities.grazeRingTimer / GRAZE_RING_DURATION;
      const grX = gcx - GRAZE_RING_RADIUS;
      const grY = gcy - GRAZE_RING_RADIUS;
      const grSize = GRAZE_RING_RADIUS * 2;
      out.push({
        type: 'shockwave',
        x: grX,
        y: grY,
        width: grSize,
        height: grSize,
        color: COLORS.neonBlue,
        opacity: grOpacity * 0.4,
        path: buildPath('shockwave', grX, grY, grSize, grSize, scale),
        blendMode: 'screen',
      });
    }

    // Particles
    for (const pt of entities.particles) {
      if (!pt.active) continue;
      const opacity = pt.life / pt.maxLife;
      const px = pt.x - pt.size / 2;
      const py = pt.y - pt.size / 2;
      out.push({
        type: 'particle',
        x: px,
        y: py,
        width: pt.size,
        height: pt.size,
        color: pt.color,
        opacity,
        path: buildPath('particle', px, py, pt.size, pt.size, scale),
        blendMode: 'screen',
      });
    }

    // Apply screen shake offset to all entities — must also rebuild SVG paths
    // because path strings contain absolute coordinates baked during construction
    const shakeX = entities.shakeOffsetX;
    const shakeY = entities.shakeOffsetY;
    if (shakeX !== 0 || shakeY !== 0) {
      for (const e of out) {
        e.x += shakeX;
        e.y += shakeY;
        if (e.path) {
          e.path = buildPath(e.type, e.x, e.y, e.width, e.height, scale);
        }
        if (e.glowPath) {
          e.glowPath = buildGlowPath(e.type, e.x, e.y, e.width, e.height, scale);
        }
        if (e.shadowPath) {
          e.shadowPath = buildShadowPath(e.type, e.x, e.y, e.width, e.height, scale, e.depthScale);
        }
      }
    }

    // Score Popups (separate SharedValue — no UI thread filtering needed)
    for (const popup of entities.scorePopups) {
      if (!popup.active) continue;
      const lifeRatio = popup.life / popup.maxLife;
      const opacity = lifeRatio > 0.5 ? 1.0 : lifeRatio * 2;
      popups.push({
        x: popup.x + shakeX,
        y: popup.y + shakeY,
        text: popup.text,
        color: popup.color,
        opacity,
      });
    }

    // Screen overlays — danger (C2), boss phase (E1), awakened (E2)
    const store = useGameSessionStore.getState();
    const hpRatio = store.maxHp > 0 ? store.hp / store.maxHp : 1;
    const dangerOpacity = (hpRatio < DANGER_HP_THRESHOLD && hpRatio > 0 && entities.player.active)
      ? 0.15 + Math.sin(entities.stageTime * DANGER_PULSE_SPEED) * 0.1
      : 0;
    const bossPhaseOpacity = entities.isBossPhase ? 0.06 : 0;
    const awakenedOpacity = store.isAwakened ? 0.08 + Math.sin(entities.stageTime * 4) * 0.04 : 0;
    overlayState.value = { dangerOpacity, bossPhaseOpacity, awakenedOpacity };

    // Reanimated freezes objects assigned to SharedValue — pass copies to keep out/popups mutable
    renderData.value = out.slice();
    popupData.value = popups.slice();
    scrollYShared.value = entities.scrollY;
  };
}
