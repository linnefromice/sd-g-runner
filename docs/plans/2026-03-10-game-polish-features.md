# Game Polish & Features Pack Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add haptics, audio wiring, visual key moment enhancements, boss visual differentiation, mini-bosses, achievement system, endless mode, quick restart, and gate visual improvements.

**Architecture:** Extends existing data-driven ECS architecture. New data types/constants added first, then engine systems extended, then rendering/UI updated last. All new features integrate via existing patterns (Zustand stores, SharedValue sync, entity pool).

**Tech Stack:** TypeScript, React Native (Expo), Zustand, @shopify/react-native-skia, expo-haptics, expo-av

---

## Task 1: Types & Constants — Mini-Boss Enemy Types

**Files:**
- Modify: `src/types/enemies.ts`
- Modify: `src/constants/balance.ts`
- Modify: `src/constants/colors.ts`
- Modify: `src/constants/dimensions.ts`

Add `sentinel` and `carrier` to `EnemyType` union. Add their stats, colors, and hitbox dimensions.

**Code:**

In `src/types/enemies.ts`, change the EnemyType line:
```typescript
export type EnemyType = 'stationary' | 'patrol' | 'rush' | 'swarm' | 'phalanx' | 'juggernaut' | 'dodger' | 'splitter' | 'summoner' | 'sentinel' | 'carrier';
```

In `src/constants/balance.ts`, add to `ENEMY_STATS`:
```typescript
sentinel: { hp: 120, attackDamage: 15, attackInterval: 2.0, scoreValue: 600, creditValue: 7 },
carrier: { hp: 100, attackDamage: 0, attackInterval: 0, scoreValue: 500, creditValue: 6 },
```

Add constants:
```typescript
export const SENTINEL_SHIELD_REDUCTION = 0.5;
export const CARRIER_SPAWN_INTERVAL = 5.0;
export const CARRIER_SPAWN_COUNT = 2;
```

In `src/constants/colors.ts`, add to `ENEMY_TYPE_COLORS`:
```typescript
sentinel: '#FF4466',
carrier: '#88CC44',
```

In `src/constants/dimensions.ts`, add hitboxes:
```typescript
sentinel: { width: 36, height: 36 },
carrier: { width: 34, height: 34 },
```

**Commit:** `feat: Add sentinel and carrier mini-boss types, stats, and constants`

---

## Task 2: Achievement Type Definitions

**Files:**
- Create: `src/types/achievements.ts`

**Code:**

```typescript
export type AchievementId =
  | 'first_clear'
  | 'boss_slayer'
  | 'all_forms'
  | 'all_stages'
  | 'no_damage_clear'
  | 'combo_master'
  | 'credit_hoarder'
  | 'speed_demon'
  | 'guardian_angel'
  | 'endless_survivor';

export interface AchievementDefinition {
  id: AchievementId;
  reward: number;
}
```

**Commit:** `feat: Add achievement type definitions`

---

## Task 3: Achievement Data Definitions

**Files:**
- Create: `src/game/achievements.ts`

**Code:**

```typescript
import type { AchievementId, AchievementDefinition } from '@/types/achievements';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first_clear', reward: 100 },
  { id: 'boss_slayer', reward: 300 },
  { id: 'all_forms', reward: 500 },
  { id: 'all_stages', reward: 1000 },
  { id: 'no_damage_clear', reward: 500 },
  { id: 'combo_master', reward: 200 },
  { id: 'credit_hoarder', reward: 300 },
  { id: 'speed_demon', reward: 200 },
  { id: 'guardian_angel', reward: 200 },
  { id: 'endless_survivor', reward: 500 },
];

export function getAchievement(id: AchievementId): AchievementDefinition {
  return ACHIEVEMENTS.find((a) => a.id === id)!;
}
```

**Commit:** `feat: Add achievement data definitions`

---

## Task 4: Audio Manager — Add New SE IDs

**Files:**
- Modify: `src/audio/AudioManager.ts`

Add `bossAppear` and `awaken` to `SoundId` union type.

**Code change:**

