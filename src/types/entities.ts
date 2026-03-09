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
  /** Ring buffer of recent positions for trail rendering */
  trailHistory: { x: number; y: number }[];
  /** Current write index in trailHistory ring buffer */
  trailIndex: number;
  /** Frame counter for trail sampling */
  trailFrameCount: number;
}

export interface EnemyEntity extends BaseEntity {
  type: 'enemy';
  enemyType: import('./enemies').EnemyType;
  hp: number;
  maxHp: number;
  shootTimer: number;
  moveTimer: number;
  moveDirection: number; // -1 or 1, for patrol type
  /** Hit flash timer (ms) — when > 0, entity renders white */
  flashTimer: number;
  /** Stage time when entity was spawned (for fade-in effect) */
  spawnTime: number;
}

export interface BulletEntity extends BaseEntity {
  type: 'playerBullet' | 'enemyBullet';
  damage: number;
  speed: number;
  homing: boolean;
  specialAbility?: import('./forms').SpecialAbilityType;
  piercedEnemyIds?: Set<string>;
  grazed?: boolean;
  /** Directional velocity X (logical units/sec). When set, overrides straight-line movement. */
  vx?: number;
  /** Directional velocity Y (logical units/sec). When set, overrides straight-line movement. */
  vy?: number;
  /** Sine-wave horizontal amplitude (logical units). Creates oscillating bullet trajectory. */
  waveAmplitude?: number;
}

export interface GateEntity extends BaseEntity {
  type: 'gate';
  gateType: import('./gates').GateType;
  displayLabel: string;
  effects: import('./gates').GateEffect[];
  passed: boolean;
  /** Whether this gate is part of a forced pair (no gap to dodge) */
  forced?: boolean;
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
  /** Stage time when entity was spawned (for fade-in effect) */
  spawnTime: number;
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
  /** Graze ring visual effect timer (ms) */
  grazeRingTimer: number;
  /** Gate pass flash timer (ms) — B1 */
  gateFlashTimer: number;
  /** Gate pass flash color — B1 */
  gateFlashColor: string;
  /** Awakened mode countdown timer (ms) — managed by AwakenedSystem */
  awakenedTimer: number;
  /** EX Burst countdown timer (ms) — managed by EXBurstSystem */
  exBurstTimer: number;
  /** EX Burst damage tick accumulator (ms) */
  exBurstTickTimer: number;
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
