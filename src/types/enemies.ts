export type EnemyType = 'stationary' | 'patrol' | 'rush' | 'swarm' | 'phalanx' | 'juggernaut' | 'dodger' | 'splitter' | 'summoner';
export type BossAttackPattern = 'spread_shot' | 'laser_beam' | 'drone_summon';

export interface MovePattern {
  type: 'static' | 'horizontal_patrol' | 'rush_down' | 'sine_wave' | 'slow_descent';
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
