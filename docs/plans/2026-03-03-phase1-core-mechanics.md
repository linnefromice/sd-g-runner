# Phase 1: Core Mechanics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the full Phase 1 game: vertical scrolling, player movement, auto-shooting, enemies, gates, forms, boss battle, HP/damage, scoring, and sound framework.

**Architecture:** Custom `useGameLoop` (rAF 60fps) drives Systems that mutate plain JS entity objects. A sync system copies state to Reanimated SharedValues. Skia Canvas reads SharedValues via `useDerivedValue`. HUD uses Zustand with event-driven updates only.

**Tech Stack:** React Native + Expo, @shopify/react-native-skia, react-native-reanimated, zustand, expo-av, TypeScript

---

## Prerequisites: Jest Setup

### Task 0: Set up Jest test infrastructure

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`
- Create: `jest.setup.js`

**Step 1: Install Jest dependencies**

Run:
```bash
npx expo install -- --save-dev jest @testing-library/react-native jest-expo
```

**Step 2: Create jest.config.js**

```js
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|@shopify/react-native-skia|react-native-reanimated)',
  ],
};
```

**Step 3: Create jest.setup.js**

```js
// Minimal setup - add mocks as needed
```

**Step 4: Add test script to package.json**

Add to `"scripts"`:
```json
"test": "jest --passWithNoTests"
```

**Step 5: Run tests to verify setup**

Run: `npx jest --passWithNoTests`
Expected: `No tests found` or `Test Suites: 0 total`

**Step 6: Commit**

```bash
git add jest.config.js jest.setup.js package.json
git commit -m "chore: Add Jest test infrastructure"
```

---

## Layer 1: Type Definitions + Constants

### Task 1: Create entity and common types

**Files:**
- Create: `src/types/entities.ts`

```typescript
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
  drones: string[]; // IDs of spawned drone entities
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
  /** Current timeline event index */
  timelineIndex: number;
  /** Is the game in boss phase? */
  isBossPhase: boolean;
  /** Background scroll offset */
  scrollY: number;
  /** Screen dimensions for boundary checks */
  screen: { width: number; height: number; scale: number; visibleHeight: number };
}
```

### Task 2: Create form types

**Files:**
- Create: `src/types/forms.ts`

```typescript
export type MechaFormId =
  | 'SD_Standard'
  | 'SD_HeavyArtillery'
  | 'SD_HighSpeed'
  | 'SD_Awakened';

export type SpecialAbilityType =
  | 'explosion_radius'
  | 'pierce'
  | 'homing_invincible'
  | 'none';

export interface BulletConfig {
  width: number;
  height: number;
  speed: number;
  color: string;
  count: number; // bullets per shot (1 = single, 3 = spread, etc.)
}

export interface SpriteConfig {
  bodyColor: string;
  accentColor: string;
  glowColor: string;
}

export interface MechaFormDefinition {
  id: MechaFormId;
  displayName: string;
  moveSpeedMultiplier: number;
  attackMultiplier: number;
  fireRateMultiplier: number;
  specialAbility: SpecialAbilityType;
  isTimeLimited: boolean;
  spriteConfig: SpriteConfig;
  bulletConfig: BulletConfig;
}
```

### Task 3: Create gate types

**Files:**
- Create: `src/types/gates.ts`

```typescript
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
```

### Task 4: Create enemy types

**Files:**
- Create: `src/types/enemies.ts`

```typescript
export type EnemyType = 'stationary' | 'patrol' | 'rush';
export type BossAttackPattern = 'spread_shot' | 'laser_beam' | 'drone_summon';

export interface MovePattern {
  type: 'static' | 'horizontal_patrol' | 'rush_down';
  amplitude?: number; // for patrol: horizontal movement range
  speed?: number;     // for patrol/rush: movement speed
}

export interface EnemyDefinition {
  type: EnemyType;
  hp: number;
  attackDamage: number;
  attackInterval: number; // seconds between shots
  movePattern: MovePattern;
  scoreValue: number;
  creditValue: number;
}
```

### Task 5: Create stage types

**Files:**
- Create: `src/types/stages.ts`

```typescript
import type { EnemyType } from './enemies';
import type { GatePairConfig } from './gates';

export interface DifficultyParams {
  scrollSpeedMultiplier: number;
  enemySpawnInterval: number;
  enemyHpMultiplier: number;
  enemyAtkMultiplier: number;
  maxConcurrentEnemies: number;
}

export type StageEvent =
  | { time: number; type: 'enemy_spawn'; enemyType: EnemyType; x: number; count?: number }
  | { time: number; type: 'gate_spawn'; gateConfig: GatePairConfig }
  | { time: number; type: 'boss_spawn'; bossId: string };

export interface StageDefinition {
  id: number;
  name: string;
  isBossStage: boolean;
  duration: number;
  difficulty: DifficultyParams;
  timeline: StageEvent[];
}
```

### Task 6: Create barrel export for types

**Files:**
- Modify: `src/types/index.ts`

```typescript
export * from './entities';
export * from './forms';
export * from './gates';
export * from './enemies';
export * from './stages';
```

### Task 7: Create dimension constants

**Files:**
- Create: `src/constants/dimensions.ts`

```typescript
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
  enemyBullet:  { width: 6,  height: 6  },
  gate:         { width: 140, height: 24 },
  boss:         { width: 200, height: 120 },
} as const;

/** Gate layout (§9.3) */
export const GATE_FORCED_GAP = 40; // gap between forced gates = 320 - 140*2 = 40
export const GATE_OPTIONAL_WIDTH = 100;

/** Object pool limits */
export const MAX_ENEMIES = 20;
export const MAX_PLAYER_BULLETS = 30;
export const MAX_ENEMY_BULLETS = 50;
export const MAX_GATES = 4; // 2 pairs

/** Calculate scale and visible height from screen dimensions */
export function getScreenMetrics(screenWidth: number, screenHeight: number) {
  const scale = screenWidth / LOGICAL_WIDTH;
  const visibleHeight = screenHeight / scale;
  return { scale, visibleHeight };
}
```

**Step: Write test for getScreenMetrics**

Create: `src/constants/__tests__/dimensions.test.ts`

```typescript
import { getScreenMetrics, LOGICAL_WIDTH } from '../dimensions';

describe('getScreenMetrics', () => {
  it('calculates scale from screen width', () => {
    const { scale } = getScreenMetrics(640, 1136);
    expect(scale).toBe(2); // 640 / 320
  });

  it('calculates visible height from screen dimensions', () => {
    const { scale, visibleHeight } = getScreenMetrics(640, 1136);
    expect(visibleHeight).toBe(568); // 1136 / 2
  });

  it('works for iPhone SE dimensions', () => {
    const { scale, visibleHeight } = getScreenMetrics(375, 667);
    expect(scale).toBeCloseTo(1.171875);
    expect(visibleHeight).toBeCloseTo(569.07, 1);
  });
});
```

Run: `npx jest src/constants/__tests__/dimensions.test.ts`

### Task 8: Create color constants

**Files:**
- Create: `src/constants/colors.ts`

```typescript
/** Color palette from §17.1 */
export const COLORS = {
  // Background
  bgBase: '#1A1A2E',
  bgNavy: '#16213E',
  bgDark: '#0a0a14',

  // Accents
  neonBlue: '#00D4FF',
  neonGreen: '#00FF88',

  // Warning / Damage
  neonPink: '#FF006E',
  neonRed: '#FF3366',

  // UI Text
  white: '#FFFFFF',
  lightGray: '#B0B0B0',

  // Gate types
  gateEnhance: '#00FF88',
  gateRefit: '#00D4FF',
  gateTradeoff: '#FFD600',
  gateRecovery: '#FF69B4',

  // Score
  scoreYellow: '#FFEA00',

  // HP bar
  hpHealthy: '#00E5FF',
  hpCritical: '#FF4081',
} as const;
```

### Task 9: Create balance constants

**Files:**
- Create: `src/constants/balance.ts`

```typescript
/** Damage model (§6) */
export const PLAYER_INITIAL_HP = 100;
export const PLAYER_INITIAL_ATK = 10;
export const PLAYER_INITIAL_SPEED = 1.0;
export const PLAYER_INITIAL_FIRE_RATE = 1.0;

/** Base fire interval in ms (shooting every 200ms at 1.0 rate) */
export const BASE_FIRE_INTERVAL = 200;

/** i-frame (§6.3) */
export const IFRAME_DURATION = 1500; // ms
export const IFRAME_BLINK_INTERVAL = 100; // ms
export const IFRAME_OPACITY_LOW = 0.3;
export const IFRAME_OPACITY_HIGH = 1.0;

/** Enemy base stats (§13.1) */
export const ENEMY_STATS = {
  stationary: { hp: 20, attackDamage: 10, attackInterval: 2.0, scoreValue: 100, creditValue: 1 },
  patrol:     { hp: 40, attackDamage: 10, attackInterval: 1.5, scoreValue: 200, creditValue: 2 },
  rush:       { hp: 15, attackDamage: 15, attackInterval: 0,   scoreValue: 100, creditValue: 1 },
} as const;

/** Damage values (§6.2) */
export const DAMAGE = {
  enemyBullet: { min: 10, max: 15 },
  enemyCollision: { min: 15, max: 20 },
  bossSpread: 15,
  bossLaser: 30,
  bossDroneBullet: 10,
  bossCollision: 50,
} as const;