```typescript
type SoundId =
  | 'shoot'
  | 'enemyDestroy'
  | 'gatePass'
  | 'refit'
  | 'damage'
  | 'exBurst'
  | 'bossAppear'
  | 'awaken';
```

**Commit:** `feat: Add bossAppear and awaken sound IDs to AudioManager`

---

## Task 5: HapticsManager — Create Haptics Wrapper

**Files:**
- Create: `src/audio/HapticsManager.ts`

A thin wrapper around `expo-haptics` that checks the `hapticsEnabled` setting before firing. This lives alongside AudioManager since both are feedback systems.

**Code:**

```typescript
import * as Haptics from 'expo-haptics';
import { useSaveDataStore } from '@/stores/saveDataStore';

class HapticsManagerClass {
  private get enabled(): boolean {
    return useSaveDataStore.getState().settings.hapticsEnabled;
  }

  damage() {
    if (!this.enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  enemyDestroy() {
    if (!this.enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  gatePass() {
    if (!this.enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  exBurst() {
    if (!this.enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  awaken() {
    if (!this.enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  bossKill() {
    if (!this.enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export const HapticsManager = new HapticsManagerClass();
```

**Pre-requisite:** Install expo-haptics: `npx expo install expo-haptics`

**Commit:** `feat: Add HapticsManager with settings-aware haptic feedback`

---

## Task 6: SaveDataStore — Add achievements, endless records, haptics setting

**Files:**
- Modify: `src/stores/saveDataStore.ts`

Add to `SaveData` interface:
- `achievements: AchievementId[]`
- `endlessBestTime: number`
- `endlessBestScore: number`
- `settings.hapticsEnabled: boolean`

Add methods:
- `unlockAchievement(id: AchievementId): boolean` — returns false if already unlocked, otherwise adds to list, awards credits, saves
- `updateEndlessRecord(time: number, score: number): void`
- `setHapticsEnabled(enabled: boolean): void`

**Code changes in SaveData interface:**

```typescript
interface SaveData {
  // ... existing fields ...
  achievements: AchievementId[];
  endlessBestTime: number;
  endlessBestScore: number;
  settings: {
    bgmVolume: number;
    seVolume: number;
    locale: LocaleSetting;
    hapticsEnabled: boolean;
  };
}
```

Add to INITIAL_SAVE:
```typescript
achievements: [],
endlessBestTime: 0,
endlessBestScore: 0,
settings: { bgmVolume: 0.7, seVolume: 1.0, locale: 'system' as LocaleSetting, hapticsEnabled: true },
```

Add methods:
```typescript
unlockAchievement: (id) => {
  const s = get();
  if (s.achievements.includes(id)) return false;
  const achievement = getAchievement(id);
  set({ achievements: [...s.achievements, id], credits: s.credits + achievement.reward });
  get().save();
  return true;
},

updateEndlessRecord: (time, score) => {
  set((s) => ({
    endlessBestTime: Math.max(s.endlessBestTime, time),
    endlessBestScore: Math.max(s.endlessBestScore, score),
  }));
  get().save();
},

setHapticsEnabled: (enabled) => {
  set((s) => ({ settings: { ...s.settings, hapticsEnabled: enabled } }));
  get().save();
},
```

Don't forget to include `achievements`, `endlessBestTime`, `endlessBestScore` in the `save()` method's JSON serialization.

**Commit:** `feat: Extend saveDataStore with achievements, endless records, haptics setting`

---

## Task 7: GameSessionStore — Add bossEntrance and slowMotionFactor

**Files:**
- Modify: `src/stores/gameSessionStore.ts`

Add state fields:
```typescript
bossEntrance: boolean;      // true during boss entrance animation
slowMotionFactor: number;   // 1.0 = normal, 0.3 = slow-mo for awakening
```

Add actions:
```typescript
setBossEntrance: (value: boolean) => void;
setSlowMotionFactor: (factor: number) => void;
```

Add to INITIAL_STATE:
```typescript
bossEntrance: false,
slowMotionFactor: 1.0,
```

**Commit:** `feat: Add bossEntrance and slowMotionFactor to gameSessionStore`

