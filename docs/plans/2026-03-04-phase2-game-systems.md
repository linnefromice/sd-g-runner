# Phase 2: ゲームシステム拡充 — 実装プラン

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** コンボ覚醒タイマー、覚醒時無敵・3Way ホーミング射撃、ゲートプリセット、ステージ 2-5 データ、HUD 微調整を一括実装する

**Approach:** レイヤー別積み上げ（データ → エンジン → ストア → UI → 画面 → テスト）

**Tech Stack:** TypeScript, Zustand, React Native, expo-router, custom ECS game loop

---

## Task 1: BulletEntity に homing フラグ追加

**Files:**
- Modify: `src/types/entities.ts:37-41`
- Modify: `src/engine/entities/Bullet.ts:7-24`

**Step 1: BulletEntity 型に homing フィールド追加**

`src/types/entities.ts` — BulletEntity interface に `homing` を追加:

```typescript
export interface BulletEntity extends BaseEntity {
  type: 'playerBullet' | 'enemyBullet';
  damage: number;
  speed: number;
  homing: boolean;
}
```

**Step 2: createPlayerBullet に homing パラメータ追加**

`src/engine/entities/Bullet.ts` — config に `homing` オプションを追加:

```typescript
export function createPlayerBullet(
  x: number,
  y: number,
  damage: number,
  config?: { width?: number; height?: number; speed?: number; homing?: boolean }
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
    homing: config?.homing ?? false,
  };
}
```

`createEnemyBullet` にも `homing: false` を返却に追加:

```typescript
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
    homing: false,
  };
}
```

**Step 3: createGameEntities のプール初期値に homing 追加**

`src/engine/createGameEntities.ts` — playerBullets と enemyBullets の初期化オブジェクトに `homing: false` を追加。

**Step 4: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS (no errors)

**Step 5: コミット**

```bash
git add src/types/entities.ts src/engine/entities/Bullet.ts src/engine/createGameEntities.ts
git commit -m "feat: Add homing flag to BulletEntity type and factories"
```

---

## Task 2: ゲートプリセットデータ

**Files:**
- Create: `src/game/gates.ts`

**Step 1: ゲートプリセット定義を作成**

`src/game/gates.ts`:

```typescript
import type { GateDefinition, GatePairConfig } from '@/types/gates';

// === 個別ゲート定義 ===

// Enhance gates
export const GATE_ATK_UP: GateDefinition = {
  type: 'enhance',
  displayLabel: 'ATK +5',
  effects: [{ kind: 'stat_add', stat: 'atk', value: 5 }],
};

export const GATE_SPD_UP: GateDefinition = {
  type: 'enhance',
  displayLabel: 'SPD +10%',
  effects: [{ kind: 'stat_multiply', stat: 'speed', value: 1.1 }],
};

export const GATE_FR_UP: GateDefinition = {
  type: 'enhance',
  displayLabel: 'FR +20%',
  effects: [{ kind: 'stat_multiply', stat: 'fireRate', value: 1.2 }],
};

export const GATE_ATK_UP_10: GateDefinition = {
  type: 'enhance',
  displayLabel: 'ATK +10',
  effects: [{ kind: 'stat_add', stat: 'atk', value: 10 }],
};

// Recovery gates
export const GATE_HEAL_20: GateDefinition = {
  type: 'recovery',
  displayLabel: 'HP +20',
  effects: [{ kind: 'heal', value: 20 }],
};

export const GATE_HEAL_30: GateDefinition = {
  type: 'recovery',
  displayLabel: 'HP +30',
  effects: [{ kind: 'heal', value: 30 }],
};

export const GATE_HEAL_50P: GateDefinition = {
  type: 'recovery',
  displayLabel: 'HP +50%',
  effects: [{ kind: 'heal_percent', value: 50 }],
};

// Tradeoff gates
export const GATE_GLASS_CANNON: GateDefinition = {
  type: 'tradeoff',
  displayLabel: 'ATK↑ SPD↓',
  effects: [
    { kind: 'stat_add', stat: 'atk', value: 15 },
    { kind: 'stat_multiply', stat: 'speed', value: 0.8 },
  ],
};

export const GATE_SPEED_DEMON: GateDefinition = {
  type: 'tradeoff',
  displayLabel: 'SPD↑ ATK↓',
  effects: [
    { kind: 'stat_multiply', stat: 'speed', value: 1.3 },
    { kind: 'stat_multiply', stat: 'atk', value: 0.7 },
  ],
};

export const GATE_RAPID_FIRE: GateDefinition = {
  type: 'tradeoff',
  displayLabel: 'FR↑ ATK↓',
  effects: [
    { kind: 'stat_multiply', stat: 'fireRate', value: 1.5 },
    { kind: 'stat_multiply', stat: 'atk', value: 0.6 },
  ],
};

// Refit gates
export const GATE_REFIT_HEAVY: GateDefinition = {
  type: 'refit',
  displayLabel: '→ Heavy',
  effects: [{ kind: 'refit', targetForm: 'SD_HeavyArtillery' }],
};

export const GATE_REFIT_SPEED: GateDefinition = {
  type: 'refit',
  displayLabel: '→ Speed',
  effects: [{ kind: 'refit', targetForm: 'SD_HighSpeed' }],
};

// === ペア定義 ===

export const PAIR_ATK_SPD: GatePairConfig = {
  layout: 'forced',
  left: GATE_ATK_UP,
  right: GATE_SPD_UP,
};

export const PAIR_REFIT: GatePairConfig = {
  layout: 'forced',
  left: GATE_REFIT_HEAVY,
  right: GATE_REFIT_SPEED,
};

export const PAIR_RECOVERY: GatePairConfig = {
  layout: 'forced',
  left: GATE_HEAL_20,
  right: GATE_ATK_UP,
};

export const PAIR_TRADEOFF_OPTIONAL: GatePairConfig = {
  layout: 'optional',
  left: GATE_GLASS_CANNON,
  right: GATE_SPEED_DEMON,
};
```

**Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: コミット**

```bash
git add src/game/gates.ts
git commit -m "feat: Add gate preset definitions for stages 2-5"
```

---

## Task 3: ステージ 2-5 タイムラインデータ

**Files:**
- Create: `src/game/stages/stage2.ts`
- Create: `src/game/stages/stage3.ts`
- Create: `src/game/stages/stage4.ts`
- Create: `src/game/stages/stage5.ts`
- Modify: `src/game/stages/index.ts`

**Step 1: Stage 2 — 回復ゲート初登場**

`src/game/stages/stage2.ts`:

```typescript
import type { StageDefinition } from '@/types/stages';
import { getDifficultyForStage } from '@/game/difficulty';
import {
  GATE_ATK_UP,
  GATE_SPD_UP,
  GATE_HEAL_20,
  GATE_FR_UP,
  GATE_HEAL_30,
} from '@/game/gates';

export const STAGE_2: StageDefinition = {
  id: 2,
  name: 'Asteroid Belt',
  isBossStage: false,
  duration: 100,
  difficulty: getDifficultyForStage(2),
  timeline: [
    // Wave 1: stationary intro
    { time: 4, type: 'enemy_spawn', enemyType: 'stationary', x: 120 },
    { time: 4, type: 'enemy_spawn', enemyType: 'stationary', x: 200 },
    // First enhance gate
    {
      time: 12,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
    // Wave 2: first patrol enemy
    { time: 18, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    { time: 22, type: 'enemy_spawn', enemyType: 'stationary', x: 80 },
    { time: 22, type: 'enemy_spawn', enemyType: 'stationary', x: 240 },
    // Recovery gate (new!)
    {
      time: 30,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_20, right: GATE_ATK_UP },
    },
    // Wave 3: patrol pair
    { time: 38, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 42, type: 'enemy_spawn', enemyType: 'patrol', x: 220 },
    // Second enhance gate
    {
      time: 50,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_FR_UP, right: GATE_ATK_UP },
    },
    // Wave 4: mixed
    { time: 58, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    { time: 60, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    { time: 64, type: 'enemy_spawn', enemyType: 'stationary', x: 260 },
    // Recovery gate 2
    {
      time: 72,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_30, right: GATE_SPD_UP },
    },
    // Final wave
    { time: 78, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    { time: 82, type: 'enemy_spawn', enemyType: 'stationary', x: 100 },
    { time: 82, type: 'enemy_spawn', enemyType: 'stationary', x: 220 },
    // Third enhance gate
    {
      time: 90,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_FR_UP },
    },
  ],
};
```

**Step 2: Stage 3 — トレードオフゲート + optional レイアウト**

`src/game/stages/stage3.ts`:

```typescript
import type { StageDefinition } from '@/types/stages';
import { getDifficultyForStage } from '@/game/difficulty';
import {
  GATE_ATK_UP,
  GATE_SPD_UP,
  GATE_HEAL_20,
  GATE_FR_UP,
  GATE_GLASS_CANNON,
  GATE_SPEED_DEMON,
} from '@/game/gates';

export const STAGE_3: StageDefinition = {
  id: 3,
  name: 'Nebula Corridor',
  isBossStage: false,
  duration: 110,
  difficulty: getDifficultyForStage(3),
  timeline: [
    // Wave 1
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    { time: 6, type: 'enemy_spawn', enemyType: 'stationary', x: 80 },
    { time: 6, type: 'enemy_spawn', enemyType: 'stationary', x: 240 },
    // Enhance gate
    {
      time: 14,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
    // Wave 2: patrol heavy
    { time: 22, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 24, type: 'enemy_spawn', enemyType: 'patrol', x: 220 },
    { time: 28, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    // Recovery
    {
      time: 35,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_20, right: GATE_FR_UP },
    },
    // Wave 3
    { time: 42, type: 'enemy_spawn', enemyType: 'patrol', x: 140 },
    { time: 44, type: 'enemy_spawn', enemyType: 'stationary', x: 60 },
    { time: 44, type: 'enemy_spawn', enemyType: 'stationary', x: 260 },
    // Tradeoff gate — optional layout (can be dodged)
    {
      time: 52,
      type: 'gate_spawn',
      gateConfig: { layout: 'optional', left: GATE_GLASS_CANNON, right: GATE_SPEED_DEMON },
    },
    // Wave 4
    { time: 60, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    { time: 62, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    // Enhance gate
    {
      time: 70,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_FR_UP },
    },
    // Wave 5: dense
    { time: 78, type: 'enemy_spawn', enemyType: 'patrol', x: 120 },
    { time: 78, type: 'enemy_spawn', enemyType: 'stationary', x: 240 },
    { time: 82, type: 'enemy_spawn', enemyType: 'patrol', x: 200 },
    // Enhance gate for combo buildup
    {
      time: 90,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
    // Final wave
    { time: 96, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    { time: 98, type: 'enemy_spawn', enemyType: 'stationary', x: 100 },
    { time: 98, type: 'enemy_spawn', enemyType: 'stationary', x: 220 },
  ],
};
```

**Step 3: Stage 4 — 高密度、全ゲートタイプ**

`src/game/stages/stage4.ts`:

```typescript
import type { StageDefinition } from '@/types/stages';
import { getDifficultyForStage } from '@/game/difficulty';
import {
  GATE_ATK_UP,
  GATE_SPD_UP,
  GATE_FR_UP,
  GATE_ATK_UP_10,
  GATE_HEAL_30,
  GATE_HEAL_50P,
  GATE_GLASS_CANNON,
  GATE_RAPID_FIRE,
  GATE_REFIT_HEAVY,
  GATE_REFIT_SPEED,
} from '@/game/gates';

export const STAGE_4: StageDefinition = {
  id: 4,
  name: 'Gravity Well',
  isBossStage: false,
  duration: 120,
  difficulty: getDifficultyForStage(4),
  timeline: [
    // Wave 1: aggressive opening
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 220 },
    { time: 6, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    // Enhance
    {
      time: 12,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP_10, right: GATE_SPD_UP },
    },
    // Wave 2
    { time: 18, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    { time: 20, type: 'enemy_spawn', enemyType: 'patrol', x: 240 },
    { time: 22, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    { time: 22, type: 'enemy_spawn', enemyType: 'stationary', x: 60 },
    // Recovery (big heal)
    {
      time: 28,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_50P, right: GATE_HEAL_30 },
    },
    // Wave 3: patrol swarm
    { time: 35, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 36, type: 'enemy_spawn', enemyType: 'patrol', x: 200 },
    { time: 38, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    // Refit gate
    {
      time: 44,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_REFIT_HEAVY, right: GATE_REFIT_SPEED },
    },
    // Wave 4
    { time: 50, type: 'enemy_spawn', enemyType: 'patrol', x: 120 },
    { time: 52, type: 'enemy_spawn', enemyType: 'stationary', x: 260 },
    { time: 54, type: 'enemy_spawn', enemyType: 'patrol', x: 60 },
    // Tradeoff gate (optional)
    {
      time: 60,
      type: 'gate_spawn',
      gateConfig: { layout: 'optional', left: GATE_GLASS_CANNON, right: GATE_RAPID_FIRE },
    },
    // Wave 5: dense mixed
    { time: 66, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    { time: 66, type: 'enemy_spawn', enemyType: 'patrol', x: 240 },
    { time: 68, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    { time: 70, type: 'enemy_spawn', enemyType: 'patrol', x: 140 },
    // Enhance (combo buildup)
    {
      time: 76,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_FR_UP },
    },
    // Wave 6
    { time: 82, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 84, type: 'enemy_spawn', enemyType: 'patrol', x: 200 },
    { time: 86, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    // Enhance gate (3rd → can trigger awakening)
    {
      time: 92,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
    // Recovery before finale
    {
      time: 100,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_30, right: GATE_ATK_UP_10 },
    },
    // Final wave
    { time: 105, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    { time: 105, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    { time: 105, type: 'enemy_spawn', enemyType: 'patrol', x: 240 },
  ],
};
```