/** Scoring (§12.1) */
export const SCORE = {
  enemyKill: 100,       // stationary
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
export const AWAKENED_DURATION = 10000; // ms

/** Boss (§7.3, §13.2) */
export const BOSS_BASE_HP = 500;
export const BOSS_HOVER_AMPLITUDE = 30;
export const BOSS_HOVER_PERIOD = 3000; // ms
export const BOSS_Y_POSITION = 40; // logical Y
export const BOSS_SPREAD_COUNT = 5;
export const BOSS_DRONE_COUNT = 3;
export const BOSS_LASER_WARN_TIME = 1000; // ms

/** Player bullet speed (logical units/sec) */
export const PLAYER_BULLET_SPEED = 400;
/** Enemy bullet speed (logical units/sec) */
export const ENEMY_BULLET_SPEED = 150;
/** Player movement speed (logical units/sec at 1.0 multiplier) */
export const PLAYER_MOVE_SPEED = 200;
/** Background scroll speed (logical units/sec at 1.0 multiplier) */
export const BASE_SCROLL_SPEED = 60;
```

### Task 10: Update constants barrel export

**Files:**
- Modify: `src/constants/index.ts`

```typescript
export * from './dimensions';
export * from './colors';
export * from './balance';
```

### Task 11: Commit Layer 1

Run: `npx tsc --noEmit` — fix any errors
Run: `npx jest --passWithNoTests`

```bash
git add src/types/ src/constants/
git commit -m "feat: Add type definitions and constants for game entities, forms, gates, enemies, stages"
```

---

## Layer 2: Game Data Definitions

### Task 12: Create form definitions

**Files:**
- Create: `src/game/forms.ts`

```typescript
import type { MechaFormDefinition } from '@/types/forms';

export const FORM_DEFINITIONS: Record<string, MechaFormDefinition> = {
  SD_Standard: {
    id: 'SD_Standard',
    displayName: 'Standard',
    moveSpeedMultiplier: 1.0,
    attackMultiplier: 1.0,
    fireRateMultiplier: 1.0,
    specialAbility: 'none',
    isTimeLimited: false,
    spriteConfig: { bodyColor: '#4488FF', accentColor: '#FFFFFF', glowColor: '#00D4FF' },
    bulletConfig: { width: 4, height: 12, speed: 400, color: '#00D4FF', count: 1 },
  },
  SD_HeavyArtillery: {
    id: 'SD_HeavyArtillery',
    displayName: 'Heavy Artillery',
    moveSpeedMultiplier: 0.8,
    attackMultiplier: 1.8,
    fireRateMultiplier: 0.6,
    specialAbility: 'explosion_radius',
    isTimeLimited: false,
    spriteConfig: { bodyColor: '#FF4444', accentColor: '#FFD600', glowColor: '#FF6600' },
    bulletConfig: { width: 8, height: 8, speed: 300, color: '#FF6600', count: 1 },
  },
  SD_HighSpeed: {
    id: 'SD_HighSpeed',
    displayName: 'High Speed',
    moveSpeedMultiplier: 1.4,
    attackMultiplier: 0.7,
    fireRateMultiplier: 1.5,
    specialAbility: 'pierce',
    isTimeLimited: false,
    spriteConfig: { bodyColor: '#00FF88', accentColor: '#FFFFFF', glowColor: '#00FF88' },
    bulletConfig: { width: 3, height: 16, speed: 500, color: '#00FF88', count: 1 },
  },
  SD_Awakened: {
    id: 'SD_Awakened',
    displayName: 'Awakened',
    moveSpeedMultiplier: 1.2,
    attackMultiplier: 2.0,
    fireRateMultiplier: 1.3,
    specialAbility: 'homing_invincible',
    isTimeLimited: true,
    spriteConfig: { bodyColor: '#FFD700', accentColor: '#FFFFFF', glowColor: '#FFEA00' },
    bulletConfig: { width: 5, height: 14, speed: 450, color: '#FFEA00', count: 3 },
  },
};

export function getFormDefinition(id: string): MechaFormDefinition {
  const form = FORM_DEFINITIONS[id];
  if (!form) throw new Error(`Unknown form: ${id}`);
  return form;
}
```

### Task 13: Create difficulty calculator

**Files:**
- Create: `src/game/difficulty.ts`
- Create: `src/game/__tests__/difficulty.test.ts`

```typescript
// src/game/difficulty.ts
import type { DifficultyParams } from '@/types/stages';

/** Calculate difficulty parameters from stage ID (§7.2) */
export function getDifficultyForStage(stageId: number): DifficultyParams {
  return {
    scrollSpeedMultiplier: 1.0 + (stageId - 1) * 0.05,
    enemySpawnInterval: Math.max(1.5, 3.0 - (stageId - 1) * 0.15),
    enemyHpMultiplier: 1.0 + (stageId - 1) * 0.1,
    enemyAtkMultiplier: 1.0 + (stageId - 1) * 0.06,
    maxConcurrentEnemies: Math.min(6, 2 + Math.floor(stageId / 2)),
  };
}

/** Calculate boss HP (§7.3) */
export function getBossHp(bossIndex: number): number {
  return 500 * (1 + (bossIndex - 1) * 0.5);
}
```

```typescript
// src/game/__tests__/difficulty.test.ts
import { getDifficultyForStage, getBossHp } from '../difficulty';

describe('getDifficultyForStage', () => {
  it('returns base values for stage 1', () => {
    const d = getDifficultyForStage(1);
    expect(d.scrollSpeedMultiplier).toBe(1.0);
    expect(d.enemySpawnInterval).toBe(3.0);
    expect(d.enemyHpMultiplier).toBe(1.0);
    expect(d.enemyAtkMultiplier).toBe(1.0);
    expect(d.maxConcurrentEnemies).toBe(2);
  });

  it('scales correctly for stage 5', () => {
    const d = getDifficultyForStage(5);
    expect(d.scrollSpeedMultiplier).toBe(1.2);
    expect(d.enemySpawnInterval).toBe(2.4);
    expect(d.enemyHpMultiplier).toBeCloseTo(1.4);
    expect(d.enemyAtkMultiplier).toBeCloseTo(1.24);
    expect(d.maxConcurrentEnemies).toBe(4);
  });

  it('clamps spawn interval to 1.5 minimum', () => {
    const d = getDifficultyForStage(20);
    expect(d.enemySpawnInterval).toBe(1.5);
  });

  it('clamps max concurrent enemies to 6', () => {
    const d = getDifficultyForStage(20);
    expect(d.maxConcurrentEnemies).toBe(6);
  });
});

describe('getBossHp', () => {
  it('returns 500 for first boss', () => {
    expect(getBossHp(1)).toBe(500);
  });

  it('returns 750 for second boss', () => {
    expect(getBossHp(2)).toBe(750);
  });

  it('returns 1000 for third boss', () => {
    expect(getBossHp(3)).toBe(1000);
  });
});
```

Run: `npx jest src/game/__tests__/difficulty.test.ts`

### Task 14: Create scoring functions

**Files:**
- Create: `src/game/scoring.ts`
- Create: `src/game/__tests__/scoring.test.ts`

```typescript
// src/game/scoring.ts
import { SCORE, CREDITS } from '@/constants/balance';
import type { EnemyType } from '@/types/enemies';

export function getEnemyScore(enemyType: EnemyType): number {
  return enemyType === 'patrol' ? SCORE.patrolKill : SCORE.enemyKill;
}

export function getEnemyCredits(): number {
  const { min, max } = CREDITS.enemyKill;
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function getStageClearScore(isBossStage: boolean): number {
  return isBossStage ? SCORE.bossStageClear : SCORE.stageClear;
}

export function getStageClearCredits(isBossStage: boolean): number {
  return isBossStage ? CREDITS.bossStageClear : CREDITS.stageClear;
}
```

```typescript
// src/game/__tests__/scoring.test.ts
import { getEnemyScore, getStageClearScore, getStageClearCredits } from '../scoring';

describe('getEnemyScore', () => {
  it('returns 100 for stationary enemies', () => {
    expect(getEnemyScore('stationary')).toBe(100);
  });

  it('returns 200 for patrol enemies', () => {
    expect(getEnemyScore('patrol')).toBe(200);
  });
});

describe('getStageClearScore', () => {
  it('returns 1000 for normal stage', () => {
    expect(getStageClearScore(false)).toBe(1000);
  });

  it('returns 3000 for boss stage', () => {
    expect(getStageClearScore(true)).toBe(3000);
  });
});

describe('getStageClearCredits', () => {
  it('returns 50 for normal stage', () => {
    expect(getStageClearCredits(false)).toBe(50);
  });

  it('returns 150 for boss stage', () => {
    expect(getStageClearCredits(true)).toBe(150);
  });
});
```

Run: `npx jest src/game/__tests__/scoring.test.ts`

### Task 15: Create Stage 1 definition

**Files:**
- Create: `src/game/stages/stage1.ts`

```typescript
import type { StageDefinition } from '@/types/stages';

/** Stage 1: Training Ground (§18 sample data) */
export const STAGE_1: StageDefinition = {
  id: 1,
  name: 'Training Ground',
  isBossStage: false,
  duration: 90,
  difficulty: {
    scrollSpeedMultiplier: 1.0,
    enemySpawnInterval: 3.0,
    enemyHpMultiplier: 1.0,
    enemyAtkMultiplier: 1.0,
    maxConcurrentEnemies: 2,
  },
  timeline: [
    { time: 5, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    { time: 10, type: 'enemy_spawn', enemyType: 'stationary', x: 80 },
    { time: 10, type: 'enemy_spawn', enemyType: 'stationary', x: 240 },
    {
      time: 20,
      type: 'gate_spawn',
      gateConfig: {
        layout: 'forced',
        left: {
          type: 'enhance',
          displayLabel: 'ATK +5',
          effects: [{ kind: 'stat_add', stat: 'atk', value: 5 }],
        },
        right: {
          type: 'enhance',
          displayLabel: 'SPD +10%',
          effects: [{ kind: 'stat_multiply', stat: 'speed', value: 1.1 }],
        },
      },
    },
    { time: 30, type: 'enemy_spawn', enemyType: 'stationary', x: 100 },
    { time: 30, type: 'enemy_spawn', enemyType: 'stationary', x: 220 },
    { time: 40, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    {
      time: 50,
      type: 'gate_spawn',
      gateConfig: {
        layout: 'forced',
        left: {
          type: 'refit',
          displayLabel: '→ Heavy',
          effects: [{ kind: 'refit', targetForm: 'SD_HeavyArtillery' }],
        },
        right: {
          type: 'refit',
          displayLabel: '→ Speed',
          effects: [{ kind: 'refit', targetForm: 'SD_HighSpeed' }],
        },
      },
    },
    { time: 55, type: 'enemy_spawn', enemyType: 'stationary', x: 60 },
    { time: 55, type: 'enemy_spawn', enemyType: 'stationary', x: 260 },
    { time: 65, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    {
      time: 75,
      type: 'gate_spawn',
      gateConfig: {
        layout: 'forced',
        left: {
          type: 'enhance',
          displayLabel: 'ATK +5',
          effects: [{ kind: 'stat_add', stat: 'atk', value: 5 }],
        },
        right: {
          type: 'enhance',
          displayLabel: 'FR +20%',
          effects: [{ kind: 'stat_multiply', stat: 'fireRate', value: 1.2 }],
        },
      },
    },
    { time: 80, type: 'enemy_spawn', enemyType: 'stationary', x: 100 },
    { time: 80, type: 'enemy_spawn', enemyType: 'stationary', x: 200 },
  ],
};
```

### Task 16: Create stage registry

**Files:**
- Modify: `src/game/stages/index.ts`

```typescript
import type { StageDefinition } from '@/types/stages';
import { STAGE_1 } from './stage1';

const STAGES: Record<number, StageDefinition> = {
  1: STAGE_1,
};

export function getStage(id: number): StageDefinition {
  const stage = STAGES[id];
  if (!stage) throw new Error(`Unknown stage: ${id}`);
  return stage;
}

export function getAvailableStageIds(): number[] {
  return Object.keys(STAGES).map(Number).sort((a, b) => a - b);
}
```

### Task 17: Update game barrel export

**Files:**
- Modify: `src/game/index.ts`

```typescript
export * from './forms';
export * from './difficulty';
export * from './scoring';
export { getStage, getAvailableStageIds } from './stages';
```

### Task 18: Commit Layer 2

Run: `npx tsc --noEmit`
Run: `npx jest`

```bash
git add src/game/ src/types/
git commit -m "feat: Add game data definitions — forms, difficulty, scoring, Stage 1"
```

---

## Layer 3: Engine — Entities + Collision

### Task 19: Create entity factory functions

**Files:**
- Create: `src/engine/entities/Player.ts`

```typescript
import type { PlayerEntity } from '@/types/entities';
import { HITBOX } from '@/constants/dimensions';

let nextId = 0;

export function createPlayer(x: number, y: number): PlayerEntity {
  return {
    id: `player_${nextId++}`,
    type: 'player',
    x,
    y,
    width: HITBOX.playerVisual.width,
    height: HITBOX.playerVisual.height,
    active: true,
    isInvincible: false,
    invincibleTimer: 0,
  };
}
```

### Task 20: Create enemy factory

**Files:**
- Create: `src/engine/entities/Enemy.ts`

```typescript
import type { EnemyEntity } from '@/types/entities';
import type { EnemyType } from '@/types/enemies';
import { HITBOX } from '@/constants/dimensions';
import { ENEMY_STATS } from '@/constants/balance';

let nextId = 0;

export function createEnemy(
  enemyType: EnemyType,
  x: number,
  y: number,
  hpMultiplier: number = 1.0
): EnemyEntity {
  const stats = ENEMY_STATS[enemyType];
  return {
    id: `enemy_${nextId++}`,
    type: 'enemy',
    enemyType,
    x: x - HITBOX.enemy.width / 2,
    y,
    width: HITBOX.enemy.width,
    height: HITBOX.enemy.height,
    active: true,
    hp: Math.round(stats.hp * hpMultiplier),
    maxHp: Math.round(stats.hp * hpMultiplier),
    shootTimer: 0,
    moveTimer: 0,
    moveDirection: 1,
  };
}

export function deactivateEnemy(enemy: EnemyEntity): void {
  enemy.active = false;
  enemy.x = -100;
  enemy.y = -100;
}
```

### Task 21: Create bullet factory

**Files:**
- Create: `src/engine/entities/Bullet.ts`

```typescript
import type { BulletEntity } from '@/types/entities';
import { HITBOX } from '@/constants/dimensions';
import { PLAYER_BULLET_SPEED, ENEMY_BULLET_SPEED } from '@/constants/balance';

let nextId = 0;

export function createPlayerBullet(
  x: number,
  y: number,
  damage: number,
  config?: { width?: number; height?: number; speed?: number }
): BulletEntity {
  return {
    id: `pb_${nextId++}`,
    type: 'playerBullet',
    x: x - (config?.width ?? HITBOX.playerBullet.width) / 2,
    y,
    width: config?.width ?? HITBOX.playerBullet.width,
    height: config?.height ?? HITBOX.playerBullet.height,
    active: true,
    damage,
    speed: config?.speed ?? PLAYER_BULLET_SPEED,
  };
}

export function createEnemyBullet(
  x: number,
  y: number,
  damage: number,
  speed?: number
): BulletEntity {
  return {
    id: `eb_${nextId++}`,
    type: 'enemyBullet',
    x: x - HITBOX.enemyBullet.width / 2,
    y,
    width: HITBOX.enemyBullet.width,
    height: HITBOX.enemyBullet.height,
    active: true,
    damage,
    speed: speed ?? ENEMY_BULLET_SPEED,
  };
}

export function deactivateBullet(bullet: BulletEntity): void {
  bullet.active = false;
  bullet.x = -100;
  bullet.y = -100;
}
```

### Task 22: Create gate factory

**Files:**
- Create: `src/engine/entities/Gate.ts`

```typescript
import type { GateEntity } from '@/types/entities';
import type { GateDefinition, GatePairConfig } from '@/types/gates';
import { HITBOX, GATE_FORCED_GAP, GATE_OPTIONAL_WIDTH, LOGICAL_WIDTH } from '@/constants/dimensions';

let nextId = 0;

function createSingleGate(def: GateDefinition, x: number, y: number, width: number): GateEntity {
  return {
    id: `gate_${nextId++}`,
    type: 'gate',
    gateType: def.type,
    x,
    y,
    width,
    height: HITBOX.gate.height,
    active: true,
    displayLabel: def.displayLabel,
    effects: def.effects,
    passed: false,
  };
}

export function createGatePair(config: GatePairConfig, y: number): [GateEntity, GateEntity] {
  if (config.layout === 'forced') {
    // Forced: two gates cover full width (140 + 40gap + 140 = 320)
    const gateWidth = HITBOX.gate.width;
    const leftX = 0;
    const rightX = LOGICAL_WIDTH - gateWidth;
    return [
      createSingleGate(config.left, leftX, y, gateWidth),
      createSingleGate(config.right, rightX, y, gateWidth),
    ];
  } else {
    // Optional: narrower gates with gaps on sides and center
    const gateWidth = GATE_OPTIONAL_WIDTH;
    const totalGap = LOGICAL_WIDTH - gateWidth * 2;
    const sideGap = totalGap / 3;
    const leftX = sideGap;
    const rightX = LOGICAL_WIDTH - sideGap - gateWidth;
    return [
      createSingleGate(config.left, leftX, y, gateWidth),
      createSingleGate(config.right, rightX, y, gateWidth),
    ];
  }
}

export function deactivateGate(gate: GateEntity): void {
  gate.active = false;
  gate.x = -100;
  gate.y = -100;
}
```

### Task 23: Create boss factory

**Files:**
- Create: `src/engine/entities/Boss.ts`

```typescript
import type { BossEntity } from '@/types/entities';
import { HITBOX, LOGICAL_WIDTH } from '@/constants/dimensions';
import { BOSS_BASE_HP, BOSS_Y_POSITION } from '@/constants/balance';

let nextId = 0;

export function createBoss(bossIndex: number): BossEntity {
  const hp = BOSS_BASE_HP * (1 + (bossIndex - 1) * 0.5);
  return {
    id: `boss_${nextId++}`,
    type: 'boss',
    x: (LOGICAL_WIDTH - HITBOX.boss.width) / 2,
    y: -HITBOX.boss.height, // starts off-screen, slides in
    width: HITBOX.boss.width,
    height: HITBOX.boss.height,
    active: true,
    hp,
    maxHp: hp,
    phase: 'spread',
    attackTimer: 0,
    hoverTimer: 0,
    hoverDirection: 1,
    drones: [],
  };
}
```

### Task 24: Create AABB collision utility

**Files:**
- Create: `src/engine/collision.ts`
- Create: `src/engine/__tests__/collision.test.ts`

```typescript
// src/engine/collision.ts
import type { BaseEntity } from '@/types/entities';
import { HITBOX } from '@/constants/dimensions';

/** AABB overlap check between two entities */
export function checkAABBOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Get the player's hitbox (centered, smaller than visual).
 * Visual: 32×40, Hitbox: 16×16 (§3.2)
 */
export function getPlayerHitbox(player: { x: number; y: number; width: number; height: number }) {
  const hb = HITBOX.player;
  return {
    x: player.x + (player.width - hb.width) / 2,
    y: player.y + (player.height - hb.height) / 2,
    width: hb.width,
    height: hb.height,
  };
}
```

```typescript
// src/engine/__tests__/collision.test.ts
import { checkAABBOverlap, getPlayerHitbox } from '../collision';

describe('checkAABBOverlap', () => {
  it('detects overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(checkAABBOverlap(a, b)).toBe(true);
  });

  it('returns false for non-overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(checkAABBOverlap(a, b)).toBe(false);
  });

  it('returns false for touching edges (not overlapping)', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(checkAABBOverlap(a, b)).toBe(false);
  });

  it('detects containment', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 10, y: 10, width: 10, height: 10 };
    expect(checkAABBOverlap(a, b)).toBe(true);
  });
});

