import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { EX_BURST_WIDTH, EX_BURST_DAMAGE, EX_BURST_TICK_INTERVAL } from '@/constants/balance';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { deactivateBullet } from '@/engine/entities/Bullet';
import { updateBossPhase } from '@/engine/systems/bossPhase';
import { applyEnemyKillReward } from '@/engine/systems/enemyKillReward';
import { onBossKill } from '@/engine/effects';

export const exBurstSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const store = useGameSessionStore.getState();
  if (!store.isEXBurstActive) return;

  const dtMs = time.delta;
  const newTimer = store.exBurstTimer - dtMs;
  const newTickTimer = store.exBurstTickTimer + dtMs;

  if (newTimer <= 0) {
    store.deactivateEXBurst();
    return;
  }

  // Update timers
  useGameSessionStore.setState({
    exBurstTimer: newTimer,
    exBurstTickTimer: newTickTimer >= EX_BURST_TICK_INTERVAL ? 0 : newTickTimer,
  });

  // Only apply damage on tick intervals
  if (newTickTimer < EX_BURST_TICK_INTERVAL) return;

  const player = entities.player;
  const beamLeft = player.x + player.width / 2 - EX_BURST_WIDTH / 2;
  const beamRight = player.x + player.width / 2 + EX_BURST_WIDTH / 2;
  const beamBottom = player.y;

  // Damage enemies in beam
  for (const enemy of entities.enemies) {
    if (!enemy.active) continue;
    const ecx = enemy.x + enemy.width / 2;
    const ecy = enemy.y + enemy.height / 2;
    if (ecx >= beamLeft && ecx <= beamRight && ecy <= beamBottom) {
      enemy.hp -= EX_BURST_DAMAGE;
      if (enemy.hp <= 0) applyEnemyKillReward(enemy, entities);
    }
  }

  // Damage boss in beam
  if (entities.boss?.active) {
    const bcx = entities.boss.x + entities.boss.width / 2;
    const bcy = entities.boss.y + entities.boss.height / 2;
    if (bcx >= beamLeft && bcx <= beamRight && bcy <= beamBottom) {
      entities.boss.hp -= EX_BURST_DAMAGE;
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

  // Destroy enemy bullets in beam
  for (const bullet of entities.enemyBullets) {
    if (!bullet.active) continue;
    const bx = bullet.x + bullet.width / 2;
    const by = bullet.y + bullet.height / 2;
    if (bx >= beamLeft && bx <= beamRight && by <= beamBottom) {
      deactivateBullet(bullet);
    }
  }

  // Destroy tradeoff gates in beam
  for (const gate of entities.gates) {
    if (!gate.active || gate.gateType !== 'tradeoff') continue;
    const gcx = gate.x + gate.width / 2;
    const gcy = gate.y + gate.height / 2;
    if (gcx >= beamLeft && gcx <= beamRight && gcy <= beamBottom) {
      gate.active = false;
    }
  }
};
