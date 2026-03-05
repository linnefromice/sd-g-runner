/** Player initial stats (§6.1) */
export const PLAYER_INITIAL_HP = 100;
export const PLAYER_INITIAL_ATK = 10;
export const PLAYER_INITIAL_SPEED = 1.0;
export const PLAYER_INITIAL_FIRE_RATE = 1.0;

/** Base fire interval in ms (shooting every 200ms at 1.0 rate) */
export const BASE_FIRE_INTERVAL = 200;

/** i-frame (§6.3) */
export const IFRAME_DURATION = 1500;
export const IFRAME_BLINK_INTERVAL = 100;

/** Enemy base stats (§13.1) */
export const ENEMY_STATS = {
  stationary: { hp: 20, attackDamage: 10, attackInterval: 2.0, scoreValue: 100, creditValue: 1 },
  patrol:     { hp: 40, attackDamage: 10, attackInterval: 1.5, scoreValue: 200, creditValue: 2 },
  rush:       { hp: 15, attackDamage: 15, attackInterval: 0,   scoreValue: 100, creditValue: 1 },
} as const;

/** Scoring (§12.1) */
export const SCORE = {
  enemyKill: 100,
  patrolKill: 200,
  bossDamagePerPercent: 50,
  gatePass: 150,
  stageClear: 1000,
  bossStageClear: 3000,
} as const;

/** Credits (§14.2) */
export const CREDITS = {
  enemyKill: { min: 1, max: 3 },
  stageClear: 50,
  bossStageClear: 150,
} as const;

/** EX Burst (§11) */
export const EX_GAUGE_MAX = 100;
export const EX_GAIN = {
  enemyKill: 5,
  gatePass: 10,
  bossHit: 2,
} as const;

/** Combo / Awakened (§10) */
export const COMBO_THRESHOLD = 3;
export const AWAKENED_DURATION = 10000;

/** Boss (§7.3, §13.2) */
export const BOSS_BASE_HP = 500;
export const BOSS_HOVER_AMPLITUDE = 30;
export const BOSS_HOVER_PERIOD = 3000;
export const BOSS_Y_POSITION = 40;
export const BOSS_SPREAD_COUNT = 5;
export const BOSS_DRONE_COUNT = 3;

/** Movement speeds (logical units/sec) */
export const PLAYER_BULLET_SPEED = 400;
export const ENEMY_BULLET_SPEED = 150;
export const PLAYER_MOVE_SPEED = 200;
export const BASE_SCROLL_SPEED = 80;
