import type { GateEntity } from '@/types/entities';
import type { GateDefinition, GateEffect, GatePairConfig } from '@/types/gates';
import { HITBOX, GATE_OPTIONAL_WIDTH, LOGICAL_WIDTH } from '@/constants/dimensions';
import { GROWTH_GATE_INITIAL_RATIO, GROWTH_GATE_MAX_RATIO } from '@/constants/balance';

let nextId = 0;

/** Generate a display label from a gate effect (e.g. "ATK +3", "SPD ×1.1") */
export function generateGateLabel(effect: GateEffect): string {
  switch (effect.kind) {
    case 'stat_add': {
      const sign = effect.value >= 0 ? '+' : '';
      return `${effect.stat.toUpperCase()} ${sign}${effect.value}`;
    }
    case 'stat_multiply':
      return `${effect.stat.toUpperCase()} ×${effect.value}`;
    case 'heal':
      return `HP ${effect.value >= 0 ? '+' : ''}${effect.value}`;
    case 'heal_percent':
      return `HP ${effect.value >= 0 ? '+' : ''}${effect.value}%`;
    case 'refit':
      return `→ ${effect.targetForm}`;
  }
}

function createSingleGate(def: GateDefinition, x: number, y: number, width: number): GateEntity {
  const gate: GateEntity = {
    id: `gate_${nextId++}`,
    type: 'gate',
    gateType: def.type,
    x,
    y,
    width,
    height: HITBOX.gate.height,
    active: true,
    displayLabel: def.displayLabel,
    effects: [...def.effects],
    passed: false,
    // Growth fields
    growthHits: 0,
    growthMax: undefined,
    baseEffectValue: undefined,
    // Roulette fields
    rouletteEffects: undefined,
    rouletteTimer: undefined,
    rouletteIndex: undefined,
  };

  if (def.type === 'growth' && def.effects.length > 0) {
    const firstEffect = def.effects[0];
    if (firstEffect.kind !== 'refit') {
      gate.baseEffectValue = firstEffect.value;
      // Initial value is INITIAL_RATIO * base, max is MAX_RATIO * base
      gate.effects = [{ ...firstEffect, value: Math.round(firstEffect.value * GROWTH_GATE_INITIAL_RATIO * 10) / 10 }];
      gate.growthMax = Math.ceil(firstEffect.value * GROWTH_GATE_MAX_RATIO);
      // Update display label with initial value
      gate.displayLabel = generateGateLabel(gate.effects[0]);
    }
  }

  if (def.type === 'roulette' && def.rouletteAlternateEffects) {
    gate.rouletteEffects = [[...def.effects], [...def.rouletteAlternateEffects]];
    gate.rouletteTimer = 0;
    gate.rouletteIndex = 0;
  }

  return gate;
}

export function createGatePair(config: GatePairConfig, y: number): [GateEntity, GateEntity] {
  if (config.layout === 'forced') {
    // Forced: two gates cover full width (140 + 40gap + 140 = 320)
    const gateWidth = HITBOX.gate.width;
    const leftX = 0;
    const rightX = LOGICAL_WIDTH - gateWidth;
    const left = createSingleGate(config.left, leftX, y, gateWidth);
    const right = createSingleGate(config.right, rightX, y, gateWidth);
    left.forced = true;
    right.forced = true;
    return [left, right];
  } else {
    // Optional: narrower gates with gaps on sides and center
    const gateWidth = GATE_OPTIONAL_WIDTH;
    const totalGap = LOGICAL_WIDTH - gateWidth * 2;
    const sideGap = totalGap / 3;
    const leftX = sideGap;
    const rightX = LOGICAL_WIDTH - sideGap - gateWidth;
    return [
      createSingleGate(config.left, leftX, y, gateWidth),
      createSingleGate(config.right, rightX, y, gateWidth),
    ];
  }
}

export function deactivateGate(gate: GateEntity): void {
  gate.active = false;
  gate.x = -100;
  gate.y = -100;
}