describe('getPlayerHitbox', () => {
  it('returns centered hitbox smaller than visual', () => {
    const player = { x: 100, y: 200, width: 32, height: 40 };
    const hb = getPlayerHitbox(player);
    expect(hb.width).toBe(16);
    expect(hb.height).toBe(16);
    expect(hb.x).toBe(108); // 100 + (32-16)/2
    expect(hb.y).toBe(212); // 200 + (40-16)/2
  });
});
```

Run: `npx jest src/engine/__tests__/collision.test.ts`

### Task 25: Update entity barrel exports

**Files:**
- Modify: `src/engine/entities/index.ts`

```typescript
export { createPlayer } from './Player';
export { createEnemy, deactivateEnemy } from './Enemy';
export { createPlayerBullet, createEnemyBullet, deactivateBullet } from './Bullet';
export { createGatePair, deactivateGate } from './Gate';
export { createBoss } from './Boss';
```

### Task 26: Commit Layer 3

Run: `npx tsc --noEmit`
Run: `npx jest`

```bash
git add src/engine/entities/ src/engine/collision.ts src/engine/__tests__/
git commit -m "feat: Add engine entity factories and AABB collision utility"
```

---

## Layer 4: Engine — Systems

### Task 27: Create ScrollSystem

**Files:**
- Create: `src/engine/systems/ScrollSystem.ts`

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { BASE_SCROLL_SPEED } from '@/constants/balance';

export const scrollSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const dt = time.delta / 1000;
  const speed = BASE_SCROLL_SPEED * entities.screen.scale;
  const multiplier = entities.isBossPhase ? 0.5 : 1.0;

  // Advance stage time
  entities.stageTime += dt;

  // Update scroll offset (wrapping for seamless background)
  entities.scrollY += speed * multiplier * dt;
};
```