**Step 4: Stage 5 — ボスステージ**

`src/game/stages/stage5.ts`:

```typescript
import type { StageDefinition } from '@/types/stages';
import { getDifficultyForStage } from '@/game/difficulty';
import { GATE_ATK_UP, GATE_SPD_UP, GATE_FR_UP, GATE_HEAL_20 } from '@/game/gates';

export const STAGE_5: StageDefinition = {
  id: 5,
  name: 'Core Breach',
  isBossStage: true,
  duration: 180, // Longer for boss fight
  difficulty: getDifficultyForStage(5),
  timeline: [
    // Pre-boss wave 1
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 120 },
    { time: 5, type: 'enemy_spawn', enemyType: 'patrol', x: 200 },
    // Enhance (combo start)
    {
      time: 12,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
    // Pre-boss wave 2
    { time: 18, type: 'enemy_spawn', enemyType: 'stationary', x: 80 },
    { time: 18, type: 'enemy_spawn', enemyType: 'stationary', x: 240 },
    { time: 22, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    // Enhance 2 (combo 2)
    {
      time: 28,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_FR_UP, right: GATE_ATK_UP },
    },
    // Pre-boss wave 3
    { time: 34, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 36, type: 'enemy_spawn', enemyType: 'patrol', x: 220 },
    // Recovery before boss
    {
      time: 42,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_20, right: GATE_ATK_UP },
    },
    // Enhance 3 (combo → awakening chance)
    {
      time: 50,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
    // Boss spawn
    { time: 60, type: 'boss_spawn', bossId: 'boss_1' },
  ],
};
```

**Step 5: ステージレジストリ更新**

`src/game/stages/index.ts`:

```typescript
import type { StageDefinition } from '@/types/stages';
import { STAGE_1 } from './stage1';
import { STAGE_2 } from './stage2';
import { STAGE_3 } from './stage3';
import { STAGE_4 } from './stage4';
import { STAGE_5 } from './stage5';

const STAGES: Record<number, StageDefinition> = {
  1: STAGE_1,
  2: STAGE_2,
  3: STAGE_3,
  4: STAGE_4,
  5: STAGE_5,
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

**Step 6: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 7: コミット**

```bash
git add src/game/gates.ts src/game/stages/stage2.ts src/game/stages/stage3.ts src/game/stages/stage4.ts src/game/stages/stage5.ts src/game/stages/index.ts
git commit -m "feat: Add gate presets and stage 2-5 timeline data"
```

---

## Task 4: AwakenedSystem — 覚醒タイマー管理

**Files:**
- Create: `src/engine/systems/AwakenedSystem.ts`
- Modify: `src/stores/gameSessionStore.ts` (awakenedWarning フィールド追加)

**Step 1: ストアに awakenedWarning フィールド追加**

`src/stores/gameSessionStore.ts` — interface に追加:

```typescript
// Combo セクション内に追加:
awakenedWarning: boolean;
```

INITIAL_STATE に追加:

```typescript
awakenedWarning: false,
```

action 追加:

```typescript
setAwakenedWarning: (value: boolean) => void;
```

実装:

```typescript
setAwakenedWarning: (value) => set({ awakenedWarning: value }),
```

`resetSession` で `awakenedWarning: false` もリセットに含める。

`deactivateAwakened` でも `awakenedWarning: false` をセット:

```typescript
deactivateAwakened: () =>
  set((s) => ({
    isAwakened: false,
    awakenedTimer: 0,
    awakenedWarning: false,
    currentForm: s.previousForm,
  })),
```

**Step 2: AwakenedSystem 作成**

`src/engine/systems/AwakenedSystem.ts`:

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { useGameSessionStore } from '@/stores/gameSessionStore';

const AWAKENED_WARNING_THRESHOLD = 3000; // ms

export const awakenedSystem: GameSystem<GameEntities> = (_entities, { time }) => {
  const store = useGameSessionStore.getState();
  if (!store.isAwakened) return;

  const newTimer = store.awakenedTimer - time.delta;

  if (newTimer <= 0) {
    store.deactivateAwakened();
    return;
  }

  // Warning at 3s remaining
  if (newTimer <= AWAKENED_WARNING_THRESHOLD && !store.awakenedWarning) {
    store.setAwakenedWarning(true);
  }

  // Update timer in store
  set_awakenedTimer(newTimer);
};

/** Direct timer update to avoid full state replace */
function set_awakenedTimer(value: number): void {
  useGameSessionStore.setState({ awakenedTimer: value });
}
```

**Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: コミット**

```bash
git add src/stores/gameSessionStore.ts src/engine/systems/AwakenedSystem.ts
git commit -m "feat: Add AwakenedSystem with timer countdown and warning"
```

---

