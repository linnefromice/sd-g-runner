/** Logical coordinate system: fixed width 320, Y dynamic by aspect ratio */
export const LOGICAL_WIDTH = 320;

/** Player movement bounds (§3.1) */
export const PLAYER_MIN_X = 16;
export const PLAYER_MAX_X = 304;
/** Player stays in bottom half: visibleHeight * 0.5 to visibleHeight - 48 */
export const PLAYER_Y_TOP_RATIO = 0.5;
export const PLAYER_Y_BOTTOM_MARGIN = 48;

/** Hitbox sizes (§3.2) — logical coordinates */
export const HITBOX = {
  player:       { width: 16, height: 16 },
  playerVisual: { width: 32, height: 40 },
  playerBullet: { width: 4,  height: 12 },
  enemy:        { width: 28, height: 28 },
  swarm:        { width: 16, height: 16 },
  phalanx:      { width: 36, height: 36 },
  juggernaut:   { width: 56, height: 48 },
  dodger:    { width: 28, height: 28 },
  splitter:  { width: 32, height: 32 },
  summoner:  { width: 36, height: 36 },
  sentinel:  { width: 44, height: 44 },
  carrier:   { width: 52, height: 48 },
  enemyBullet:  { width: 6,  height: 6  },
  gate:         { width: 140, height: 24 },
  boss:         { width: 200, height: 120 },
  debris:       { width: 40,  height: 40 },
} as const;

/** Gate layout (§9.3) */
export const GATE_FORCED_GAP = 40;
export const GATE_OPTIONAL_WIDTH = 100;

/** Object pool limits */
export const MAX_ENEMIES = 40;
export const MAX_PLAYER_BULLETS = 30;
export const MAX_ENEMY_BULLETS = 50;
export const MAX_GATES = 4;

export const MAX_DEBRIS = 10;

/** Calculate scale and visible height from screen dimensions */
export function getScreenMetrics(screenWidth: number, screenHeight: number) {
  const scale = screenWidth / LOGICAL_WIDTH;
  const visibleHeight = screenHeight / scale;
  return { scale, visibleHeight };
}

export const MAX_PARTICLES = 64;
export const MAX_SCORE_POPUPS = 16;
