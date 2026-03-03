export type GateType = 'enhance' | 'refit' | 'tradeoff' | 'recovery';

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
}

export interface GatePairConfig {
  layout: 'forced' | 'optional';
  left: GateDefinition;
  right: GateDefinition;
}