## Task 5: ShootingSystem 拡張 — 複数弾 + ホーミングフラグ

**Files:**
- Modify: `src/engine/systems/ShootingSystem.ts`

**Step 1: createShootingSystem を拡張**

`src/engine/systems/ShootingSystem.ts` — 複数弾発射 (count=3 → 扇状) + homing フラグ対応:

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { MechaFormDefinition } from '@/types/forms';
import { BASE_FIRE_INTERVAL } from '@/constants/balance';
import { createPlayerBullet } from '@/engine/entities/Bullet';

let fireTimer = 0;

const SPREAD_ANGLE = 15; // degrees between spread bullets

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
    const damage = 10 * form.attackMultiplier;
    const isHoming = form.specialAbility === 'homing_invincible';
    const count = bulletConfig.count;
    const centerX = p.x + p.width / 2;

    if (count <= 1) {
      // Single bullet (original behavior)
      const slot = entities.playerBullets.find((b) => !b.active);
      if (!slot) return;
      const bullet = createPlayerBullet(centerX, p.y, damage, {
        width: bulletConfig.width,
        height: bulletConfig.height,
        speed: bulletConfig.speed,
        homing: isHoming,
      });
      Object.assign(slot, bullet);
      slot.active = true;
    } else {
      // Multi-bullet spread
      const halfSpread = ((count - 1) * SPREAD_ANGLE) / 2;
      for (let i = 0; i < count; i++) {
        const slot = entities.playerBullets.find((b) => !b.active);
        if (!slot) break;
        const angleDeg = -halfSpread + i * SPREAD_ANGLE;
        const offsetX = Math.tan((angleDeg * Math.PI) / 180) * 20;
        const bullet = createPlayerBullet(centerX + offsetX, p.y, damage, {
          width: bulletConfig.width,
          height: bulletConfig.height,
          speed: bulletConfig.speed,
          homing: isHoming,
        });
        Object.assign(slot, bullet);
        slot.active = true;
      }
    }
  };
}
```

**Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: コミット**

```bash
git add src/engine/systems/ShootingSystem.ts
git commit -m "feat: Extend ShootingSystem with multi-bullet spread and homing flag"
```

---

## Task 6: MovementSystem 拡張 — ホーミング弾追尾

**Files:**
- Modify: `src/engine/systems/MovementSystem.ts`

**Step 1: ホーミングロジック追加**

`src/engine/systems/MovementSystem.ts` — playerBullets ループ内でホーミング弾の追尾処理を追加:

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { BulletEntity, EnemyEntity, BossEntity } from '@/types/entities';
import {
  PLAYER_MIN_X,
  PLAYER_MAX_X,
  PLAYER_Y_TOP_RATIO,
  PLAYER_Y_BOTTOM_MARGIN,
} from '@/constants/dimensions';
import { deactivateBullet } from '@/engine/entities/Bullet';
import { deactivateEnemy } from '@/engine/entities/Enemy';

const BASE_SCROLL_SPEED_LOGICAL = 60;
const HOMING_TURN_RATE = 3.0; // radians per second — how fast the bullet can turn

export const movementSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const dt = time.delta / 1000;
  const { visibleHeight } = entities.screen;

  // Clamp player position
  const p = entities.player;
  const minY = visibleHeight * PLAYER_Y_TOP_RATIO;
  const maxY = visibleHeight - PLAYER_Y_BOTTOM_MARGIN;
  p.x = Math.max(PLAYER_MIN_X, Math.min(PLAYER_MAX_X - p.width, p.x));
  p.y = Math.max(minY, Math.min(maxY - p.height, p.y));

  // Move player bullets
  for (const b of entities.playerBullets) {
    if (!b.active) continue;

    if (b.homing) {
      moveHomingBullet(b, entities, dt);
    } else {
      b.y -= b.speed * dt;
    }

    if (b.y + b.height < 0 || b.y > visibleHeight) deactivateBullet(b);
  }

  // Move enemy bullets downward
  for (const b of entities.enemyBullets) {
    if (!b.active) continue;
    b.y += b.speed * dt;
    if (b.y > visibleHeight) deactivateBullet(b);
  }

  // Move enemies
  for (const e of entities.enemies) {
    if (!e.active) continue;
    e.y += BASE_SCROLL_SPEED_LOGICAL * dt;
    if (e.y > visibleHeight + 50) {
      deactivateEnemy(e);
    }
  }

  // Move gates
  for (const g of entities.gates) {
    if (!g.active) continue;
    g.y += BASE_SCROLL_SPEED_LOGICAL * dt;
    if (g.y > visibleHeight + 50) {
      g.active = false;
    }
  }
};

function moveHomingBullet(
  bullet: BulletEntity,
  entities: GameEntities,
  dt: number
): void {
  const target = findNearestTarget(bullet, entities);
  if (!target) {
    // No target — fly straight up
    bullet.y -= bullet.speed * dt;
    return;
  }

  // Calculate direction to target
  const targetCX = target.x + target.width / 2;
  const targetCY = target.y + target.height / 2;
  const bulletCX = bullet.x + bullet.width / 2;
  const bulletCY = bullet.y + bullet.height / 2;

  const dx = targetCX - bulletCX;
  const dy = targetCY - bulletCY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 1) {
    bullet.y -= bullet.speed * dt;
    return;
  }

  // Move toward target (with interpolated homing strength)
  const moveX = (dx / dist) * bullet.speed * dt;
  const moveY = (dy / dist) * bullet.speed * dt;

  // Blend homing direction with upward direction for natural movement
  const homingStrength = Math.min(1.0, HOMING_TURN_RATE * dt);
  bullet.x += moveX * homingStrength;
  bullet.y += moveY * homingStrength + (-bullet.speed * dt) * (1 - homingStrength);
}

function findNearestTarget(
  bullet: BulletEntity,
  entities: GameEntities
): { x: number; y: number; width: number; height: number } | null {
  let nearest: { x: number; y: number; width: number; height: number } | null = null;
  let nearestDist = Infinity;

  const bx = bullet.x + bullet.width / 2;
  const by = bullet.y + bullet.height / 2;

  // Check enemies
  for (const e of entities.enemies) {
    if (!e.active) continue;
    const ex = e.x + e.width / 2;
    const ey = e.y + e.height / 2;
    const dist = Math.sqrt((ex - bx) ** 2 + (ey - by) ** 2);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = e;
    }
  }

  // Check boss
  if (entities.boss?.active) {
    const boss = entities.boss;
    const bossX = boss.x + boss.width / 2;
    const bossY = boss.y + boss.height / 2;
    const dist = Math.sqrt((bossX - bx) ** 2 + (bossY - by) ** 2);
    if (dist < nearestDist) {
      nearest = boss;
    }
  }

  return nearest;
}
```

**Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: コミット**

```bash
git add src/engine/systems/MovementSystem.ts
git commit -m "feat: Add homing bullet tracking in MovementSystem"
```

---

## Task 7: CollisionSystem 拡張 — 覚醒時の接触無敵

**Files:**
- Modify: `src/engine/systems/CollisionSystem.ts`

**Step 1: 覚醒時の敵/ボス本体接触ダメージ無効化**

`src/engine/systems/CollisionSystem.ts` — import 追加 + 覚醒チェック:

Enemy collision → Player ブロックの前に覚醒チェックを追加:

```typescript
import { useGameSessionStore } from '@/stores/gameSessionStore';
// ... existing imports ...

export const collisionSystem: GameSystem<GameEntities> = (entities) => {
  const player = entities.player;
  if (!player.active) return;

  const playerHB = getPlayerHitbox(player);
  const store = useGameSessionStore.getState();

  // ... (Player bullets → Enemies, Player bullets → Boss は既存のまま) ...

  // Skip damage checks if player is invincible
  if (player.isInvincible) return;

  // Check if awakened with homing_invincible
  const isAwakenedInvincible = store.isAwakened;

  // Enemy bullets → Player (always takes damage, even when awakened)
  for (const bullet of entities.enemyBullets) {
    if (!bullet.active) continue;
    if (checkAABBOverlap(playerHB, bullet)) {
      deactivateBullet(bullet);
      applyDamage(player, bullet.damage, store);
      return;
    }
  }

  // Enemy collision → Player (skip if awakened)
  if (!isAwakenedInvincible) {
    for (const enemy of entities.enemies) {
      if (!enemy.active) continue;
      if (checkAABBOverlap(playerHB, enemy)) {
        applyDamage(player, 15, store);
        return;
      }
    }
  }

  // Boss collision → Player (skip if awakened)
  if (!isAwakenedInvincible && entities.boss?.active && checkAABBOverlap(playerHB, entities.boss)) {
    applyDamage(player, 50, store);
  }
};
```

**Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: コミット**

```bash
git add src/engine/systems/CollisionSystem.ts
git commit -m "feat: Add awakened body-contact invincibility in CollisionSystem"
```

---

## Task 8: ゲーム画面に AwakenedSystem 追加

**Files:**
- Modify: `app/game/[stageId]/index.tsx`

**Step 1: import + systems 配列に追加**

`app/game/[stageId]/index.tsx` — awakenedSystem を import して systems に追加:

```typescript
import { awakenedSystem } from '@/engine/systems/AwakenedSystem';
```

`systemsRef.current` の配列に `awakenedSystem` を追加（`collisionSystem` の直前がベスト — 覚醒状態をチェックする前に更新する）:

