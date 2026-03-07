import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { RenderEntity } from '@/types/rendering';
import type { SharedValue } from 'react-native-reanimated';
import { IFRAME_BLINK_INTERVAL, SCORE_POPUP_FONT_SIZE } from '@/constants/balance';
import { GATE_COLORS } from '@/constants/colors';

export type RenderSyncTarget = SharedValue<RenderEntity[]>;

export function createSyncRenderSystem(
  renderData: RenderSyncTarget
): GameSystem<GameEntities> {
  const out: RenderEntity[] = [];

  return (entities) => {
    out.length = 0;

    // Boost Lane (background overlay)
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
      // i-frame blink effect
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
        color: '#4488FF',
        opacity,
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
        color: '#FF4444',
        opacity: 1.0,
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
        color: '#8B7355',
        opacity: 1.0,
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
        color: '#00D4FF',
        opacity: 1.0,
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
        color: '#FF006E',
        opacity: 1.0,
      });
    }

    // Gates
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
      out.push({
        type: 'boss',
        x: entities.boss.x,
        y: entities.boss.y,
        width: entities.boss.width,
        height: entities.boss.height,
        color: '#CC0000',
        opacity: 1.0,
      });
    }

    // Particles
    for (const p of entities.particles) {
      if (!p.active) continue;
      const opacity = p.life / p.maxLife;
      out.push({
        type: 'particle',
        x: p.x - p.size / 2,
        y: p.y - p.size / 2,
        width: p.size,
        height: p.size,
        color: p.color,
        opacity,
      });
    }

    // Score Popups
    for (const popup of entities.scorePopups) {
      if (!popup.active) continue;
      const lifeRatio = popup.life / popup.maxLife;
      const opacity = lifeRatio > 0.5 ? 1.0 : lifeRatio * 2;
      out.push({
        type: 'scorePopup',
        x: popup.x,
        y: popup.y,
        width: 0,
        height: 0,
        color: popup.color,
        opacity,
        text: popup.text,
        fontSize: SCORE_POPUP_FONT_SIZE,
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

    renderData.value = out;
  };
}
