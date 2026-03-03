export type EnemyType = 'stationary' | 'patrol' | 'rush';
export type BossAttackPattern = 'spread_shot' | 'laser_beam' | 'drone_summon';

export interface MovePattern {
  type: 'static' | 'horizontal_patrol' | 'rush_down';
  amplitude?: number;
  speed?: number;
}

export interface EnemyDefinition {
  type: EnemyType;
  hp: number;
  attackDamage: number;
  attackInterval: number;
  movePattern: MovePattern;
  scoreValue: number;
  creditValue: number;
}
