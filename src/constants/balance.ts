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
  swarm:      { hp: 1,  attackDamage: 5,  attackInterval: 0,   scoreValue: 30,  creditValue: 0 },
  phalanx:    { hp: 60, attackDamage: 15, attackInterval: 2.0, scoreValue: 300, creditValue: 4 },
  juggernaut: { hp: 120, attackDamage: 25, attackInterval: 1.5, scoreValue: 500, creditValue: 7 },
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
export const EX_BURST_DURATION = 2000;
export const EX_BURST_WIDTH = 80;
export const EX_BURST_DAMAGE = 50;
export const EX_BURST_TICK_INTERVAL = 100;

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
export const BOSS_DRONE_COUNTS = { 1: 3, 2: 4 } as const;
export const BOSS_LASER_WARNING_DURATION = 1000;
export const BOSS_LASER_FIRE_DURATION = 1500;
export const BOSS_LASER_WIDTH = 30;
export const BOSS_LASER_DAMAGE = 20;
export const BOSS_LASER_TICK_INTERVAL = 300;
export const BOSS_LASER_COOLDOWN = 4000;

/** Movement speeds (logical units/sec) */
export const PLAYER_BULLET_SPEED = 400;
export const ENEMY_BULLET_SPEED = 150;
export const PLAYER_MOVE_SPEED = 200;
export const BASE_SCROLL_SPEED = 80;

/** Transform System */
export const TRANSFORM_GAUGE_MAX = 100;
export const TRANSFORM_GAIN_ENEMY_KILL = 8;
export const TRANSFORM_GAIN_GATE_PASS = 12;
export const TRANSFORM_GAIN_PER_SECOND = 2;

/** Explosion bullet */
export const EXPLOSION_RADIUS = 40;

/** Debris */
export const DEBRIS_CONTACT_DAMAGE = 20;
export const DEBRIS_HP = 50;
export const DEBRIS_DESTROY_SCORE = 50;

/** Graze (near-miss) */
export const GRAZE_EX_GAIN = 3;
export const GRAZE_TF_GAIN = 2;
export const GRAZE_SCORE = 20;

/** Growth Gate */
export const GROWTH_GATE_INITIAL_RATIO = 0.5;
export const GROWTH_GATE_MAX_RATIO = 3.0;
export const GROWTH_GATE_PER_HIT = 1;

/** Roulette Gate */
export const ROULETTE_INTERVAL = 500;

/** Boost Lane */
export const BOOST_LANE_SCORE_MULTIPLIER = 1.5;
export const BOOST_LANE_SCROLL_MULTIPLIER = 1.3;

/** Just TF / Parry */
export const JUST_TF_WINDOW = 200;
export const JUST_TF_SHOCKWAVE_RADIUS = 60;
export const JUST_TF_SHOCKWAVE_DAMAGE = 30;
export const JUST_TF_SCORE = 300;
export const JUST_TF_EX_GAIN = 15;
export const SHOCKWAVE_EFFECT_DURATION = 200;

/** Hit Stop */
export const HIT_STOP_ENEMY_KILL = 50;
export const HIT_STOP_PLAYER_HIT = 50;
export const HIT_STOP_PARRY = 50;
export const HIT_STOP_BOSS_KILL = 150;

/** Screen Shake */
export const SHAKE_ENEMY_KILL_INTENSITY = 2;
export const SHAKE_ENEMY_KILL_DURATION = 100;
export const SHAKE_PLAYER_HIT_INTENSITY = 4;
export const SHAKE_PLAYER_HIT_DURATION = 150;
export const SHAKE_PARRY_INTENSITY = 4;
export const SHAKE_PARRY_DURATION = 150;
export const SHAKE_BOSS_KILL_INTENSITY = 8;
export const SHAKE_BOSS_KILL_DURATION = 300;

/** Particles */
export const PARTICLE_ENEMY_KILL_COUNT = 7;
export const PARTICLE_PLAYER_HIT_COUNT = 5;
export const PARTICLE_GATE_PASS_COUNT = 4;
export const PARTICLE_EX_BURST_COUNT = 9;
export const PARTICLE_PARRY_COUNT = 8;
export const PARTICLE_BOSS_KILL_COUNT = 16;
export const PARTICLE_DEFAULT_LIFE = 400;
export const PARTICLE_DEFAULT_SPEED = 80;
export const PARTICLE_DEFAULT_SIZE = 4;
export const PARTICLE_BOSS_SIZE = 8;

export const PARTICLE_BULLET_IMPACT_COUNT = 3;
export const PARTICLE_BULLET_IMPACT_LIFE = 200;
export const PARTICLE_DEBRIS_DESTROY_COUNT = 4;

/** Score Popup */
export const SCORE_POPUP_SPEED = 40;
export const SCORE_POPUP_LIFE = 800;
export const SCORE_POPUP_FONT_SIZE = 12;
