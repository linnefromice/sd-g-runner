import type { GameEntities, ParticleEntity, ScorePopupEntity } from '@/types/entities';
import { onEnemyKill, onPlayerHit, onParry, onGatePass, onBossKill, onGraze, onDebrisDestroy } from '../effects';

function createMockEntities(): Pick<GameEntities, 'hitStopTimer' | 'shakeTimer' | 'shakeIntensity' | 'shakeOffsetX' | 'shakeOffsetY' | 'particles' | 'scorePopups'> {
  return {
    hitStopTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    shakeOffsetX: 0,
    shakeOffsetY: 0,
    particles: Array.from({ length: 64 }, (): ParticleEntity => ({
      x: -100, y: -100, vx: 0, vy: 0,
      life: 0, maxLife: 0, color: '#FFF', size: 4, active: false,
    })),
    scorePopups: Array.from({ length: 16 }, (): ScorePopupEntity => ({
      x: -100, y: -100, vy: 0,
      text: '', life: 0, maxLife: 0, color: '#FFF', active: false,
    })),
  };
}

describe('effects', () => {
  test('onEnemyKill triggers hit stop, shake, particles, and popup', () => {
    const e = createMockEntities() as GameEntities;
    onEnemyKill(e, 100, 200, 100);

    expect(e.hitStopTimer).toBeGreaterThan(0);
    expect(e.shakeTimer).toBeGreaterThan(0);
    expect(e.shakeIntensity).toBeGreaterThan(0);

    const activeParticles = e.particles.filter(p => p.active);
    expect(activeParticles.length).toBeGreaterThanOrEqual(5);

    const activePopups = e.scorePopups.filter(p => p.active);
    expect(activePopups.length).toBe(1);
    expect(activePopups[0].text).toBe('+100');
  });

  test('onPlayerHit triggers hit stop and shake but no popup', () => {
    const e = createMockEntities() as GameEntities;
    onPlayerHit(e, 50, 100);

    expect(e.hitStopTimer).toBeGreaterThan(0);
    expect(e.shakeIntensity).toBe(4);
    expect(e.scorePopups.filter(p => p.active).length).toBe(0);
  });

  test('onBossKill triggers large shake and many particles', () => {
    const e = createMockEntities() as GameEntities;
    onBossKill(e, 160, 60);

    expect(e.hitStopTimer).toBe(150);
    expect(e.shakeIntensity).toBe(8);
    expect(e.particles.filter(p => p.active).length).toBeGreaterThanOrEqual(16);
  });

  test('onGraze spawns score popup only', () => {
    const e = createMockEntities() as GameEntities;
    onGraze(e, 100, 200);

    expect(e.hitStopTimer).toBe(0);
    expect(e.shakeTimer).toBe(0);
    const popups = e.scorePopups.filter(p => p.active);
    expect(popups.length).toBe(1);
    expect(popups[0].text).toBe('+20');
  });

  test('onGatePass spawns horizontal particles', () => {
    const e = createMockEntities() as GameEntities;
    onGatePass(e, 160, 300, '#00FF88');

    const activeParticles = e.particles.filter(p => p.active);
    expect(activeParticles.length).toBe(4);
    expect(activeParticles[0].color).toBe('#00FF88');
  });

  test('particle pool reuses inactive slots', () => {
    const e = createMockEntities() as GameEntities;
    onBossKill(e, 100, 100);
    const firstCount = e.particles.filter(p => p.active).length;

    for (const p of e.particles) p.active = false;

    onEnemyKill(e, 100, 100, 200);
    const secondCount = e.particles.filter(p => p.active).length;
    expect(secondCount).toBeGreaterThan(0);
    expect(secondCount).toBeLessThan(firstCount);
  });

  test('stronger shake overrides weaker one', () => {
    const e = createMockEntities() as GameEntities;
    onEnemyKill(e, 100, 100, 100);
    expect(e.shakeIntensity).toBe(2);

    onPlayerHit(e, 100, 100);
    expect(e.shakeIntensity).toBe(4);
  });

  test('onDebrisDestroy spawns particles and popup', () => {
    const e = createMockEntities() as GameEntities;
    onDebrisDestroy(e, 150, 250);

    expect(e.particles.filter(p => p.active).length).toBe(4);
    const popups = e.scorePopups.filter(p => p.active);
    expect(popups.length).toBe(1);
    expect(popups[0].text).toBe('+50');
  });

  test('onParry spawns particles, popup, and triggers shake', () => {
    const e = createMockEntities() as GameEntities;
    onParry(e, 100, 200);

    expect(e.hitStopTimer).toBe(50);
    expect(e.shakeIntensity).toBe(4);
    expect(e.particles.filter(p => p.active).length).toBe(8);
    const popups = e.scorePopups.filter(p => p.active);
    expect(popups.length).toBe(1);
    expect(popups[0].text).toBe('+300');
  });
});