### Task 28: Create MovementSystem

**Files:**
- Create: `src/engine/systems/MovementSystem.ts`

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import {
  PLAYER_MIN_X,
  PLAYER_MAX_X,
  PLAYER_Y_TOP_RATIO,
  PLAYER_Y_BOTTOM_MARGIN,
  HITBOX,
} from '@/constants/dimensions';
import { deactivateBullet } from '@/engine/entities/Bullet';
import { deactivateEnemy } from '@/engine/entities/Enemy';

export const movementSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const dt = time.delta / 1000;
  const { visibleHeight } = entities.screen;

  // Clamp player position to allowed bounds (§3.1)
  const p = entities.player;
  const minY = visibleHeight * PLAYER_Y_TOP_RATIO;
  const maxY = visibleHeight - PLAYER_Y_BOTTOM_MARGIN;
  p.x = Math.max(PLAYER_MIN_X, Math.min(PLAYER_MAX_X - p.width, p.x));
  p.y = Math.max(minY, Math.min(maxY - p.height, p.y));

  // Move player bullets upward
  for (const b of entities.playerBullets) {
    if (!b.active) continue;
    b.y -= b.speed * dt;
    if (b.y + b.height < 0) deactivateBullet(b);
  }

  // Move enemy bullets downward
  for (const b of entities.enemyBullets) {
    if (!b.active) continue;
    b.y += b.speed * dt;
    if (b.y > visibleHeight) deactivateBullet(b);
  }

  // Move enemies (scroll down + deactivate off-screen)
  for (const e of entities.enemies) {
    if (!e.active) continue;
    // Enemies scroll downward with background
    e.y += BASE_SCROLL_SPEED_LOGICAL * dt;
    if (e.y > visibleHeight + 50) {
      deactivateEnemy(e);
    }
  }

  // Move gates downward
  for (const g of entities.gates) {
    if (!g.active) continue;
    g.y += BASE_SCROLL_SPEED_LOGICAL * dt;
    if (g.y > visibleHeight + 50) {
      g.active = false;
    }
  }
};

/** Logical scroll speed (units/sec at 1.0x) — used for entity movement */
const BASE_SCROLL_SPEED_LOGICAL = 60;
```

### Task 29: Create ShootingSystem

**Files:**
- Create: `src/engine/systems/ShootingSystem.ts`

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { MechaFormDefinition } from '@/types/forms';
import { BASE_FIRE_INTERVAL } from '@/constants/balance';
import { createPlayerBullet } from '@/engine/entities/Bullet';

let fireTimer = 0;

export function createShootingSystem(getForm: () => MechaFormDefinition): GameSystem<GameEntities> {
  return (entities, { time }) => {
    const form = getForm();
    const interval = BASE_FIRE_INTERVAL / form.fireRateMultiplier;

    fireTimer += time.delta;
    if (fireTimer < interval) return;
    fireTimer -= interval;

    const p = entities.player;
    if (!p.active) return;

    const bulletConfig = form.bulletConfig;
    const damage = 10 * form.attackMultiplier; // base ATK from store would be injected

    // Find an inactive bullet slot
    const slot = entities.playerBullets.find((b) => !b.active);
    if (!slot) return; // pool exhausted

    const bullet = createPlayerBullet(
      p.x + p.width / 2,
      p.y,
      damage,
      { width: bulletConfig.width, height: bulletConfig.height, speed: bulletConfig.speed }
    );
    Object.assign(slot, bullet);
    slot.active = true;
  };
}
```

### Task 30: Create EnemyAISystem

**Files:**
- Create: `src/engine/systems/EnemyAISystem.ts`

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { ENEMY_STATS, ENEMY_BULLET_SPEED } from '@/constants/balance';
import { createEnemyBullet } from '@/engine/entities/Bullet';

export const enemyAISystem: GameSystem<GameEntities> = (entities, { time }) => {
  const dt = time.delta / 1000;

  for (const enemy of entities.enemies) {
    if (!enemy.active) continue;

    const stats = ENEMY_STATS[enemy.enemyType];
    if (stats.attackInterval <= 0) continue; // rush type doesn't shoot

    // Patrol movement
    if (enemy.enemyType === 'patrol') {
      enemy.moveTimer += dt;
      const amplitude = 40;
      const speed = 60;
      enemy.x += enemy.moveDirection * speed * dt;

      // Reverse at bounds
      if (enemy.x < 16 || enemy.x + enemy.width > 304) {
        enemy.moveDirection *= -1;
      }
    }

    // Shooting
    enemy.shootTimer += dt;
    if (enemy.shootTimer >= stats.attackInterval) {
      enemy.shootTimer = 0;

      // Fire a bullet downward from enemy center
      const slot = entities.enemyBullets.find((b) => !b.active);
      if (slot) {
        const bullet = createEnemyBullet(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height,
          stats.attackDamage
        );
        Object.assign(slot, bullet);
        slot.active = true;
      }
    }
  }
};
```

### Task 31: Create SpawnSystem

**Files:**
- Create: `src/engine/systems/SpawnSystem.ts`

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { StageDefinition } from '@/types/stages';
import { createEnemy } from '@/engine/entities/Enemy';
import { createGatePair } from '@/engine/entities/Gate';
import { createBoss } from '@/engine/entities/Boss';

export function createSpawnSystem(stage: StageDefinition): GameSystem<GameEntities> {
  return (entities) => {
    if (entities.isBossPhase) return; // No spawning during boss phase (§13.2)

    const { timeline } = stage;
    while (
      entities.timelineIndex < timeline.length &&
      timeline[entities.timelineIndex].time <= entities.stageTime
    ) {
      const event = timeline[entities.timelineIndex];
      entities.timelineIndex++;

      switch (event.type) {
        case 'enemy_spawn': {
          const count = event.count ?? 1;
          for (let i = 0; i < count; i++) {
            const slot = entities.enemies.find((e) => !e.active);
            if (!slot) break;
            const enemy = createEnemy(
              event.enemyType,
              event.x + i * 40, // offset for multiple spawns
              -30, // spawn above screen
              stage.difficulty.enemyHpMultiplier
            );
            Object.assign(slot, enemy);
            slot.active = true;
          }
          break;
        }
        case 'gate_spawn': {
          const [left, right] = createGatePair(event.gateConfig, -30);
          const slots = entities.gates.filter((g) => !g.active);
          if (slots.length >= 2) {
            Object.assign(slots[0], left);
            slots[0].active = true;
            Object.assign(slots[1], right);
            slots[1].active = true;
          }
          break;
        }
        case 'boss_spawn': {
          const bossIndex = Math.ceil(stage.id / 5);
          entities.boss = createBoss(bossIndex);
          entities.isBossPhase = true;
          break;
        }
      }
    }
  };
}
```

### Task 32: Create CollisionSystem

**Files:**
- Create: `src/engine/systems/CollisionSystem.ts`

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { checkAABBOverlap, getPlayerHitbox } from '@/engine/collision';
import { deactivateEnemy } from '@/engine/entities/Enemy';
import { deactivateBullet } from '@/engine/entities/Bullet';
import { IFRAME_DURATION } from '@/constants/balance';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { getEnemyScore, getEnemyCredits } from '@/game/scoring';

export const collisionSystem: GameSystem<GameEntities> = (entities) => {
  const player = entities.player;
  if (!player.active) return;

  const playerHB = getPlayerHitbox(player);
  const store = useGameSessionStore.getState();

  // Player bullets → Enemies
  for (const bullet of entities.playerBullets) {
    if (!bullet.active) continue;
    for (const enemy of entities.enemies) {
      if (!enemy.active) continue;
      if (checkAABBOverlap(bullet, enemy)) {
        enemy.hp -= bullet.damage;
        deactivateBullet(bullet);
        if (enemy.hp <= 0) {
          deactivateEnemy(enemy);
          store.addScore(getEnemyScore(enemy.enemyType));
          store.addCredits(getEnemyCredits());
          store.addExGauge(5);
        }
        break;
      }
    }
  }

  // Player bullets → Boss
  if (entities.boss?.active) {
    for (const bullet of entities.playerBullets) {
      if (!bullet.active) continue;
      if (checkAABBOverlap(bullet, entities.boss)) {
        const prevPercent = Math.floor((entities.boss.hp / entities.boss.maxHp) * 100);
        entities.boss.hp -= bullet.damage;
        const newPercent = Math.floor((entities.boss.hp / entities.boss.maxHp) * 100);
        deactivateBullet(bullet);

        // Score per percent of boss HP
        const percentDamaged = prevPercent - newPercent;
        if (percentDamaged > 0) {
          store.addScore(percentDamaged * 50);
        }
        store.addExGauge(2);

        // Update boss phase
        const hpRatio = entities.boss.hp / entities.boss.maxHp;
        if (hpRatio <= 0.25) entities.boss.phase = 'all';
        else if (hpRatio <= 0.5) entities.boss.phase = 'laser';

        if (entities.boss.hp <= 0) {
          entities.boss.active = false;
          store.setStageClear(true);
        }
      }
    }
  }

  // Skip damage checks if player is invincible
  if (player.isInvincible) return;

  // Enemy bullets → Player
  for (const bullet of entities.enemyBullets) {
    if (!bullet.active) continue;
    if (checkAABBOverlap(playerHB, bullet)) {
      deactivateBullet(bullet);
      applyDamage(player, bullet.damage, store);
      return; // Only one hit per frame
    }
  }

  // Enemy collision → Player
  for (const enemy of entities.enemies) {
    if (!enemy.active) continue;
    if (checkAABBOverlap(playerHB, enemy)) {
      applyDamage(player, 15, store); // §6.2 enemy collision
      return;
    }
  }

  // Boss collision → Player
  if (entities.boss?.active && checkAABBOverlap(playerHB, entities.boss)) {
    applyDamage(player, 50, store); // §6.2 boss collision
  }
};