```typescript
const systemsRef = useRef<GameSystem<GameEntities>[]>([
  scrollSystem,
  movementSystem,
  createShootingSystem(getForm),
  enemyAISystem,
  createSpawnSystem(stage),
  awakenedSystem,    // ← 追加: collision の前に覚醒タイマーを更新
  collisionSystem,
  gateSystem,
  iframeSystem,
  bossSystem,
  gameOverSystem,
  createSyncRenderSystem(renderData),
]);
```

**Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: コミット**

```bash
git add app/game/[stageId]/index.tsx
git commit -m "feat: Register AwakenedSystem in game screen system pipeline"
```

---

## Task 9: HUD 微調整 — コンボゲージ強調 + 覚醒警告

**Files:**
- Modify: `src/ui/HUD.tsx`

**Step 1: ComboGauge のネオン強調 + 覚醒警告表示**

`src/ui/HUD.tsx` — ComboGauge コンポーネント修正:

```typescript
function ComboGauge() {
  const comboCount = useGameSessionStore((s) => s.comboCount);
  const isAwakened = useGameSessionStore((s) => s.isAwakened);
  const awakenedWarning = useGameSessionStore((s) => s.awakenedWarning);

  if (isAwakened) {
    return (
      <View style={styles.comboContainer}>
        <Text
          style={[
            styles.comboText,
            {
              color: awakenedWarning ? COLORS.hpCritical : COLORS.scoreYellow,
            },
          ]}
        >
          {awakenedWarning ? 'FADING!' : 'AWAKENED'}
        </Text>
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
              borderColor: i < comboCount ? COLORS.neonGreen : '#555',
              shadowColor: i < comboCount ? COLORS.neonGreen : 'transparent',
              shadowOpacity: i < comboCount ? 0.8 : 0,
              shadowRadius: i < comboCount ? 4 : 0,
            },
          ]}
        />
      ))}
    </View>
  );
}
```

**Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: コミット**

```bash
git add src/ui/HUD.tsx
git commit -m "feat: Enhance ComboGauge with neon glow and awakened warning"
```

---

## Task 10: テスト — コンボロジック + 覚醒タイマー + ステージデータ検証

**Files:**
- Create: `__tests__/engine/AwakenedSystem.test.ts`
- Create: `__tests__/game/stages.test.ts`
- Create: `__tests__/game/gates.test.ts`

**Step 1: AwakenedSystem テスト**

`__tests__/engine/AwakenedSystem.test.ts`:

```typescript
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { AWAKENED_DURATION } from '@/constants/balance';

describe('AwakenedSystem logic', () => {
  beforeEach(() => {
    useGameSessionStore.getState().resetSession(1);
  });

  test('activateAwakened sets isAwakened and timer', () => {
    useGameSessionStore.getState().activateAwakened();
    const state = useGameSessionStore.getState();
    expect(state.isAwakened).toBe(true);
    expect(state.awakenedTimer).toBe(AWAKENED_DURATION);
    expect(state.currentForm).toBe('SD_Awakened');
    expect(state.comboCount).toBe(0);
  });

  test('deactivateAwakened restores previous form', () => {
    useGameSessionStore.getState().setForm('SD_HeavyArtillery');
    useGameSessionStore.getState().activateAwakened();
    useGameSessionStore.getState().deactivateAwakened();
    const state = useGameSessionStore.getState();
    expect(state.isAwakened).toBe(false);
    expect(state.awakenedTimer).toBe(0);
    expect(state.awakenedWarning).toBe(false);
    expect(state.currentForm).toBe('SD_HeavyArtillery');
  });

  test('awakenedWarning is set and cleared', () => {
    useGameSessionStore.getState().setAwakenedWarning(true);
    expect(useGameSessionStore.getState().awakenedWarning).toBe(true);
    useGameSessionStore.getState().setAwakenedWarning(false);
    expect(useGameSessionStore.getState().awakenedWarning).toBe(false);
  });

  test('incrementCombo triggers awakening at threshold', () => {
    const store = useGameSessionStore.getState();
    store.incrementCombo(); // 1
    store.incrementCombo(); // 2
    expect(useGameSessionStore.getState().isAwakened).toBe(false);
    store.incrementCombo(); // 3 → awakened
    expect(useGameSessionStore.getState().isAwakened).toBe(true);
    expect(useGameSessionStore.getState().currentForm).toBe('SD_Awakened');
  });

  test('resetCombo resets count to 0', () => {
    useGameSessionStore.getState().incrementCombo();
    useGameSessionStore.getState().incrementCombo();
    useGameSessionStore.getState().resetCombo();
    expect(useGameSessionStore.getState().comboCount).toBe(0);
  });
});
```

