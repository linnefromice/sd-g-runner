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

// === New Enhance gates ===

export const GATE_ATK_UP_15: GateDefinition = {
  type: 'enhance',
  displayLabel: 'ATK +15',
  effects: [{ kind: 'stat_add', stat: 'atk', value: 15 }],
};

export const GATE_FR_UP_30: GateDefinition = {
  type: 'enhance',
  displayLabel: 'FR +30%',
  effects: [{ kind: 'stat_multiply', stat: 'fireRate', value: 1.3 }],
};

// === New Recovery gates ===

export const GATE_HEAL_FULL: GateDefinition = {
  type: 'recovery',
  displayLabel: 'HP 100%',
  effects: [{ kind: 'heal_percent', value: 100 }],
};

// === New Tradeoff gates ===

export const GATE_RAPID_GLASS: GateDefinition = {
  type: 'tradeoff',
  displayLabel: 'FR×2 HP-30',
  effects: [
    { kind: 'stat_multiply', stat: 'fireRate', value: 2.0 },
    { kind: 'heal', value: -30 },
  ],
};

export const GATE_TANK: GateDefinition = {
  type: 'tradeoff',
  displayLabel: 'HP+50 SPD↓',
  effects: [
    { kind: 'stat_add', stat: 'hp', value: 50 },
    { kind: 'stat_multiply', stat: 'speed', value: 0.7 },
  ],
};

// === Growth gates ===

export const GATE_GROWTH_ATK: GateDefinition = {
  type: 'growth',
  displayLabel: 'ATK +5',
  effects: [{ kind: 'stat_add', stat: 'atk', value: 5 }],
};

export const GATE_GROWTH_SPD: GateDefinition = {
  type: 'growth',
  displayLabel: 'SPD +10%',
  effects: [{ kind: 'stat_multiply', stat: 'speed', value: 1.1 }],
};

// === Roulette gates ===

export const GATE_ROULETTE_ATK: GateDefinition = {
  type: 'roulette',
  displayLabel: 'ATK +10',
  effects: [{ kind: 'stat_add', stat: 'atk', value: 10 }],
  rouletteAlternateEffects: [{ kind: 'stat_add', stat: 'atk', value: -5 }],
  rouletteAlternateLabel: 'ATK -5',
};

export const GATE_ROULETTE_ATK_PENALTY: GateDefinition = {
  type: 'roulette',
  displayLabel: 'ATK -5',
  effects: [{ kind: 'stat_add', stat: 'atk', value: -5 }],
  rouletteAlternateEffects: [{ kind: 'stat_add', stat: 'atk', value: 10 }],
  rouletteAlternateLabel: 'ATK +10',
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

export const PAIR_ENHANCE_STRONG: GatePairConfig = {
  layout: 'forced',
  left: GATE_ATK_UP_15,
  right: GATE_FR_UP_30,
};

export const PAIR_RECOVERY_FULL: GatePairConfig = {
  layout: 'forced',
  left: GATE_HEAL_FULL,
  right: GATE_ATK_UP,
};

export const PAIR_TRADEOFF_EXTREME: GatePairConfig = {
  layout: 'optional',
  left: GATE_RAPID_GLASS,
  right: GATE_TANK,
};

export const PAIR_ATK_FR: GatePairConfig = {
  layout: 'forced',
  left: GATE_ATK_UP_10,
  right: GATE_FR_UP,
};

export const PAIR_GROWTH_ATK_SPD: GatePairConfig = {
  layout: 'forced',
  left: GATE_GROWTH_ATK,
  right: GATE_GROWTH_SPD,
};

export const PAIR_ROULETTE_ATK: GatePairConfig = {
  layout: 'forced',
  left: GATE_ROULETTE_ATK,
  right: GATE_ROULETTE_ATK_PENALTY,
};