---

## Task 8: i18n — All New Strings

**Files:**
- Modify: `src/i18n/locales/en.ts`
- Modify: `src/i18n/locales/ja.ts`

Add the following keys:

```typescript
// en.ts additions
enemies: {
  // ... existing ...
  sentinel: 'Sentinel',
  carrier: 'Carrier',
},
achievements: {
  title: 'ACHIEVEMENTS',
  first_clear: 'First Victory',
  first_clear_desc: 'Clear Stage 1',
  boss_slayer: 'Boss Slayer',
  boss_slayer_desc: 'Clear a boss stage',
  all_forms: 'Collector',
  all_forms_desc: 'Unlock all forms',
  all_stages: 'Conqueror',
  all_stages_desc: 'Clear all 15 stages',
  no_damage_clear: 'Untouchable',
  no_damage_clear_desc: 'Clear a stage without taking damage',
  combo_master: 'Awakener',
  combo_master_desc: 'Activate Awakened form',
  credit_hoarder: 'Investor',
  credit_hoarder_desc: 'Accumulate 5000 credits total',
  speed_demon: 'Speed Demon',
  speed_demon_desc: 'Earn a speed clear bonus',
  guardian_angel: 'Iron Wall',
  guardian_angel_desc: 'Clear a stage with SD_Guardian',
  endless_survivor: 'Survivor',
  endless_survivor_desc: 'Survive 5 minutes in Endless mode',
  locked: 'LOCKED',
  unlocked: 'UNLOCKED',
  reward: 'Reward',
},
settings: {
  // ... existing ...
  haptics: 'Haptics',
  hapticsOn: 'ON',
  hapticsOff: 'OFF',
},
stageSelect: {
  // ... existing ...
  endless: 'ENDLESS',
  endlessBest: 'Best',
  achievementsButton: 'ACHIEVE',
},
endless: {
  wave: 'WAVE',
  survivalTime: 'Survival Time',
},
```

```typescript
// ja.ts additions — same structure with Japanese values
enemies: {
  sentinel: 'センチネル',
  carrier: 'キャリアー',
},
achievements: {
  title: '実績',
  first_clear: '初勝利',
  first_clear_desc: 'ステージ1をクリア',
  boss_slayer: 'ボススレイヤー',
  boss_slayer_desc: 'ボスステージをクリア',
  all_forms: 'コレクター',
  all_forms_desc: '全フォームをアンロック',
  all_stages: '制覇者',
  all_stages_desc: '全15ステージをクリア',
  no_damage_clear: 'アンタッチャブル',
  no_damage_clear_desc: 'ノーダメージでクリア',
  combo_master: '覚醒者',
  combo_master_desc: '覚醒フォームを発動',
  credit_hoarder: '投資家',
  credit_hoarder_desc: '累計5000クレジットを獲得',
  speed_demon: 'スピードデーモン',
  speed_demon_desc: 'スピードクリアボーナスを獲得',
  guardian_angel: '鉄壁',
  guardian_angel_desc: 'SD_Guardianでクリア',
  endless_survivor: 'サバイバー',
  endless_survivor_desc: 'エンドレスモードで5分生存',
  locked: '未達成',
  unlocked: '達成済み',
  reward: '報酬',
},
settings: {
  haptics: 'ハプティクス',
  hapticsOn: 'ON',
  hapticsOff: 'OFF',
},
stageSelect: {
  endless: 'エンドレス',
  endlessBest: '最高記録',
  achievementsButton: '実績',
},
endless: {
  wave: 'ウェーブ',
  survivalTime: '生存時間',
},
```

**Commit:** `feat: Add i18n strings for achievements, endless, haptics, mini-bosses`

---

## Task 9: Enemy Factory & Hitboxes — sentinel and carrier

**Files:**
- Modify: `src/engine/entities/Enemy.ts`

Add sentinel and carrier hitbox mappings in `getEnemyHitbox()`, same pattern as existing types.

```typescript
case 'sentinel':
  return { width: 36, height: 36 };
case 'carrier':
  return { width: 34, height: 34 };
```

