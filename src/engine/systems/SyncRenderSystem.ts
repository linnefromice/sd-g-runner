import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { RenderEntity } from '@/types/rendering';
import type { SharedValue } from 'react-native-reanimated';
import { IFRAME_BLINK_INTERVAL, SHOCKWAVE_EFFECT_DURATION, JUST_TF_SHOCKWAVE_RADIUS } from '@/constants/balance';
import { COLORS, GATE_COLORS } from '@/constants/colors';
import { getEntityPath } from '@/rendering/shapes';

export type PopupRenderData = {
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
};

export type RenderSyncTarget = SharedValue<RenderEntity[]>;
export type PopupSyncTarget = SharedValue<PopupRenderData[]>;

function buildPath(type: string, x: number, y: number, w: number, h: number, scale: number): string | undefined {
  return getEntityPath(type, x * scale, y * scale, w * scale, h * scale) ?? undefined;
}

export function createSyncRenderSystem(
  renderData: RenderSyncTarget,
  popupData: PopupSyncTarget,
  scrollYShared: SharedValue<number>,
  scale: number = 1,
): GameSystem<GameEntities> {
  const out: RenderEntity[] = [];
  const popups: PopupRenderData[] = [];

  return (entities) => {
    out.length = 0;
    popups.length = 0;

    // Boost Lane (background overlay) — no path, rect-based
    if (entities.boostLane?.active) {
      out.push({
        type: 'boostLane',
        x: entities.boostLane.x,
        y: 0,
        width: entities.boostLane.width,
        height: entities.screen.visibleHeight,
        color: '#FFD60033',
        opacity: 1.0,
      });
    }

    // Player
    const p = entities.player;
    if (p.active) {
      let opacity = 1.0;
      if (p.isInvincible) {
        opacity = Math.floor(p.invincibleTimer / IFRAME_BLINK_INTERVAL) % 2 === 0 ? 0.3 : 1.0;
      }
      out.push({
        type: 'player',
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        color: COLORS.entityPlayer,
        opacity,
        path: buildPath('player', p.x, p.y, p.width, p.height, scale),
      });
    }

    // Enemies
    for (const e of entities.enemies) {
      if (!e.active) continue;
      out.push({
        type: 'enemy',
        x: e.x,
        y: e.y,
        width: e.width,
        height: e.height,
        color: COLORS.entityEnemy,
        opacity: 1.0,
        path: buildPath('enemy', e.x, e.y, e.width, e.height, scale),
      });
    }

    // Debris
    for (const d of entities.debris) {
      if (!d.active) continue;
      out.push({
        type: 'debris',
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height,
        color: COLORS.entityDebris,
        opacity: 1.0,
        path: buildPath('debris', d.x, d.y, d.width, d.height, scale),
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
      });
    }

    // Enemy bullets
    for (const b of entities.enemyBullets) {
      if (!b.active) continue;
      out.push({
        type: 'enemyBullet',
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        color: COLORS.entityEnemyBullet,
        opacity: 1.0,
        path: buildPath('enemyBullet', b.x, b.y, b.width, b.height, scale),
      });
    }

    // Gates — no path, rect-based
    for (const g of entities.gates) {
      if (!g.active) continue;
      out.push({
        type: 'gate',
        x: g.x,
        y: g.y,
        width: g.width,
        height: g.height,
        color: GATE_COLORS[g.gateType],
        opacity: 1.0,
        label: g.displayLabel,
      });
    }

    // Boss
    if (entities.boss?.active) {
      const b = entities.boss;
      out.push({
        type: 'boss',
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        color: COLORS.entityBoss,
        opacity: 1.0,
        path: buildPath('boss', b.x, b.y, b.width, b.height, scale),
      });
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
      });
    }

    // Apply screen shake offset to all entities
    const shakeX = entities.shakeOffsetX;
    const shakeY = entities.shakeOffsetY;
    if (shakeX !== 0 || shakeY !== 0) {
      for (const e of out) {
        e.x += shakeX;
        e.y += shakeY;
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

    // Reanimated freezes objects assigned to SharedValue — pass copies to keep out/popups mutable
    renderData.value = out.slice();
    popupData.value = popups.slice();
    scrollYShared.value = entities.scrollY;
  };
}