**Step 2: Stage data validation テスト**

`__tests__/game/stages.test.ts`:

```typescript
import { getStage, getAvailableStageIds } from '@/game/stages';

describe('Stage data', () => {
  test('all 5 stages are registered', () => {
    const ids = getAvailableStageIds();
    expect(ids).toEqual([1, 2, 3, 4, 5]);
  });

  test.each([1, 2, 3, 4, 5])('stage %i has valid structure', (id) => {
    const stage = getStage(id);
    expect(stage.id).toBe(id);
    expect(stage.name).toBeTruthy();
    expect(stage.duration).toBeGreaterThan(0);
    expect(stage.timeline.length).toBeGreaterThan(0);
    expect(stage.difficulty.enemyHpMultiplier).toBeGreaterThanOrEqual(1.0);
  });

  test('stage 5 is a boss stage', () => {
    const stage = getStage(5);
    expect(stage.isBossStage).toBe(true);
    const bossEvents = stage.timeline.filter((e) => e.type === 'boss_spawn');
    expect(bossEvents.length).toBe(1);
  });

  test('timeline events are ordered by time', () => {
    for (let id = 1; id <= 5; id++) {
      const stage = getStage(id);
      for (let i = 1; i < stage.timeline.length; i++) {
        expect(stage.timeline[i].time).toBeGreaterThanOrEqual(
          stage.timeline[i - 1].time
        );
      }
    }
  });

  test('stages 2-4 are not boss stages', () => {
    for (let id = 2; id <= 4; id++) {
      const stage = getStage(id);
      expect(stage.isBossStage).toBe(false);
    }
  });
});
```

**Step 3: Gate presets テスト**

`__tests__/game/gates.test.ts`:

```typescript
import {
  GATE_ATK_UP,
  GATE_HEAL_20,
  GATE_GLASS_CANNON,
  GATE_REFIT_HEAVY,
  PAIR_ATK_SPD,
  PAIR_TRADEOFF_OPTIONAL,
} from '@/game/gates';

describe('Gate presets', () => {
  test('enhance gate has stat_add effect', () => {
    expect(GATE_ATK_UP.type).toBe('enhance');
    expect(GATE_ATK_UP.effects[0].kind).toBe('stat_add');
  });

  test('recovery gate has heal effect', () => {
    expect(GATE_HEAL_20.type).toBe('recovery');
    expect(GATE_HEAL_20.effects[0].kind).toBe('heal');
  });

  test('tradeoff gate has two effects', () => {
    expect(GATE_GLASS_CANNON.type).toBe('tradeoff');
    expect(GATE_GLASS_CANNON.effects.length).toBe(2);
  });

  test('refit gate has refit effect', () => {
    expect(GATE_REFIT_HEAVY.type).toBe('refit');
    expect(GATE_REFIT_HEAVY.effects[0].kind).toBe('refit');
  });

  test('forced pair has forced layout', () => {
    expect(PAIR_ATK_SPD.layout).toBe('forced');
  });

  test('optional pair has optional layout', () => {
    expect(PAIR_TRADEOFF_OPTIONAL.layout).toBe('optional');
  });
});
```

**Step 4: テスト実行**

Run: `npx jest --passWithNoTests`
Expected: All tests PASS

**Step 5: コミット**

```bash
git add __tests__/engine/AwakenedSystem.test.ts __tests__/game/stages.test.ts __tests__/game/gates.test.ts
git commit -m "test: Add tests for awakened system, stage data, and gate presets"
```

---

## Task 11: 品質チェック + 最終確認

**Files:** N/A (検証のみ)

**Step 1: Lint チェック**

Run: `npx expo lint`
Expected: PASS (warnings のみ許容、errors は修正)

**Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: テスト全通過**

Run: `npx jest --passWithNoTests`
Expected: All tests PASS

**Step 4: 問題があれば修正して再コミット**

---

## 実装サマリー

| Task | 内容 | レイヤー |
|------|------|---------|
| 1 | BulletEntity homing フラグ | L1: データ |
| 2 | ゲートプリセット | L1: データ |
| 3 | ステージ 2-5 データ | L1: データ |
| 4 | AwakenedSystem + ストア拡張 | L2: エンジン + L3: ストア |
| 5 | ShootingSystem 複数弾 | L2: エンジン |
| 6 | MovementSystem ホーミング | L2: エンジン |
| 7 | CollisionSystem 覚醒無敵 | L2: エンジン |
| 8 | ゲーム画面に AwakenedSystem 追加 | L5: 画面 |
| 9 | HUD 覚醒警告表示 | L4: UI |
| 10 | テスト | L6: テスト |
| 11 | 品質チェック | 最終検証 |