**Commit:** `feat: Add sentinel and carrier to enemy factory`

---

## Task 10: EnemyAISystem — sentinel and carrier AI

**Files:**
- Modify: `src/engine/systems/EnemyAISystem.ts`

Add movement and shooting patterns:

**sentinel (movement):**
```typescript
case 'sentinel': {
  // Static position — no movement, acts as turret with shield
  break;
}
```

**sentinel (shooting):**
```typescript
case 'sentinel': {
  // 3-direction spread: center + left 30° + right 30°
  const spreadAngle = Math.PI / 6;
  for (let i = -1; i <= 1; i++) {
    const angle = Math.PI / 2 + i * spreadAngle;
    const vx = Math.cos(angle) * baseSpeed;
    const vy = Math.sin(angle) * baseSpeed;
    const bullet = createEnemyBullet(fireX, fireY, stats.attackDamage, { speed: baseSpeed, vx, vy });
    acquireFromPool(entities.enemyBullets, bullet);
  }
  break;
}
```

**carrier (movement):**
```typescript
case 'carrier': {
  // Slow descent + horizontal patrol
  enemy.y += BASE_SCROLL_SPEED * 0.5 * dt;
  enemy.x += enemy.moveDirection * PATROL_SPEED * 0.6 * dt;
  if (enemy.x < 16 || enemy.x + enemy.width > 304) {
    enemy.moveDirection *= -1;
  }
  // Spawn patrol enemies periodically
  enemy.shootTimer += dt;
  if (enemy.shootTimer >= CARRIER_SPAWN_INTERVAL) {
    enemy.shootTimer = 0;
    for (let i = 0; i < CARRIER_SPAWN_COUNT; i++) {
      const spawnX = enemy.x + enemy.width / 2 + (i === 0 ? -25 : 25);
      const p = createEnemy('patrol', spawnX, enemy.y + enemy.height, 1.0);
      p.spawnTime = entities.stageTime;
      acquireFromPool(entities.enemies, p);
    }
  }
  break;
}
```

**Commit:** `feat: Add sentinel turret AI and carrier patrol-spawner AI`

---

## Task 11: CollisionSystem — Sentinel Shield + Audio/Haptics Wiring

**Files:**
- Modify: `src/engine/systems/CollisionSystem.ts`

**Changes:**

1. Add sentinel shield logic in `checkPlayerBulletsVsEnemies`: When bullet hits sentinel, damage is reduced by `SENTINEL_SHIELD_REDUCTION` (50%). Shield is permanent (no break mechanic).

```typescript
// Before applying damage to enemy
if (enemy.enemyType === 'sentinel') {
  enemy.hp -= bullet.damage * SENTINEL_SHIELD_REDUCTION;
} else {
  enemy.hp -= bullet.damage;
}
```

2. Add `AudioManager.playSe('damage')` and `HapticsManager.damage()` in `applyDamage()`.

3. Add `AudioManager.playSe('enemyDestroy')` and `HapticsManager.enemyDestroy()` in `applyEnemyKillReward` calls (or in the existing reward function file).

Import AudioManager and HapticsManager at top.

**Commit:** `feat: Add sentinel shield reduction, audio/haptics wiring to collision`

---

## Task 12: Audio/Haptics Wiring — Remaining Systems

**Files:**
- Modify: `src/engine/systems/ShootingSystem.ts` — Add `AudioManager.playSe('shoot')` when player fires
- Modify: `src/engine/systems/GateSystem.ts` — Add `AudioManager.playSe('gatePass')` on gate pass, `AudioManager.playSe('refit')` on refit gate, `HapticsManager.gatePass()`
- Modify: `src/engine/systems/BossSystem.ts` — Add `AudioManager.playSe('bossAppear')` on boss spawn
- Modify: `src/engine/systems/SpawnSystem.ts` — Add `useGameSessionStore.getState().setBossEntrance(true)` on boss_spawn event

