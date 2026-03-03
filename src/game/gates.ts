import type { GateDefinition, GatePairConfig } from '@/types/gates';

// === Enhance gates ===

export const GATE_ATK_UP: GateDefinition = {
  type: 'enhance',
  displayLabel: 'ATK +5',
  effects: [{ kind: 'stat_add', stat: 'atk', value: 5 }],
};

export const GATE_SPD_UP: GateDefinition = {
  type: 'enhance',
  displayLabel: 'SPD +10%',
  effects: [{ kind: 'stat_multiply', stat: 'speed', value: 1.1 }],
};

export const GATE_FR_UP: GateDefinition = {
  type: 'enhance',
  displayLabel: 'FR +20%',
  effects: [{ kind: 'stat_multiply', stat: 'fireRate', value: 1.2 }],
};

export const GATE_ATK_UP_10: GateDefinition = {
  type: 'enhance',
  displayLabel: 'ATK +10',
  effects: [{ kind: 'stat_add', stat: 'atk', value: 10 }],
};

// === Recovery gates ===

export const GATE_HEAL_20: GateDefinition = {
  type: 'recovery',
  displayLabel: 'HP +20',
  effects: [{ kind: 'heal', value: 20 }],
};

export const GATE_HEAL_30: GateDefinition = {
  type: 'recovery',
  displayLabel: 'HP +30',
  effects: [{ kind: 'heal', value: 30 }],
};

export const GATE_HEAL_50P: GateDefinition = {
  type: 'recovery',
  displayLabel: 'HP +50%',
  effects: [{ kind: 'heal_percent', value: 50 }],
};

// === Tradeoff gates ===

export const GATE_GLASS_CANNON: GateDefinition = {
  type: 'tradeoff',
  displayLabel: 'ATK↑ SPD↓',
  effects: [
    { kind: 'stat_add', stat: 'atk', value: 15 },
    { kind: 'stat_multiply', stat: 'speed', value: 0.8 },
  ],
};

export const GATE_SPEED_DEMON: GateDefinition = {
  type: 'tradeoff',
  displayLabel: 'SPD↑ ATK↓',
  effects: [
    { kind: 'stat_multiply', stat: 'speed', value: 1.3 },
    { kind: 'stat_multiply', stat: 'atk', value: 0.7 },
  ],
};

export const GATE_RAPID_FIRE: GateDefinition = {
  type: 'tradeoff',
  displayLabel: 'FR↑ ATK↓',
  effects: [
    { kind: 'stat_multiply', stat: 'fireRate', value: 1.5 },
    { kind: 'stat_multiply', stat: 'atk', value: 0.6 },
  ],
};

// === Refit gates ===

export const GATE_REFIT_HEAVY: GateDefinition = {
  type: 'refit',
  displayLabel: '→ Heavy',
  effects: [{ kind: 'refit', targetForm: 'SD_HeavyArtillery' }],
};

export const GATE_REFIT_SPEED: GateDefinition = {
  type: 'refit',
  displayLabel: '→ Speed',
  effects: [{ kind: 'refit', targetForm: 'SD_HighSpeed' }],
};

// === Gate pair configs ===

export const PAIR_ATK_SPD: GatePairConfig = {
  layout: 'forced',
  left: GATE_ATK_UP,
  right: GATE_SPD_UP,
};

export const PAIR_REFIT: GatePairConfig = {
  layout: 'forced',
  left: GATE_REFIT_HEAVY,
  right: GATE_REFIT_SPEED,
};

export const PAIR_RECOVERY: GatePairConfig = {
  layout: 'forced',
  left: GATE_HEAL_20,
  right: GATE_ATK_UP,
};

export const PAIR_TRADEOFF_OPTIONAL: GatePairConfig = {
  layout: 'optional',
  left: GATE_GLASS_CANNON,
  right: GATE_SPEED_DEMON,
};