function applyDamage(
  player: GameEntities['player'],
  damage: number,
  store: ReturnType<typeof useGameSessionStore.getState>
) {
  store.takeDamage(damage);
  player.isInvincible = true;
  player.invincibleTimer = IFRAME_DURATION;
  store.resetCombo();
}
```

### Task 33: Create GateSystem

**Files:**
- Create: `src/engine/systems/GateSystem.ts`

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { checkAABBOverlap, getPlayerHitbox } from '@/engine/collision';
import { deactivateGate } from '@/engine/entities/Gate';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { SCORE, EX_GAIN } from '@/constants/balance';

export const gateSystem: GameSystem<GameEntities> = (entities) => {
  const player = entities.player;
  if (!player.active) return;

  const playerHB = getPlayerHitbox(player);
  const store = useGameSessionStore.getState();

  for (const gate of entities.gates) {
    if (!gate.active || gate.passed) continue;
    if (!checkAABBOverlap(playerHB, gate)) continue;

    gate.passed = true;

    // Apply effects
    for (const effect of gate.effects) {
      switch (effect.kind) {
        case 'stat_add':
          store.addStat(effect.stat, effect.value);
          break;
        case 'stat_multiply':
          store.multiplyStat(effect.stat, effect.value);
          break;
        case 'refit':
          store.setForm(effect.targetForm);
          break;
        case 'heal':
          store.heal(effect.value);
          break;
        case 'heal_percent':
          store.healPercent(effect.value);
          break;
      }
    }

    // Scoring + EX
    store.addScore(SCORE.gatePass);
    store.addExGauge(EX_GAIN.gatePass);

    // Combo tracking (§10.2)
    switch (gate.gateType) {
      case 'enhance':
        store.incrementCombo();
        break;
      case 'recovery':
        // No change
        break;
      case 'tradeoff':
      case 'refit':
        store.resetCombo();
        break;
    }

    // Deactivate after short delay (visual feedback)
    deactivateGate(gate);
  }
};
```

### Task 34: Create IFrameSystem

**Files:**
- Create: `src/engine/systems/IFrameSystem.ts`

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';

export const iframeSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const player = entities.player;
  if (!player.isInvincible) return;

  player.invincibleTimer -= time.delta;
  if (player.invincibleTimer <= 0) {
    player.isInvincible = false;
    player.invincibleTimer = 0;
  }
};
```

### Task 35: Create BossSystem

**Files:**
- Create: `src/engine/systems/BossSystem.ts`

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { BOSS_HOVER_AMPLITUDE, BOSS_HOVER_PERIOD, BOSS_Y_POSITION, BOSS_SPREAD_COUNT, BOSS_DRONE_COUNT, BOSS_LASER_WARN_TIME } from '@/constants/balance';
import { LOGICAL_WIDTH } from '@/constants/dimensions';
import { createEnemyBullet } from '@/engine/entities/Bullet';
import { createEnemy } from '@/engine/entities/Enemy';

export const bossSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const boss = entities.boss;
  if (!boss || !boss.active) return;

  const dt = time.delta / 1000;

  // Slide in from top
  if (boss.y < BOSS_Y_POSITION) {
    boss.y += 30 * dt;
    if (boss.y > BOSS_Y_POSITION) boss.y = BOSS_Y_POSITION;
    return; // Don't attack while entering
  }

  // Hover left-right (§13.2: amplitude 30, period 3s)
  boss.hoverTimer += time.delta;
  const hoverPhase = (boss.hoverTimer / BOSS_HOVER_PERIOD) * Math.PI * 2;
  const centerX = (LOGICAL_WIDTH - boss.width) / 2;
  boss.x = centerX + Math.sin(hoverPhase) * BOSS_HOVER_AMPLITUDE;

  // Attack patterns
  boss.attackTimer += dt;

  const hpRatio = boss.hp / boss.maxHp;

  // Spread shot (HP 100%~): every 2 seconds
  if (boss.attackTimer >= 2.0) {
    fireSpreadShot(entities, boss);
    boss.attackTimer = 0;
  }

  // Laser (HP 50%~): additional attack
  if (hpRatio <= 0.5 && boss.phase !== 'spread') {
    // Laser is handled as a special timed attack — simplified for Phase 1
    // TODO: Implement laser warning line + beam visual
  }

  // Drone summon (HP 25%~): one-time summon per threshold
  if (hpRatio <= 0.25 && boss.drones.length === 0) {
    spawnDrones(entities, boss);
  }
};

function fireSpreadShot(entities: GameEntities, boss: NonNullable<GameEntities['boss']>) {
  const centerX = boss.x + boss.width / 2;
  const startY = boss.y + boss.height;

  for (let i = 0; i < BOSS_SPREAD_COUNT; i++) {
    const slot = entities.enemyBullets.find((b) => !b.active);
    if (!slot) break;

    const angle = ((i - Math.floor(BOSS_SPREAD_COUNT / 2)) * 15 * Math.PI) / 180;
    const bullet = createEnemyBullet(
      centerX + Math.sin(angle) * 20,
      startY,
      15 // §6.2 boss spread damage
    );
    Object.assign(slot, bullet);
    slot.active = true;
  }
}

function spawnDrones(entities: GameEntities, boss: NonNullable<GameEntities['boss']>) {
  for (let i = 0; i < BOSS_DRONE_COUNT; i++) {
    const slot = entities.enemies.find((e) => !e.active);
    if (!slot) break;

    const x = boss.x + (i + 1) * (boss.width / (BOSS_DRONE_COUNT + 1));
    const drone = createEnemy('stationary', x, boss.y + boss.height + 20, 0.5);
    Object.assign(slot, drone);
    slot.active = true;
    boss.drones.push(drone.id);
  }
}
```

### Task 36: Create GameOverSystem

**Files:**
- Create: `src/engine/systems/GameOverSystem.ts`

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { useGameSessionStore } from '@/stores/gameSessionStore';

export const gameOverSystem: GameSystem<GameEntities> = (entities) => {
  const store = useGameSessionStore.getState();
  if (store.hp <= 0 && !store.isGameOver) {
    store.setGameOver(true);
    entities.player.active = false;
  }
};
```

### Task 37: Create SyncRenderSystem

**Files:**
- Create: `src/engine/systems/SyncRenderSystem.ts`

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { SharedValue } from 'react-native-reanimated';
import type { RenderEntity } from '@/rendering/GameCanvas';
import { IFRAME_BLINK_INTERVAL } from '@/constants/balance';

export type RenderSyncTarget = SharedValue<RenderEntity[]>;

export function createSyncRenderSystem(
  renderData: RenderSyncTarget
): GameSystem<GameEntities> {
  return (entities, { time }) => {
    const out: RenderEntity[] = [];

    // Player
    const p = entities.player;
    if (p.active) {
      // i-frame blink effect
      let opacity = 1.0;
      if (p.isInvincible) {
        opacity = Math.floor(p.invincibleTimer / IFRAME_BLINK_INTERVAL) % 2 === 0 ? 0.3 : 1.0;
      }
      out.push({
        type: 'player',
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        color: '#4488FF', // will be form-dependent
        opacity,
      });
    }

    // Enemies
    for (const e of entities.enemies) {
      if (!e.active) continue;
      out.push({
        type: 'enemy',
        x: e.x,
        y: e.y,
        width: e.width,
        height: e.height,
        color: '#FF4444',
        opacity: 1.0,
      });
    }

    // Player bullets
    for (const b of entities.playerBullets) {
      if (!b.active) continue;
      out.push({
        type: 'playerBullet',
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        color: '#00D4FF',
        opacity: 1.0,
      });
    }

    // Enemy bullets
    for (const b of entities.enemyBullets) {
      if (!b.active) continue;
      out.push({
        type: 'enemyBullet',
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        color: '#FF006E',
        opacity: 1.0,
      });
    }

    // Gates
    for (const g of entities.gates) {
      if (!g.active) continue;
      out.push({
        type: 'gate',
        x: g.x,
        y: g.y,
        width: g.width,
        height: g.height,
        color: g.gateType === 'enhance' ? '#00FF88' :
               g.gateType === 'refit' ? '#00D4FF' :
               g.gateType === 'tradeoff' ? '#FFD600' : '#FF69B4',
        opacity: 1.0,
        label: g.displayLabel,
      });
    }

    // Boss
    if (entities.boss?.active) {
      out.push({
        type: 'boss',
        x: entities.boss.x,
        y: entities.boss.y,
        width: entities.boss.width,
        height: entities.boss.height,
        color: '#CC0000',
        opacity: 1.0,
      });
    }

    renderData.value = out;
  };
}
```

### Task 38: Update systems barrel export

**Files:**
- Modify: `src/engine/systems/index.ts`

```typescript
export { scrollSystem } from './ScrollSystem';
export { movementSystem } from './MovementSystem';
export { createShootingSystem } from './ShootingSystem';
export { enemyAISystem } from './EnemyAISystem';
export { createSpawnSystem } from './SpawnSystem';
export { collisionSystem } from './CollisionSystem';
export { gateSystem } from './GateSystem';
export { iframeSystem } from './IFrameSystem';
export { bossSystem } from './BossSystem';
export { gameOverSystem } from './GameOverSystem';
export { createSyncRenderSystem } from './SyncRenderSystem';
```

### Task 39: Commit Layer 4

Run: `npx tsc --noEmit` — fix errors
Run: `npx jest`

```bash
git add src/engine/systems/
git commit -m "feat: Add all engine systems — scroll, movement, shooting, AI, spawn, collision, gates, boss, i-frame, game-over, render sync"
```

---

## Layer 5: Skia Rendering

### Task 40: Update RenderEntity type and GameCanvas

**Files:**
- Modify: `src/rendering/GameCanvas.tsx`

Replace the entire file. The new `RenderEntity` includes `type`, `opacity`, and optional `label`. The canvas uses pre-allocated slots with `useDerivedValue` per slot — same pattern as the spike but with entity type support.