For EX burst and awakening, wire in the relevant systems:
- Find where `activateEXBurst` is called → add `AudioManager.playSe('exBurst')` and `HapticsManager.exBurst()`
- Find where `activateAwakened` is called → add `AudioManager.playSe('awaken')` and `HapticsManager.awaken()`

BGM wiring:
- In `app/game/[stageId]/index.tsx` useEffect mount → `AudioManager.playBgm('stage')`, cleanup → `AudioManager.stopBgm()`
- In SpawnSystem boss_spawn → `AudioManager.playBgm('boss')` (replaces stage BGM)

**Commit:** `feat: Wire audio and haptics across all game systems`

---

## Task 13: Boss Visual Differentiation — New Shapes

**Files:**
- Modify: `src/rendering/shapes.ts`

Add two new boss shape functions:

```typescript
/** Octagon with 4 spike protrusions — Boss 2 (Omega Core) */
export function boss2Path(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  // Octagon with cardinal spikes
  return `M ${cx} ${y - h * 0.1} L ${x + w * 0.7} ${y + h * 0.15} L ${x + w + w * 0.1} ${cy} L ${x + w * 0.7} ${y + h * 0.85} L ${cx} ${y + h + h * 0.1} L ${x + w * 0.3} ${y + h * 0.85} L ${x - w * 0.1} ${cy} L ${x + w * 0.3} ${y + h * 0.15} Z`;
}

/** Diamond with inner ring motif — Boss 3 (Terminus Core) */
export function boss3Path(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  // Diamond with concave sides for menacing look
  return `M ${cx} ${y} L ${x + w * 0.75} ${y + h * 0.25} L ${x + w} ${cy} L ${x + w * 0.75} ${y + h * 0.75} L ${cx} ${y + h} L ${x + w * 0.25} ${y + h * 0.75} L ${x} ${cy} L ${x + w * 0.25} ${y + h * 0.25} Z`;
}
```

Update `getEntityPath` to support boss variants:
```typescript
case 'boss':
  return bossPath(x, y, w, h);
case 'boss_2':
  return boss2Path(x, y, w, h);
case 'boss_3':
  return boss3Path(x, y, w, h);
```

**Commit:** `feat: Add distinct boss shapes for Boss 2 (octagon) and Boss 3 (diamond)`

---

## Task 14: SyncRenderSystem — Boss Shape Selection + Boss Entrance Overlay

**Files:**
- Modify: `src/engine/systems/SyncRenderSystem.ts`

**Changes:**

1. When building boss render data, use `boss_2` or `boss_3` type string based on `boss.bossIndex`:
```typescript
const bossType = boss.bossIndex === 1 ? 'boss' : boss.bossIndex === 2 ? 'boss_2' : 'boss_3';
```

2. Add `bossEntranceOpacity` to the overlay state. This is driven by `gameSessionStore.bossEntrance`. When true, fade in a dark overlay (opacity 0→0.7 over 0.5s), hold for 1s, then fade out. Use a simple timer tracked in entities:
```typescript
// In overlay data
bossEntranceOpacity: number, // 0.0-0.7
```

The boss entrance timer logic should be in the SpawnSystem or a small dedicated system that ticks `entities.bossEntranceTimer` and sets store `setBossEntrance(false)` after 1.5s.

**Commit:** `feat: Select boss shape by bossIndex, add boss entrance overlay`

---

## Task 15: Visual Key Moments — Awakening Burst + Slow-Mo

**Files:**
- Modify: `src/engine/systems/ParticleSystem.ts` or `src/engine/effects.ts`
- Modify: `src/engine/GameLoop.ts` (or wherever deltaTime is computed)

**Awakening radial burst:**
Add a function `spawnRadialBurst(entities, x, y, count, color)` that creates `count` particles in a circle pattern with outward velocities. Call it from `activateAwakened` in gameSessionStore (via an effect function).

**Slow-motion:**
In the game loop where `deltaTime` is computed, multiply by `gameSessionStore.getState().slowMotionFactor`. The awakening system sets it to 0.3 for 300ms then resets to 1.0.

```typescript
// In GameLoop deltaTime calculation
const rawDelta = Math.min(now - lastTime, 33);
const delta = rawDelta * useGameSessionStore.getState().slowMotionFactor;
```

