// Entity types for the game loop (plain JS objects, NOT React state)

export type EntityType =
  | 'player'
  | 'enemy'
  | 'playerBullet'
  | 'enemyBullet'
  | 'gate'
  | 'boss';

export interface BaseEntity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

export interface PlayerEntity extends BaseEntity {
  type: 'player';
  isInvincible: boolean;
  invincibleTimer: number;
  /** When set, player slides toward this position (from tap gesture) */
  targetX: number | null;
  targetY: number | null;
}

export interface EnemyEntity extends BaseEntity {
  type: 'enemy';
  enemyType: import('./enemies').EnemyType;
  hp: number;
  maxHp: number;
  shootTimer: number;
  moveTimer: number;
  moveDirection: number; // -1 or 1, for patrol type
}

export interface BulletEntity extends BaseEntity {
  type: 'playerBullet' | 'enemyBullet';
  damage: number;
  speed: number;
  homing: boolean;
}

export interface GateEntity extends BaseEntity {
  type: 'gate';
  gateType: import('./gates').GateType;
  displayLabel: string;
  effects: import('./gates').GateEffect[];
  passed: boolean;
}

export interface BossEntity extends BaseEntity {
  type: 'boss';
  hp: number;
  maxHp: number;
  phase: 'spread' | 'laser' | 'all';
  attackTimer: number;
  hoverTimer: number;
  hoverDirection: number;
  drones: string[];
}

export type GameEntity =
  | PlayerEntity
  | EnemyEntity
  | BulletEntity
  | GateEntity
  | BossEntity;

/** All game entities stored as flat arrays for pool management */
export interface GameEntities {
  player: PlayerEntity;
  enemies: EnemyEntity[];
  playerBullets: BulletEntity[];
  enemyBullets: BulletEntity[];
  gates: GateEntity[];
  boss: BossEntity | null;
  /** Stage timeline progress in seconds */
  stageTime: number;
  /** Stage duration in seconds (for non-boss stage completion) */
  stageDuration: number;
  /** Whether this is a boss stage */
  isBossStage: boolean;
  /** Current timeline event index */
  timelineIndex: number;
  /** Is the game in boss phase? */
  isBossPhase: boolean;
  /** Background scroll offset */
  scrollY: number;
  /** Screen dimensions for boundary checks */
  screen: { width: number; height: number; scale: number; visibleHeight: number };
}