```typescript
import React from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Canvas,
  Rect,
  RoundedRect,
  Text as SkText,
  useFont,
  Shadow,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { COLORS } from '@/constants/colors';

export type RenderEntity = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  label?: string;
};

type GameCanvasProps = {
  renderData: ReturnType<typeof useSharedValue<RenderEntity[]>>;
  scrollY: ReturnType<typeof useSharedValue<number>>;
  scale: number;
};

const MAX_VISIBLE_ENTITIES = 128;

function EntitySlot({
  renderData,
  index,
  scale,
}: {
  renderData: GameCanvasProps['renderData'];
  index: number;
  scale: number;
}) {
  const x = useDerivedValue(() => (renderData.value[index]?.x ?? -200) * scale);
  const y = useDerivedValue(() => (renderData.value[index]?.y ?? -200) * scale);
  const width = useDerivedValue(() => (renderData.value[index]?.width ?? 0) * scale);
  const height = useDerivedValue(() => (renderData.value[index]?.height ?? 0) * scale);
  const color = useDerivedValue(() => renderData.value[index]?.color ?? 'transparent');
  const opacity = useDerivedValue(() => renderData.value[index]?.opacity ?? 0);

  return (
    <RoundedRect
      x={x}
      y={y}
      width={width}
      height={height}
      r={2}
      color={color}
      opacity={opacity}
    >
      <Shadow dx={0} dy={0} blur={6} color={color} />
    </RoundedRect>
  );
}

function GameCanvasInner({ renderData, scrollY, scale }: GameCanvasProps) {
  const { width, height } = useWindowDimensions();

  const entitySlots = React.useMemo(
    () => Array.from({ length: MAX_VISIBLE_ENTITIES }, (_, i) => i),
    []
  );

  // Background scroll lines for visual feedback
  const bgLineY1 = useDerivedValue(() => (scrollY.value * scale) % (height + 100) - 100);
  const bgLineY2 = useDerivedValue(() => ((scrollY.value * scale) + height / 2) % (height + 100) - 100);

  return (
    <Canvas style={{ width, height }}>
      {/* Background */}
      <Rect x={0} y={0} width={width} height={height} color={COLORS.bgDark} />
      {/* Scroll indicator lines */}
      <Rect x={0} y={bgLineY1} width={width} height={1} color="#1a1a2e" opacity={0.5} />
      <Rect x={0} y={bgLineY2} width={width} height={1} color="#1a1a2e" opacity={0.5} />

      {/* All entities via pre-allocated slots */}
      {entitySlots.map((index) => (
        <EntitySlot key={index} renderData={renderData} index={index} scale={scale} />
      ))}
    </Canvas>
  );
}

export const GameCanvas = React.memo(GameCanvasInner);
```

### Task 41: Commit Layer 5

Run: `npx tsc --noEmit`

```bash
git add src/rendering/
git commit -m "feat: Upgrade Skia GameCanvas with entity type rendering, glow effects, and background scroll"
```

---

## Layer 6: Zustand Store

### Task 42: Expand gameSessionStore

**Files:**
- Modify: `src/stores/gameSessionStore.ts`

Replace with full implementation matching §21 GameSession type.

```typescript
import { create } from 'zustand';
import type { MechaFormId } from '@/types/forms';
import type { StatKey } from '@/types/gates';
import {
  PLAYER_INITIAL_HP,
  PLAYER_INITIAL_ATK,
  PLAYER_INITIAL_SPEED,
  PLAYER_INITIAL_FIRE_RATE,
  COMBO_THRESHOLD,
  AWAKENED_DURATION,
  EX_GAUGE_MAX,
} from '@/constants/balance';

interface GameSessionState {
  // Player stats
  currentForm: MechaFormId;
  previousForm: MechaFormId;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  fireRate: number;

  // Invincibility
  isInvincible: boolean;

  // Combo
  comboCount: number;
  isAwakened: boolean;
  awakenedTimer: number;

  // EX
  exGauge: number;

  // Score / Credits
  score: number;
  credits: number;

  // Stage
  currentStageId: number;
  isPaused: boolean;
  isGameOver: boolean;
  isStageClear: boolean;

  // Actions
  setHp: (hp: number) => void;
  takeDamage: (damage: number) => void;
  heal: (amount: number) => void;
  healPercent: (percent: number) => void;
  addScore: (points: number) => void;
  addCredits: (amount: number) => void;
  addExGauge: (amount: number) => void;
  setForm: (formId: MechaFormId) => void;
  addStat: (stat: StatKey, value: number) => void;
  multiplyStat: (stat: StatKey, value: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  activateAwakened: () => void;
  deactivateAwakened: () => void;
  setGameOver: (value: boolean) => void;
  setStageClear: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  resetSession: (stageId: number) => void;
}

const INITIAL_STATE = {
  currentForm: 'SD_Standard' as MechaFormId,
  previousForm: 'SD_Standard' as MechaFormId,
  hp: PLAYER_INITIAL_HP,
  maxHp: PLAYER_INITIAL_HP,
  atk: PLAYER_INITIAL_ATK,
  speed: PLAYER_INITIAL_SPEED,
  fireRate: PLAYER_INITIAL_FIRE_RATE,
  isInvincible: false,
  comboCount: 0,
  isAwakened: false,
  awakenedTimer: 0,
  exGauge: 0,
  score: 0,
  credits: 0,
  currentStageId: 1,
  isPaused: false,
  isGameOver: false,
  isStageClear: false,
};

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  ...INITIAL_STATE,

  setHp: (hp) => set({ hp: Math.max(0, Math.min(hp, get().maxHp)) }),

  takeDamage: (damage) => {
    const newHp = Math.max(0, get().hp - damage);
    set({ hp: newHp, isInvincible: true });
  },

  heal: (amount) => set((s) => ({ hp: Math.min(s.maxHp, s.hp + amount) })),

  healPercent: (percent) =>
    set((s) => ({ hp: Math.min(s.maxHp, s.hp + Math.round(s.maxHp * percent / 100)) })),

  addScore: (points) => set((s) => ({ score: s.score + points })),

  addCredits: (amount) => set((s) => ({ credits: s.credits + amount })),

  addExGauge: (amount) =>
    set((s) => ({ exGauge: Math.min(EX_GAUGE_MAX, s.exGauge + amount) })),

  setForm: (formId) =>
    set((s) => ({
      currentForm: formId,
      previousForm: s.currentForm,
    })),

  addStat: (stat, value) => {
    switch (stat) {
      case 'atk': set((s) => ({ atk: s.atk + value })); break;
      case 'speed': set((s) => ({ speed: s.speed + value })); break;
      case 'fireRate': set((s) => ({ fireRate: s.fireRate + value })); break;
      case 'hp': set((s) => ({ hp: Math.min(s.maxHp, s.hp + value) })); break;
      case 'maxHp': set((s) => ({ maxHp: s.maxHp + value, hp: s.hp + value })); break;
    }
  },

  multiplyStat: (stat, value) => {
    switch (stat) {
      case 'atk': set((s) => ({ atk: s.atk * value })); break;
      case 'speed': set((s) => ({ speed: s.speed * value })); break;
      case 'fireRate': set((s) => ({ fireRate: s.fireRate * value })); break;
    }
  },

  incrementCombo: () => {
    const newCount = get().comboCount + 1;
    if (newCount >= COMBO_THRESHOLD && !get().isAwakened) {
      get().activateAwakened();
    } else {
      set({ comboCount: newCount });
    }
  },

  resetCombo: () => set({ comboCount: 0 }),

  activateAwakened: () =>
    set((s) => ({
      isAwakened: true,
      awakenedTimer: AWAKENED_DURATION,
      previousForm: s.currentForm,
      currentForm: 'SD_Awakened',
      comboCount: 0,
    })),

  deactivateAwakened: () =>
    set((s) => ({
      isAwakened: false,
      awakenedTimer: 0,
      currentForm: s.previousForm,
    })),

  setGameOver: (value) => set({ isGameOver: value }),
  setStageClear: (value) => set({ isStageClear: value }),
  setPaused: (value) => set({ isPaused: value }),

  resetSession: (stageId) =>
    set({
      ...INITIAL_STATE,
      currentStageId: stageId,
    }),
}));
```

### Task 43: Create saveDataStore

**Files:**
- Create: `src/stores/saveDataStore.ts`

```typescript
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MechaFormId } from '@/types/forms';

interface SaveData {
  highScores: Record<number, number>;
  unlockedForms: MechaFormId[];
  unlockedStages: number[];
  credits: number;
  upgrades: {
    baseAtk: number;
    baseHp: number;
    baseSpeed: number;
  };
  settings: {
    bgmVolume: number;
    seVolume: number;
  };
}

interface SaveDataState extends SaveData {
  isLoaded: boolean;
  load: () => Promise<void>;
  save: () => Promise<void>;
  updateHighScore: (stageId: number, score: number) => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  unlockForm: (formId: MechaFormId) => void;
  unlockStage: (stageId: number) => void;
  upgradeAtk: () => boolean;
  upgradeHp: () => boolean;
  upgradeSpeed: () => boolean;
  setVolume: (type: 'bgm' | 'se', value: number) => void;
}

const STORAGE_KEY = 'g_runner_save';

const INITIAL_SAVE: SaveData = {
  highScores: {},
  unlockedForms: ['SD_Standard'],
  unlockedStages: [1],
  credits: 0,
  upgrades: { baseAtk: 0, baseHp: 0, baseSpeed: 0 },
  settings: { bgmVolume: 0.7, seVolume: 1.0 },
};

export const useSaveDataStore = create<SaveDataState>((set, get) => ({
  ...INITIAL_SAVE,
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as SaveData;
        set({ ...data, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  save: async () => {
    const { isLoaded, load, save, ...data } = get();
    const {
      updateHighScore, addCredits, spendCredits, unlockForm,
      unlockStage, upgradeAtk, upgradeHp, upgradeSpeed, setVolume,
      ...saveData
    } = data as SaveDataState;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        highScores: get().highScores,
        unlockedForms: get().unlockedForms,
        unlockedStages: get().unlockedStages,
        credits: get().credits,
        upgrades: get().upgrades,
        settings: get().settings,
      }));
    } catch {
      // Silent fail for storage errors
    }
  },

  updateHighScore: (stageId, score) => {
    set((s) => {
      const current = s.highScores[stageId] ?? 0;
      if (score <= current) return s;
      return { highScores: { ...s.highScores, [stageId]: score } };
    });
    get().save();
  },

  addCredits: (amount) => {
    set((s) => ({ credits: s.credits + amount }));
    get().save();
  },

  spendCredits: (amount) => {
    if (get().credits < amount) return false;
    set((s) => ({ credits: s.credits - amount }));
    get().save();
    return true;
  },

  unlockForm: (formId) => {
    set((s) => {
      if (s.unlockedForms.includes(formId)) return s;
      return { unlockedForms: [...s.unlockedForms, formId] };
    });
    get().save();
  },

  unlockStage: (stageId) => {
    set((s) => {
      if (s.unlockedStages.includes(stageId)) return s;
      return { unlockedStages: [...s.unlockedStages, stageId] };
    });
    get().save();
  },

  upgradeAtk: () => {
    const { upgrades, credits } = get();
    if (upgrades.baseAtk >= 10) return false;
    const cost = 100 * (upgrades.baseAtk + 1);
    if (!get().spendCredits(cost)) return false;
    set((s) => ({ upgrades: { ...s.upgrades, baseAtk: s.upgrades.baseAtk + 1 } }));
    get().save();
    return true;
  },

  upgradeHp: () => {
    const { upgrades } = get();
    if (upgrades.baseHp >= 10) return false;
    const cost = 100 * (upgrades.baseHp + 1);
    if (!get().spendCredits(cost)) return false;
    set((s) => ({ upgrades: { ...s.upgrades, baseHp: s.upgrades.baseHp + 1 } }));
    get().save();
    return true;
  },

  upgradeSpeed: () => {
    const { upgrades } = get();
    if (upgrades.baseSpeed >= 5) return false;
    const cost = 100 * (upgrades.baseSpeed + 1);
    if (!get().spendCredits(cost)) return false;
    set((s) => ({ upgrades: { ...s.upgrades, baseSpeed: s.upgrades.baseSpeed + 1 } }));
    get().save();
    return true;
  },

  setVolume: (type, value) => {
    set((s) => ({
      settings: {
        ...s.settings,
        [type === 'bgm' ? 'bgmVolume' : 'seVolume']: Math.max(0, Math.min(1, value)),
      },
    }));
    get().save();
  },
}));
```