**Commit:** `feat: Add awakening radial particle burst and slow-motion effect`

---

## Task 16: Visual Key Moments — EX Burst Shockwave + Screen Shake

**Files:**
- Modify: `src/engine/effects.ts` (or wherever EX burst visual effects are triggered)

When EX burst activates:
1. Set `entities.shockwaveTimer = SHOCKWAVE_EFFECT_DURATION` (reuse existing shockwave visual)
2. Set `entities.shakeIntensity = 4` and `entities.shakeTimer = 300` (screen shake for 300ms)

These should be triggered from wherever `activateEXBurst` is called or from an EX system update.

**Commit:** `feat: Add shockwave and screen shake on EX burst activation`

---

## Task 17: Gate Visual Enhancement — Forced Gate Markers

**Files:**
- Modify: `src/engine/systems/SyncRenderSystem.ts`

When syncing gate render data, add a `forced` boolean field to the render entity data. In `GameCanvas.tsx`, when `forced` is true, render additional pulsing arrow indicators (small triangle shapes above and below the gate).

The visual can be simple: a small downward-pointing triangle at the top-center of each forced gate, with opacity oscillating via sine wave.

**Commit:** `feat: Add pulsing arrow markers for forced gates`

---

## Task 18: Endless Mode — Wave Generator

**Files:**
- Create: `src/game/stages/endless.ts`

```typescript
import type { StageEvent } from '@/types/stages';

const ENEMY_TYPES_POOL: EnemyType[] = [
  'stationary', 'patrol', 'rush', 'swarm', 'phalanx',
  'juggernaut', 'dodger', 'splitter', 'summoner', 'sentinel', 'carrier',
];

const GATE_PAIRS_POOL = [/* list of GatePairConfig from existing gate definitions */];

export function generateEndlessWave(waveNumber: number): StageEvent[] {
  const events: StageEvent[] = [];
  const baseTime = waveNumber * 30;
  const enemyCount = Math.min(8, 3 + Math.floor(waveNumber / 2));

  for (let i = 0; i < enemyCount; i++) {
    const typeIndex = Math.floor(Math.random() * Math.min(ENEMY_TYPES_POOL.length, 3 + waveNumber));
    events.push({
      time: baseTime + i * 3,
      type: 'enemy_spawn',
      enemyType: ENEMY_TYPES_POOL[typeIndex % ENEMY_TYPES_POOL.length],
      x: 40 + Math.random() * 240,
    });
  }

  // Gate every 2 waves
  if (waveNumber % 2 === 1) {
    const pairIndex = Math.floor(Math.random() * GATE_PAIRS_POOL.length);
    events.push({
      time: baseTime + 15,
      type: 'gate_spawn',
      gateConfig: GATE_PAIRS_POOL[pairIndex],
    });
  }

  return events;
}

export function getEndlessDifficulty(elapsedTime: number) {
  const minute = elapsedTime / 60;
  return {
    scrollSpeedMultiplier: 1.0 + minute * 0.1,
    enemySpawnInterval: Math.max(0.8, 2.5 - minute * 0.2),
    enemyHpMultiplier: 1.0 + minute * 0.3,
    enemyAtkMultiplier: 1.0 + minute * 0.15,
    maxConcurrentEnemies: Math.min(20, 6 + Math.floor(minute * 2)),
    bulletSpeedMultiplier: 1.0 + minute * 0.1,
    attackIntervalMultiplier: Math.max(0.5, 1.0 - minute * 0.08),
  };
}
```

**Commit:** `feat: Add endless mode wave generator with scaling difficulty`

---

## Task 19: SpawnSystem — Endless Mode Support

**Files:**
- Modify: `src/engine/systems/SpawnSystem.ts`

Add an overload or variant `createEndlessSpawnSystem()` that uses `generateEndlessWave` instead of a fixed timeline. Every 30s it generates a new wave and appends events. It also handles boss entrance animation timer.

The key difference: instead of reading from `stage.timeline`, it dynamically generates waves:

```typescript
export function createEndlessSpawnSystem(): GameSystem<GameEntities> {
  let currentWave = 0;
  let timeline: StageEvent[] = generateEndlessWave(0);

  return (entities) => {
    // Generate next wave when approaching end
    while (entities.stageTime >= (currentWave + 1) * 30) {
      currentWave++;
      timeline = [...timeline, ...generateEndlessWave(currentWave)];
    }

    // Same dispatch logic as normal SpawnSystem
    while (entities.timelineIndex < timeline.length && timeline[entities.timelineIndex].time <= entities.stageTime) {
      // ... dispatch events (copy pattern from existing SpawnSystem)
    }
  };
}
```

**Commit:** `feat: Add endless mode spawn system with procedural wave generation`

---

## Task 20: Stage Registry — Register Endless Mode

**Files:**
- Modify: `src/game/stages/index.ts`

Add an endless mode "stage" with a special id (e.g., 99 or 0). It needs:
- `id: 99`
- `name: 'Endless'`
- `duration: Infinity` (never time-completes)
- `isBossStage: false`
- `isEndless: true` (new field)
- `timeline: []` (empty, generated dynamically)

Also add `isEndless?: boolean` to `StageDefinition` type in `src/types/stages.ts`.

**Commit:** `feat: Register endless mode in stage registry`

---

## Task 21: Mini-Boss Stage Timeline Updates

**Files:**
- Modify: `src/game/stages/stage8.ts`
- Modify: `src/game/stages/stage9.ts`
- Modify: `src/game/stages/stage12.ts`
- Modify: `src/game/stages/stage14.ts`

Add sentinel and carrier spawns at appropriate times:
- Stage 8: sentinel at t=50 (first mini-boss encounter)
- Stage 9: carrier at t=45
- Stage 12: sentinel at t=60 (alongside splitters)
- Stage 14: carrier at t=40, sentinel at t=80 (chaos corridor — high density)

Pattern: `{ time: T, type: 'enemy_spawn', enemyType: 'sentinel', x: 160 }`

**Commit:** `feat: Add mini-boss spawns to stages 8, 9, 12, 14`

---

## Task 22: Settings Screen — Haptics Toggle

**Files:**
- Modify: `app/settings.tsx`

Add a haptics ON/OFF toggle section between the SE volume and Language sections. Use the same styling pattern as existing settings:

```tsx
<View style={styles.section}>
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionLabel}>{t.settings.haptics}</Text>
  </View>
  <View style={styles.steps}>
    <TouchableOpacity
      style={[styles.step, hapticsEnabled && styles.stepActive]}
      onPress={() => useSaveDataStore.getState().setHapticsEnabled(true)}
    >
      <Text style={[styles.stepText, hapticsEnabled && styles.stepTextActive]}>
        {t.settings.hapticsOn}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.step, !hapticsEnabled && styles.stepActive]}
      onPress={() => useSaveDataStore.getState().setHapticsEnabled(false)}
    >
      <Text style={[styles.stepText, !hapticsEnabled && styles.stepTextActive]}>
        {t.settings.hapticsOff}
      </Text>
    </TouchableOpacity>
  </View>
</View>
```

**Commit:** `feat: Add haptics toggle to settings screen`

---

## Task 23: Achievements Screen

**Files:**
- Create: `app/achievements.tsx`

A new screen showing all 10 achievements in a scrollable list. Each achievement card shows:
- Achievement name (from i18n)
- Description (hint for how to unlock)
- Status: locked (gray) or unlocked (blue/gold glow)
- Reward amount

Use the same Sci-Fi styling as other screens (CornerBrackets, neon accents, dark background).

Add a route link from the stage select footer.

**Commit:** `feat: Add achievements screen with Sci-Fi styling`

---

## Task 24: Stage Select — Endless Mode Card + Achievements Button

**Files:**
- Modify: `app/stages/index.tsx`

1. Add an "ENDLESS" card at the bottom of the stage list. Show only if all 15 stages are unlocked. Use a distinct color (e.g., neon green or purple) to differentiate from normal stages. Show best time/score if available.

