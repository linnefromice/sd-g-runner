export type GateType = 'enhance' | 'refit' | 'tradeoff' | 'recovery' | 'growth' | 'roulette';

export type StatKey = 'atk' | 'speed' | 'fireRate' | 'hp' | 'maxHp';

export type GateEffect =
  | { kind: 'stat_add'; stat: StatKey; value: number }
  | { kind: 'stat_multiply'; stat: StatKey; value: number }
  | { kind: 'refit'; targetForm: import('./forms').MechaFormId }
  | { kind: 'heal'; value: number }
  | { kind: 'heal_percent'; value: number };

export interface GateDefinition {
  type: GateType;
  displayLabel: string;
  effects: GateEffect[];
  rouletteAlternateEffects?: GateEffect[]; // For roulette: the alternate set
  rouletteAlternateLabel?: string; // For roulette: the alternate label
}

export interface GatePairConfig {
  layout: 'forced' | 'optional';
  left: GateDefinition;
  right: GateDefinition;
}