### Task 44: Update stores barrel

**Files:**
- Modify: `src/stores/index.ts`

```typescript
export { useGameSessionStore } from './gameSessionStore';
export { useSaveDataStore } from './saveDataStore';
```

### Task 45: Commit Layer 6

Run: `npx tsc --noEmit`

```bash
git add src/stores/
git commit -m "feat: Expand gameSessionStore to full GameSession spec, add saveDataStore with AsyncStorage"
```

---

## Layer 7: HUD Components

### Task 46: Update HUD with all components

**Files:**
- Modify: `src/ui/HUD.tsx`

```typescript
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { COLORS } from '@/constants/colors';
import { EX_GAUGE_MAX, COMBO_THRESHOLD } from '@/constants/balance';

function HPBar() {
  const hp = useGameSessionStore((s) => s.hp);
  const maxHp = useGameSessionStore((s) => s.maxHp);
  const ratio = maxHp > 0 ? hp / maxHp : 0;

  return (
    <View style={styles.hpContainer}>
      <View style={styles.hpTrack}>
        <View
          style={[
            styles.hpFill,
            {
              width: `${ratio * 100}%` as `${number}%`,
              backgroundColor: ratio > 0.3 ? COLORS.hpHealthy : COLORS.hpCritical,
            },
          ]}
        />
      </View>
      <Text style={styles.hpText}>
        {hp}/{maxHp}
      </Text>
    </View>
  );
}

function ScoreDisplay() {
  const score = useGameSessionStore((s) => s.score);
  return <Text style={styles.score}>{score.toLocaleString()}</Text>;
}

function PauseButton({ onPause }: { onPause: () => void }) {
  return (
    <TouchableOpacity style={styles.pauseButton} onPress={onPause}>
      <Text style={styles.pauseIcon}>⏸</Text>
    </TouchableOpacity>
  );
}

function FormIndicator() {
  const form = useGameSessionStore((s) => s.currentForm);
  const name = form.replace('SD_', '');
  return (
    <View style={styles.formBadge}>
      <Text style={styles.formText}>{name}</Text>
    </View>
  );
}

function ComboGauge() {
  const comboCount = useGameSessionStore((s) => s.comboCount);
  const isAwakened = useGameSessionStore((s) => s.isAwakened);

  if (isAwakened) {
    return (
      <View style={styles.comboContainer}>
        <Text style={[styles.comboText, { color: COLORS.scoreYellow }]}>AWAKENED</Text>
      </View>
    );
  }

  return (
    <View style={styles.comboContainer}>
      {Array.from({ length: COMBO_THRESHOLD }, (_, i) => (
        <View
          key={i}
          style={[
            styles.comboSegment,
            {
              backgroundColor: i < comboCount ? COLORS.neonGreen : '#333',
            },
          ]}
        />
      ))}
    </View>
  );
}

function EXGaugeBar() {
  const exGauge = useGameSessionStore((s) => s.exGauge);
  const ratio = exGauge / EX_GAUGE_MAX;
  const isFull = exGauge >= EX_GAUGE_MAX;

  return (
    <View style={styles.exContainer}>
      <View style={styles.exTrack}>
        <View
          style={[
            styles.exFill,
            {
              width: `${ratio * 100}%` as `${number}%`,
              backgroundColor: isFull ? COLORS.scoreYellow : COLORS.neonBlue,
            },
          ]}
        />
      </View>
      <Text style={styles.exLabel}>EX</Text>
    </View>
  );
}

function EXButton({ onActivate }: { onActivate: () => void }) {
  const exGauge = useGameSessionStore((s) => s.exGauge);
  const isFull = exGauge >= EX_GAUGE_MAX;

  return (
    <TouchableOpacity
      style={[styles.exButton, isFull && styles.exButtonActive]}
      onPress={onActivate}
      disabled={!isFull}
    >
      <Text style={[styles.exButtonText, isFull && styles.exButtonTextActive]}>EX</Text>
    </TouchableOpacity>
  );
}

type HUDProps = {
  onPause: () => void;
  onEXBurst: () => void;
};

function HUDInner({ onPause, onEXBurst }: HUDProps) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top row: Pause, HP, Score */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <PauseButton onPause={onPause} />
          <HPBar />
        </View>
        <ScoreDisplay />
      </View>

      {/* Bottom area: Form icon, Combo, EX */}
      <View style={styles.bottomArea}>
        <FormIndicator />
        <View style={styles.bottomRight}>
          <ComboGauge />
          <EXButton onActivate={onEXBurst} />
          <EXGaugeBar />
        </View>
      </View>
    </View>
  );
}

export const HUD = React.memo(HUDInner);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hpTrack: {
    width: 100,
    height: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  hpFill: { height: '100%', borderRadius: 4 },
  hpText: { fontSize: 11, color: '#ffffffcc', fontVariant: ['tabular-nums'] },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.scoreYellow,
    fontVariant: ['tabular-nums'],
  },
  pauseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIcon: { fontSize: 16, color: '#fff' },
  bottomArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  bottomRight: { alignItems: 'flex-end', gap: 6 },
  formBadge: {
    backgroundColor: '#ffffff22',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  formText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  comboContainer: { flexDirection: 'row', gap: 4 },
  comboSegment: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#555',
  },
  comboText: { fontSize: 12, fontWeight: 'bold' },
  exContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exTrack: {
    width: 80,
    height: 6,
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  exFill: { height: '100%', borderRadius: 3 },
  exLabel: { fontSize: 10, color: '#888', fontWeight: '600' },
  exButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  exButtonActive: {
    backgroundColor: COLORS.scoreYellow,
    borderColor: '#fff',
  },
  exButtonText: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  exButtonTextActive: { color: '#000' },
});
```

### Task 47: Commit Layer 7

Run: `npx tsc --noEmit`

```bash
git add src/ui/
git commit -m "feat: Add full HUD — pause, HP bar, score, form indicator, combo gauge, EX button/gauge"
```

---

## Layer 8: Game Screen + Result Screen

### Task 48: Create entity pool initializer

**Files:**
- Create: `src/engine/createGameEntities.ts`

Helper to initialize the full entity pool structure for a game session.

```typescript
import type { GameEntities, EnemyEntity, BulletEntity, GateEntity } from '@/types/entities';
import { createPlayer } from '@/engine/entities/Player';
import {
  LOGICAL_WIDTH,
  MAX_ENEMIES,
  MAX_PLAYER_BULLETS,
  MAX_ENEMY_BULLETS,
  MAX_GATES,
  getScreenMetrics,
} from '@/constants/dimensions';

function createInactiveEnemy(): EnemyEntity {
  return {
    id: '', type: 'enemy', enemyType: 'stationary',
    x: -100, y: -100, width: 0, height: 0,
    active: false, hp: 0, maxHp: 0,
    shootTimer: 0, moveTimer: 0, moveDirection: 1,
  };
}

function createInactiveBullet(type: 'playerBullet' | 'enemyBullet'): BulletEntity {
  return {
    id: '', type, x: -100, y: -100, width: 0, height: 0,
    active: false, damage: 0, speed: 0,
  };
}

function createInactiveGate(): GateEntity {
  return {
    id: '', type: 'gate', gateType: 'enhance',
    x: -100, y: -100, width: 0, height: 0,
    active: false, displayLabel: '', effects: [], passed: false,
  };
}

export function createGameEntities(
  screenWidth: number,
  screenHeight: number
): GameEntities {
  const { scale, visibleHeight } = getScreenMetrics(screenWidth, screenHeight);

  const playerX = LOGICAL_WIDTH / 2 - 16; // center player
  const playerY = visibleHeight * 0.75;

  return {
    player: createPlayer(playerX, playerY),
    enemies: Array.from({ length: MAX_ENEMIES }, createInactiveEnemy),
    playerBullets: Array.from({ length: MAX_PLAYER_BULLETS }, () => createInactiveBullet('playerBullet')),
    enemyBullets: Array.from({ length: MAX_ENEMY_BULLETS }, () => createInactiveBullet('enemyBullet')),
    gates: Array.from({ length: MAX_GATES }, createInactiveGate),
    boss: null,
    stageTime: 0,
    timelineIndex: 0,
    isBossPhase: false,
    scrollY: 0,
    screen: { width: screenWidth, height: screenHeight, scale, visibleHeight },
  };
}
```

### Task 49: Implement game screen

**Files:**
- Modify: `app/game/[stageId]/index.tsx`

Replace the spike demo with the real game screen. This is the integration point that wires GameLoop, Systems, GameCanvas, HUD, and gesture input together.

