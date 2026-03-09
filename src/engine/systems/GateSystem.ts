import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { checkAABBOverlap, getPlayerHitbox } from '@/engine/collision';
import { deactivateGate, generateGateLabel } from '@/engine/entities/Gate';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { SCORE, EX_GAIN, TRANSFORM_GAIN_GATE_PASS, ROULETTE_INTERVAL, FORM_XP_GATE_ENHANCE, COMBO_THRESHOLD, GATE_FLASH_DURATION } from '@/constants/balance';
import { onGatePass, onComboMax } from '@/engine/effects';
import { GATE_COLORS } from '@/constants/colors';
import { AudioManager } from '@/audio/AudioManager';
import { HapticsManager } from '@/audio/HapticsManager';

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

    // Audio & haptics
    AudioManager.playSe('gatePass');
    HapticsManager.gatePass();

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
          AudioManager.playSe('refit');
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
    // B2: check before increment — incrementCombo resets count on awakened trigger
    const willReachComboMax = store.comboCount === COMBO_THRESHOLD - 1;
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

    // Form XP for enhance/growth/roulette gates
    if (gate.gateType === 'enhance' || gate.gateType === 'growth' || gate.gateType === 'roulette') {
      store.addFormXP(store.currentForm, FORM_XP_GATE_ENHANCE);
    }

    // Visual effect (capture position BEFORE deactivation moves gate off-screen)
    const gateColor = GATE_COLORS[gate.gateType];
    const cx = gate.x + gate.width / 2;
    const cy = gate.y + gate.height / 2;
    onGatePass(entities, cx, cy, gateColor);

    // B1: gate pass screen flash
    entities.gateFlashTimer = GATE_FLASH_DURATION;
    entities.gateFlashColor = gateColor;

    // B2: combo max particles (gold burst when combo threshold reached)
    if (willReachComboMax && (gate.gateType === 'enhance' || gate.gateType === 'growth' || gate.gateType === 'roulette')) {
      onComboMax(entities, player.x + player.width / 2, player.y + player.height / 2);
    }

    // Deactivate after visual effect capture
    deactivateGate(gate);
  }
};
