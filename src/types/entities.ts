// Entity types for the game loop (plain JS objects, NOT React state)

export type EntityType =
  | 'player'
  | 'enemy'
  | 'playerBullet'
  | 'enemyBullet'
  | 'gate'
  | 'boss'
  | 'debris';

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
  specialAbility?: import('./forms').SpecialAbilityType;
  piercedEnemyIds?: Set<string>;
  grazed?: boolean;
}

export interface GateEntity extends BaseEntity {
  type: 'gate';
  gateType: import('./gates').GateType;
  displayLabel: string;
  effects: import('./gates').GateEffect[];
  passed: boolean;
  // Growth gate fields
  growthHits?: number;
  growthMax?: number;
  baseEffectValue?: number;
  // Roulette gate fields
  rouletteEffects?: import('./gates').GateEffect[][];
  rouletteTimer?: number;
  rouletteIndex?: number;
}

export interface BossEntity extends BaseEntity {
  type: 'boss';
  bossIndex: number;
  hp: number;
  maxHp: number;
  phase: 'spread' | 'laser' | 'all';
  attackTimer: number;
  hoverTimer: number;
  hoverDirection: number;
  drones: string[];
  laserState: 'idle' | 'warning' | 'firing';
  laserTimer: number;
  laserX: number;
  laserTickTimer: number;
}

export interface DebrisEntity extends BaseEntity {
  type: 'debris';
  hp: number;
  maxHp: number;
}

export interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
}

export interface ScorePopupEntity {
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  active: boolean;
}

export type GameEntity =
  | PlayerEntity
  | EnemyEntity
  | BulletEntity
  | GateEntity
  | BossEntity
  | DebrisEntity;

/** All game entities stored as flat arrays for pool management */
export interface GameEntities {
  player: PlayerEntity;
  enemies: EnemyEntity[];
  playerBullets: BulletEntity[];
  enemyBullets: BulletEntity[];
  gates: GateEntity[];
  debris: DebrisEntity[];
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
  /** Boost lane zone (null when no lane active) */
  boostLane: { x: number; width: number; active: boolean } | null;
  /** Whether the player is currently inside the boost lane */
  isPlayerBoosted: boolean;
  /** Just TF parry window timer (ms) */
  justTFTimer: number;
  /** Shockwave visual effect timer (ms) */
  shockwaveTimer: number;
  /** Background scroll offset */
  scrollY: number;
  /** Screen dimensions for boundary checks */
  screen: { width: number; height: number; scale: number; visibleHeight: number };
  /** Hit stop freeze timer (ms) */
  hitStopTimer: number;
  /** Screen shake timer (ms) */
  shakeTimer: number;
  /** Screen shake intensity (px in logical coords) */
  shakeIntensity: number;
  /** Current frame shake offset X (logical coords) */
  shakeOffsetX: number;
  /** Current frame shake offset Y (logical coords) */
  shakeOffsetY: number;
  /** Particle pool */
  particles: ParticleEntity[];
  /** Score popup pool */
  scorePopups: ScorePopupEntity[];
}