```typescript
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { useGameLoop, type GameSystem } from '@/engine/GameLoop';
import { GameCanvas, type RenderEntity } from '@/rendering/GameCanvas';
import { HUD } from '@/ui/HUD';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { getStage } from '@/game/stages';
import { getFormDefinition } from '@/game/forms';
import { createGameEntities } from '@/engine/createGameEntities';
import { getScreenMetrics } from '@/constants/dimensions';
import type { GameEntities } from '@/types/entities';

// Systems
import { scrollSystem } from '@/engine/systems/ScrollSystem';
import { movementSystem } from '@/engine/systems/MovementSystem';
import { createShootingSystem } from '@/engine/systems/ShootingSystem';
import { enemyAISystem } from '@/engine/systems/EnemyAISystem';
import { createSpawnSystem } from '@/engine/systems/SpawnSystem';
import { collisionSystem } from '@/engine/systems/CollisionSystem';
import { gateSystem } from '@/engine/systems/GateSystem';
import { iframeSystem } from '@/engine/systems/IFrameSystem';
import { bossSystem } from '@/engine/systems/BossSystem';
import { gameOverSystem } from '@/engine/systems/GameOverSystem';
import { createSyncRenderSystem } from '@/engine/systems/SyncRenderSystem';

export default function GameScreen() {
  const { stageId } = useLocalSearchParams<{ stageId: string }>();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const stageIdNum = Number(stageId) || 1;

  const stage = getStage(stageIdNum);
  const { scale } = getScreenMetrics(width, height);

  const [running, setRunning] = useState(true);

  // Initialize entities pool
  const entitiesRef = useRef<GameEntities>(createGameEntities(width, height));

  // SharedValue for Skia rendering
  const renderData = useSharedValue<RenderEntity[]>([]);
  const scrollYShared = useSharedValue(0);

  // Reset session store
  useEffect(() => {
    useGameSessionStore.getState().resetSession(stageIdNum);
  }, [stageIdNum]);

  // Watch for game-over or stage-clear
  useEffect(() => {
    const unsub = useGameSessionStore.subscribe((state) => {
      if (state.isGameOver || state.isStageClear) {
        setRunning(false);
        setTimeout(() => {
          router.replace(`/game/${stageIdNum}/result`);
        }, 1000);
      }
    });
    return unsub;
  }, [stageIdNum, router]);

  // Build systems
  const getForm = useCallback(
    () => getFormDefinition(useGameSessionStore.getState().currentForm),
    []
  );

  const shootingSystem = useCallback(() => createShootingSystem(getForm), [getForm]);
  const spawnSys = useCallback(() => createSpawnSystem(stage), [stage]);
  const syncSys = useCallback(() => createSyncRenderSystem(renderData), [renderData]);

  const systemsRef = useRef<GameSystem<GameEntities>[]>([
    scrollSystem,
    movementSystem,
    createShootingSystem(getForm),
    enemyAISystem,
    createSpawnSystem(stage),
    collisionSystem,
    gateSystem,
    iframeSystem,
    bossSystem,
    gameOverSystem,
    createSyncRenderSystem(renderData),
  ]);

  useGameLoop(systemsRef, entitiesRef, running);

  // Sync scroll SharedValue for background
  useEffect(() => {
    const interval = setInterval(() => {
      scrollYShared.value = entitiesRef.current?.scrollY ?? 0;
    }, 16);
    return () => clearInterval(interval);
  }, [scrollYShared]);

  // Gesture: drag to move player
  const pan = Gesture.Pan().onUpdate((e) => {
    const entities = entitiesRef.current;
    if (!entities) return;
    entities.player.x = e.absoluteX / scale - entities.player.width / 2;
    entities.player.y = e.absoluteY / scale - entities.player.height / 2;
  });

  const tap = Gesture.Tap().onEnd((e) => {
    const entities = entitiesRef.current;
    if (!entities) return;
    entities.player.x = e.absoluteX / scale - entities.player.width / 2;
    entities.player.y = e.absoluteY / scale - entities.player.height / 2;
  });

  const gesture = Gesture.Race(pan, tap);

  // HUD callbacks
  const handlePause = useCallback(() => {
    setRunning((r) => {
      useGameSessionStore.getState().setPaused(!r);
      return !r;
    });
  }, []);

  const handleEXBurst = useCallback(() => {
    // TODO: Implement EX burst effect (Phase 2)
    const store = useGameSessionStore.getState();
    if (store.exGauge >= 100) {
      // Kill all active enemies
      const entities = entitiesRef.current;
      if (entities) {
        for (const enemy of entities.enemies) {
          if (enemy.active) {
            enemy.hp = 0;
            enemy.active = false;
            store.addScore(100);
          }
        }
      }
      store.addExGauge(-100);
    }
  }, []);

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>
        <GameCanvas renderData={renderData} scrollY={scrollYShared} scale={scale} />
        <HUD onPause={handlePause} onEXBurst={handleEXBurst} />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14' },
});
```

### Task 50: Implement result screen

**Files:**
- Modify: `app/game/[stageId]/result.tsx`

```typescript
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { useEffect } from 'react';
import { COLORS } from '@/constants/colors';
import { getStageClearCredits } from '@/game/scoring';

export default function ResultScreen() {
  const { stageId } = useLocalSearchParams<{ stageId: string }>();
  const router = useRouter();
  const stageIdNum = Number(stageId) || 1;

  const score = useGameSessionStore((s) => s.score);
  const credits = useGameSessionStore((s) => s.credits);
  const isGameOver = useGameSessionStore((s) => s.isGameOver);
  const isStageClear = useGameSessionStore((s) => s.isStageClear);

  // Persist results
  useEffect(() => {
    const saveStore = useSaveDataStore.getState();
    if (isStageClear) {
      saveStore.updateHighScore(stageIdNum, score);
      saveStore.addCredits(credits + getStageClearCredits(false));
      saveStore.unlockStage(stageIdNum + 1);
    } else {
      saveStore.updateHighScore(stageIdNum, score);
      saveStore.addCredits(credits);
    }
  }, [stageIdNum, score, credits, isStageClear]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isStageClear ? 'STAGE CLEAR!' : 'GAME OVER'}
      </Text>

      <View style={styles.stats}>
        <Text style={styles.label}>Score</Text>
        <Text style={styles.value}>{score.toLocaleString()}</Text>

        <Text style={styles.label}>Credits Earned</Text>
        <Text style={styles.value}>{credits} Cr</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace(`/game/${stageIdNum}`)}
        >
          <Text style={styles.buttonText}>Replay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/stages')}
        >
          <Text style={styles.buttonText}>Stage Select</Text>
        </TouchableOpacity>

        {isStageClear && (
          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={() => router.replace(`/game/${stageIdNum + 1}`)}
          >
            <Text style={styles.buttonText}>Next Stage</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    marginBottom: 40,
  },
  stats: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 8,
  },
  label: { fontSize: 14, color: COLORS.lightGray },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    fontVariant: ['tabular-nums'],
    marginBottom: 8,
  },
  buttons: { gap: 12, width: '100%', maxWidth: 240 },
  button: {
    backgroundColor: '#ffffff22',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButton: { backgroundColor: COLORS.neonBlue + '44' },
  buttonText: { fontSize: 16, color: COLORS.white, fontWeight: '600' },
});
```

### Task 51: Commit Layer 8

Run: `npx tsc --noEmit` — fix all errors
Run: `npx jest`

```bash
git add src/engine/createGameEntities.ts app/game/
git commit -m "feat: Implement game screen with full system integration and result screen"
```

---

## Layer 9: Audio System

### Task 52: Create AudioManager

**Files:**
- Create: `src/audio/AudioManager.ts`

```typescript
import { Audio } from 'expo-av';
import type { AVPlaybackSource } from 'expo-av';

type SoundId =
  | 'shoot'
  | 'enemyDestroy'
  | 'gatePass'
  | 'refit'
  | 'damage'
  | 'exBurst';

type BgmId = 'stage' | 'boss';

class AudioManagerClass {
  private sounds: Map<string, Audio.Sound> = new Map();
  private bgm: Audio.Sound | null = null;
  private bgmVolume = 0.7;
  private seVolume = 1.0;

  async init() {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });
  }

  setVolumes(bgm: number, se: number) {
    this.bgmVolume = bgm;
    this.seVolume = se;
    this.bgm?.setVolumeAsync(bgm);
  }

  async playBgm(_id: BgmId) {
    // TODO: Load actual BGM files when available
    // Placeholder: no-op until audio assets are added
  }

  async stopBgm() {
    if (this.bgm) {
      await this.bgm.stopAsync();
      await this.bgm.unloadAsync();
      this.bgm = null;
    }
  }

  async playSe(_id: SoundId) {
    // TODO: Load actual SE files when available
    // Placeholder: no-op until audio assets are added
  }

  async cleanup() {
    await this.stopBgm();
    for (const sound of this.sounds.values()) {
      await sound.unloadAsync();
    }
    this.sounds.clear();
  }
}

export const AudioManager = new AudioManagerClass();
```

### Task 53: Update audio barrel

**Files:**
- Modify: `src/audio/index.ts`

```typescript
export { AudioManager } from './AudioManager';
```

### Task 54: Commit Layer 9

Run: `npx tsc --noEmit`

```bash
git add src/audio/
git commit -m "feat: Add AudioManager framework with expo-av (placeholder audio files)"
```

---

## Final: Quality Check + Branch

### Task 55: Run full quality check

Run:
```bash
npx expo lint
npx tsc --noEmit
npx jest --passWithNoTests
```

Fix any errors found.

### Task 56: Create feature branch and push

```bash
git checkout -b feature/phase1-core-mechanics
git push -u origin feature/phase1-core-mechanics
```

### Task 57: Create Pull Request

```bash
gh pr create \
  --title "feat: Phase 1 — Core Mechanics (全ゲームプレイ基盤)" \
  --body "$(cat <<'EOF'
## Summary
- Type definitions + constants for all game entities (forms, gates, enemies, stages)
- Game data: 4 mecha forms, difficulty scaling, scoring, Stage 1 timeline
- Engine: entity pool system (player, enemies, bullets, gates, boss) + AABB collision
- 11 game systems: scroll, movement, shooting, enemy AI, spawn, collision, gates, i-frame, boss, game-over, render sync
- Skia GameCanvas with 128 pre-allocated entity slots + neon glow effects
- Full Zustand stores: gameSessionStore (combat state) + saveDataStore (persistence)
- HUD: HP bar, score, pause, form indicator, combo gauge, EX button/gauge
- Game screen: full integration of loop + systems + canvas + HUD + gesture input
- Result screen: score display, credits, replay/next navigation
- AudioManager framework (placeholder files)

## Test plan
- [ ] `npx tsc --noEmit` passes
- [ ] `npx jest` passes
- [ ] Stage 1 plays through: enemies appear, bullets fire, gates work
- [ ] Player movement responds to swipe/tap
- [ ] HP decreases on hit, i-frame blink works
- [ ] Game over triggers on HP 0
- [ ] Result screen shows correct score
- [ ] Form change works via refit gate

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