2. Add an "ACHIEVE" button in the footer next to UPGRADE and BACK.

```tsx
// Endless card (after stageIds.map)
{allStagesUnlocked && (
  <TouchableOpacity
    style={[styles.stageCard, styles.stageCardEndless]}
    onPress={() => router.push('/stages/99/select-form')}
  >
    {/* Endless card content */}
  </TouchableOpacity>
)}
```

**Commit:** `feat: Add endless mode card and achievements button to stage select`

---

## Task 25: Result Screen — Achievement Checks + Quick Restart

**Files:**
- Modify: `app/game/[stageId]/result.tsx`

1. **Achievement checking:** After saving score/credits, run achievement checks:
```typescript
const save = useSaveDataStore.getState();
// first_clear: if stageId === 1 && isStageClear
// boss_slayer: if stage.isBossStage && isStageClear
// no_damage_clear: if damageTaken === 0 && isStageClear
// combo_master: if awakenedCount > 0
// speed_demon: if speedClearBonus active
// guardian_angel: if currentForm was SD_Guardian && isStageClear
// all_stages: if save.unlockedStages includes all 15
// all_forms: if save.unlockedForms.length >= 6 (all non-awakened)
// credit_hoarder: if save.credits >= 5000
```

Call `save.unlockAchievement(id)` for each met condition.

2. **Quick restart:** Add `onLongPress` to the Replay button that navigates directly back to the game screen with the same form (skip form selection).

**Commit:** `feat: Add achievement checks to result screen, quick restart on long press`

---

## Task 26: Endless Mode Game Integration

**Files:**
- Modify: `app/game/[stageId]/index.tsx`

When `stageId === 99` (endless mode):
- Use `createEndlessSpawnSystem()` instead of `createSpawnSystem(stage)`
- Use `getEndlessDifficulty(entities.stageTime)` for difficulty params (update periodically)
- GameOverSystem: never trigger stage clear by time, only game over on death
- On game over: save endless record via `updateEndlessRecord(stageTime, score)`
- Check `endless_survivor` achievement (stageTime >= 300)

**Commit:** `feat: Integrate endless mode into game screen`

---

## Task 27: Quality Checks + Commit

Run all quality checks:
```bash
npx tsc --noEmit
npx expo lint
npx jest --passWithNoTests
```

Fix any type errors or lint issues. Update tests as needed (especially saveData tests for new fields).

**Commit:** `fix: Resolve type errors and update tests for new features`

---

## Summary

| Task | Category | Description |
|------|----------|-------------|
| 1 | Types/Constants | Mini-boss enemy types + stats |
| 2 | Types | Achievement type definitions |
| 3 | Data | Achievement data definitions |
| 4 | Audio | New SE IDs in AudioManager |
| 5 | Audio | HapticsManager + expo-haptics install |
| 6 | Store | SaveDataStore extensions |
| 7 | Store | GameSessionStore extensions |
| 8 | i18n | All new strings (EN/JA) |
| 9 | Engine | Enemy factory — sentinel/carrier |
| 10 | Engine | EnemyAI — sentinel/carrier patterns |
| 11 | Engine | CollisionSystem — shield + audio/haptics |
| 12 | Engine | Audio/haptics wiring across systems |
| 13 | Rendering | Boss 2/3 shapes |
| 14 | Rendering | SyncRenderSystem boss selection + entrance overlay |
| 15 | Engine | Awakening burst + slow-mo |
| 16 | Engine | EX burst shockwave + screen shake |
| 17 | Rendering | Gate forced markers |
| 18 | Data | Endless wave generator |
| 19 | Engine | Endless spawn system |
| 20 | Data | Stage registry — endless mode |
| 21 | Data | Mini-boss stage timeline updates |
| 22 | UI | Settings — haptics toggle |
| 23 | UI | Achievements screen |
| 24 | UI | Stage select — endless card + achievements button |
| 25 | UI | Result screen — achievement checks + quick restart |
| 26 | UI | Endless mode game integration |
| 27 | Quality | Type check + lint + tests |
