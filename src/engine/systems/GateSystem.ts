import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { checkAABBOverlap, getPlayerHitbox } from '@/engine/collision';
import { deactivateGate, generateGateLabel } from '@/engine/entities/Gate';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { SCORE, EX_GAIN, TRANSFORM_GAIN_GATE_PASS, ROULETTE_INTERVAL } from '@/constants/balance';
import { onGatePass } from '@/engine/effects';

export const gateSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const player = entities.player;
  if (!player.active) return;

  // Roulette timer update
  for (const gate of entities.gates) {
    if (!gate.active || gate.passed || gate.gateType !== 'roulette') continue;
    if (gate.rouletteEffects && gate.rouletteTimer != null && gate.rouletteIndex != null) {
      gate.rouletteTimer += time.delta;
      if (gate.rouletteTimer >= ROULETTE_INTERVAL) {
        gate.rouletteTimer -= ROULETTE_INTERVAL;
        gate.rouletteIndex = 1 - gate.rouletteIndex;
        gate.effects = gate.rouletteEffects[gate.rouletteIndex];
        gate.displayLabel = generateGateLabel(gate.effects[0]);
      }
    }
  }

  const playerHB = getPlayerHitbox(player);
  const store = useGameSessionStore.getState();

  for (const gate of entities.gates) {
    if (!gate.active || gate.passed) continue;
    if (!checkAABBOverlap(playerHB, gate)) continue;

    gate.passed = true;

    // Apply effects
    for (const effect of gate.effects) {
      switch (effect.kind) {
        case 'stat_add':
          store.addStat(effect.stat, effect.value);
          break;
        case 'stat_multiply':
          store.multiplyStat(effect.stat, effect.value);
          break;
        case 'refit':
          store.setForm(effect.targetForm);
          break;
        case 'heal':
          store.heal(effect.value);
          break;
        case 'heal_percent':
          store.healPercent(effect.value);
          break;
      }
    }

    // Scoring + EX
    store.addScore(SCORE.gatePass);
    if (!store.isEXBurstActive) store.addExGauge(EX_GAIN.gatePass);
    store.addTransformGauge(TRANSFORM_GAIN_GATE_PASS);

    // Combo tracking (§10.2)
    switch (gate.gateType) {
      case 'enhance':
        store.incrementCombo();
        break;
      case 'recovery':
        // No change
        break;
      case 'growth':
      case 'roulette':
        store.incrementCombo();
        break;
      case 'tradeoff':
      case 'refit':
        store.resetCombo();
        break;
    }

    // Visual effect (capture position BEFORE deactivation moves gate off-screen)
    const gateColor = gate.gateType === 'enhance' ? '#00FF88' :
                      gate.gateType === 'refit' ? '#00D4FF' :
                      gate.gateType === 'tradeoff' ? '#FFD600' :
                      gate.gateType === 'growth' ? '#66FF66' :
                      gate.gateType === 'roulette' ? '#FF8800' : '#FF69B4';
    const cx = gate.x + gate.width / 2;
    const cy = gate.y + gate.height / 2;
    onGatePass(entities, cx, cy, gateColor);

    // Deactivate after visual effect capture
    deactivateGate(gate);
  }
};
