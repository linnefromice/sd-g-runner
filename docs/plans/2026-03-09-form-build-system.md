# フォーム特化ビルドシステム + グレイズ段階報酬 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** フォーム経験値による二択分岐ビルドと、距離ベースのグレイズ段階報酬を実装し、プレイヤーの戦略的判断を増やす。

**Architecture:** gameSessionStore にフォーム XP 状態を追加し、既存の CollisionSystem のグレイズ判定を3段階に拡張する。FormXPSystem を新規作成してXP蓄積・レベルアップを管理し、ShootingSystem/MovementSystem でスキル効果を適用する。HUD に XP ゲージとスキル選択 UI を追加する。

**Tech Stack:** TypeScript, Zustand, React Native, @shopify/react-native-skia, react-native-reanimated

---

## CP1: データ定義とストア拡張（4タスク）

### Task 1-1: フォームスキル定義の型

**Files:**
- Create: `src/types/formSkills.ts`

**実装:**

```typescript
import type { MechaFormId } from './forms';

export type FormSkillStatType =
  | 'bulletSpeed'
  | 'bulletSize'
  | 'fireRate'
  | 'damage'
  | 'moveSpeed'
  | 'aoeRadius';

export type FormSkillPassiveId =
  | 'pierce'
  | 'double_shot'
  | 'slow_on_hit'
  | 'double_explosion'
  | 'afterimage'
  | 'speed_atk_bonus'
  | 'auto_charge'
  | 'xp_on_crit'
  | 'omnidirectional'
  | 'heal_on_hit'
  | 'armor'
  | 'graze_expand'
  | 'critical_chance';

export type FormSkillEffect =
  | { type: 'stat_multiply'; stat: FormSkillStatType; value: number }
  | { type: 'stat_add'; stat: 'bulletCount' | 'pierceCount'; value: number }
  | { type: 'passive'; id: FormSkillPassiveId };

export interface FormSkillOption {
  label: string;
  effect: FormSkillEffect;
}

export interface FormSkillLevel {
  formId: MechaFormId;
  level: number;
  choiceA: FormSkillOption;
  choiceB: FormSkillOption;
}

export interface FormSkillChoice {
  level: number;
  choice: 'A' | 'B';
}

export interface FormXPState {
  xp: number;
  level: number; // 0, 1, 2, 3
  skills: FormSkillChoice[];
}
```

**検証:** `npx tsc --noEmit`

### Task 1-2: フォームスキルデータ定義

**Files:**
- Create: `src/game/formSkills.ts`

**実装:**

```typescript
import type { FormSkillLevel } from '@/types/formSkills';

export const FORM_SKILL_TREE: FormSkillLevel[] = [
  // === SD_Standard ===
  {
    formId: 'SD_Standard', level: 1,
    choiceA: { label: 'Bullet Speed +20%', effect: { type: 'stat_multiply', stat: 'bulletSpeed', value: 1.2 } },
    choiceB: { label: 'Bullet Size +30%', effect: { type: 'stat_multiply', stat: 'bulletSize', value: 1.3 } },
  },
  {
    formId: 'SD_Standard', level: 2,
    choiceA: { label: 'Fire Rate +15%', effect: { type: 'stat_multiply', stat: 'fireRate', value: 1.15 } },
    choiceB: { label: 'Damage +20%', effect: { type: 'stat_multiply', stat: 'damage', value: 1.2 } },
  },
  {
    formId: 'SD_Standard', level: 3,
    choiceA: { label: 'Double Shot', effect: { type: 'passive', id: 'double_shot' } },
    choiceB: { label: 'Pierce', effect: { type: 'passive', id: 'pierce' } },
  },

  // === SD_HeavyArtillery ===
  {
    formId: 'SD_HeavyArtillery', level: 1,
    choiceA: { label: 'AoE Range +40%', effect: { type: 'stat_multiply', stat: 'aoeRadius', value: 1.4 } },
    choiceB: { label: 'Explosion DMG +30%', effect: { type: 'stat_multiply', stat: 'damage', value: 1.3 } },
  },
  {
    formId: 'SD_HeavyArtillery', level: 2,
    choiceA: { label: 'Armor (-20% DMG taken)', effect: { type: 'passive', id: 'armor' } },
    choiceB: { label: 'Bullet Speed +25%', effect: { type: 'stat_multiply', stat: 'bulletSpeed', value: 1.25 } },
  },
  {
    formId: 'SD_HeavyArtillery', level: 3,
    choiceA: { label: 'Slow on Hit', effect: { type: 'passive', id: 'slow_on_hit' } },
    choiceB: { label: 'Double Explosion', effect: { type: 'passive', id: 'double_explosion' } },
  },

  // === SD_HighSpeed ===
  {
    formId: 'SD_HighSpeed', level: 1,
    choiceA: { label: 'Move Speed +20%', effect: { type: 'stat_multiply', stat: 'moveSpeed', value: 1.2 } },
    choiceB: { label: 'Graze Range +', effect: { type: 'passive', id: 'graze_expand' } },
  },
  {
    formId: 'SD_HighSpeed', level: 2,
    choiceA: { label: 'Pierce +1', effect: { type: 'stat_add', stat: 'pierceCount', value: 1 } },
    choiceB: { label: 'Fire Rate +20%', effect: { type: 'stat_multiply', stat: 'fireRate', value: 1.2 } },
  },
  {
    formId: 'SD_HighSpeed', level: 3,
    choiceA: { label: 'Afterimage Shots', effect: { type: 'passive', id: 'afterimage' } },
    choiceB: { label: 'Speed ATK Bonus', effect: { type: 'passive', id: 'speed_atk_bonus' } },
  },

  // === SD_Sniper ===
  {
    formId: 'SD_Sniper', level: 1,
    choiceA: { label: 'Bullet Speed +30%', effect: { type: 'stat_multiply', stat: 'bulletSpeed', value: 1.3 } },
    choiceB: { label: 'Critical 15%', effect: { type: 'passive', id: 'critical_chance' } },
  },
  {
    formId: 'SD_Sniper', level: 2,
    choiceA: { label: 'Double Shot', effect: { type: 'passive', id: 'double_shot' } },
    choiceB: { label: 'Pierce + Shield Ignore', effect: { type: 'passive', id: 'pierce' } },
  },
  {
    formId: 'SD_Sniper', level: 3,
    choiceA: { label: 'Auto Charge', effect: { type: 'passive', id: 'auto_charge' } },
    choiceB: { label: 'XP on Crit ×2', effect: { type: 'passive', id: 'xp_on_crit' } },
  },

  // === SD_Scatter ===
  {
    formId: 'SD_Scatter', level: 1,
    choiceA: { label: 'Bullet Count +2', effect: { type: 'stat_add', stat: 'bulletCount', value: 2 } },
    choiceB: { label: 'Tighter Spread', effect: { type: 'stat_multiply', stat: 'bulletSize', value: 1.3 } },
  },
  {
    formId: 'SD_Scatter', level: 2,
    choiceA: { label: 'Close Range +40%', effect: { type: 'stat_multiply', stat: 'damage', value: 1.4 } },
    choiceB: { label: 'Weak Homing', effect: { type: 'passive', id: 'heal_on_hit' } },
  },
  {
    formId: 'SD_Scatter', level: 3,
    choiceA: { label: 'Omnidirectional', effect: { type: 'passive', id: 'omnidirectional' } },
    choiceB: { label: 'Heal on Hit', effect: { type: 'passive', id: 'heal_on_hit' } },
  },
];

/** Get skill tree for a specific form */
export function getFormSkillTree(formId: string): FormSkillLevel[] {
  return FORM_SKILL_TREE.filter(s => s.formId === formId);
}

/** Get skill definition for a specific form and level */
export function getFormSkillLevel(formId: string, level: number): FormSkillLevel | undefined {
  return FORM_SKILL_TREE.find(s => s.formId === formId && s.level === level);
}
```

**検証:** `npx tsc --noEmit`

### Task 1-3: グレイズ段階定数とXP定数

**Files:**
- Modify: `src/constants/balance.ts`

**追加する定数:**

```typescript
// --- Graze tiers ---
export const GRAZE_CLOSE_EXPAND = 4;     // px expansion for close tier
export const GRAZE_EXTREME_EXPAND = 1;   // px expansion for extreme tier

export const GRAZE_CLOSE_EX_GAIN = 6;
export const GRAZE_CLOSE_TF_GAIN = 4;
export const GRAZE_CLOSE_SCORE = 50;

export const GRAZE_EXTREME_EX_GAIN = 12;
export const GRAZE_EXTREME_TF_GAIN = 8;
export const GRAZE_EXTREME_SCORE = 150;

// --- Form XP ---
export const FORM_XP_ENEMY_KILL = 5;
export const FORM_XP_STRONG_ENEMY_KILL = 10;
export const FORM_XP_BOSS_HIT = 2;
export const FORM_XP_GRAZE = 3;
export const FORM_XP_GRAZE_CLOSE = 6;
export const FORM_XP_GRAZE_EXTREME = 15;
export const FORM_XP_GATE_ENHANCE = 8;

export const FORM_XP_LV1 = 50;
export const FORM_XP_LV2 = 150;
export const FORM_XP_LV3 = 300;

export const FORM_XP_THRESHOLDS = [FORM_XP_LV1, FORM_XP_LV2, FORM_XP_LV3];

// --- Skill choice slow-mo ---
export const SKILL_CHOICE_SLOW_FACTOR = 0.3;
export const SKILL_CHOICE_TIMEOUT = 5000;  // auto-dismiss after 5s if no choice
```

**検証:** `npx tsc --noEmit`

### Task 1-4: gameSessionStore にフォームXP状態を追加

**Files:**
- Modify: `src/stores/gameSessionStore.ts`

**追加するフィールド（state interface）:**

```typescript
// Form XP build system
formXP: Record<string, FormXPState>;
pendingSkillChoice: { formId: MechaFormId; level: number } | null;
```

**追加するアクション:**

```typescript
addFormXP: (formId: MechaFormId, amount: number) => void;
selectFormSkill: (formId: MechaFormId, level: number, choice: 'A' | 'B') => void;
dismissSkillChoice: () => void;
```

**resetSession で初期化:**

```typescript
formXP: {
  SD_Standard: { xp: 0, level: 0, skills: [] },
  SD_HeavyArtillery: { xp: 0, level: 0, skills: [] },
  SD_HighSpeed: { xp: 0, level: 0, skills: [] },
  SD_Sniper: { xp: 0, level: 0, skills: [] },
  SD_Scatter: { xp: 0, level: 0, skills: [] },
},
pendingSkillChoice: null,
```

**addFormXP ロジック:**

```typescript
addFormXP: (formId, amount) => set(s => {
  const state = s.formXP[formId];
  if (!state || state.level >= 3) return {};
  const newXP = state.xp + amount;
  const threshold = FORM_XP_THRESHOLDS[state.level];
  if (newXP >= threshold && !s.pendingSkillChoice) {
    return {
      formXP: {
        ...s.formXP,
        [formId]: { ...state, xp: newXP },
      },
      pendingSkillChoice: { formId, level: state.level + 1 },
    };
  }
  return {
    formXP: {
      ...s.formXP,
      [formId]: { ...state, xp: newXP },
    },
  };
}),
```

**selectFormSkill ロジック:**

```typescript
selectFormSkill: (formId, level, choice) => set(s => {
  const state = s.formXP[formId];
  if (!state) return {};
  return {
    formXP: {
      ...s.formXP,
      [formId]: {
        ...state,
        level,
        skills: [...state.skills, { level, choice }],
      },
    },
    pendingSkillChoice: null,
  };
}),
```

**検証:** `npx tsc --noEmit && npx jest --passWithNoTests`

---

## CP2: グレイズ段階判定（2タスク）

### Task 2-1: グレイズ段階判定の実装

**Files:**
- Modify: `src/engine/systems/CollisionSystem.ts` — `checkGraze` 関数 (lines 174-196)
- Modify: `src/engine/collision.ts` — `expandHitbox` ヘルパー追加

**collision.ts に追加:**

```typescript
export function expandHitbox(
  hb: { x: number; y: number; width: number; height: number },
  px: number,
): { x: number; y: number; width: number; height: number } {
  return {
    x: hb.x - px,
    y: hb.y - px,
    width: hb.width + px * 2,
    height: hb.height + px * 2,
  };
}
```

**checkGraze を3段階に拡張:**

```typescript
function checkGraze(
  entities: GameEntities,
  player: GameEntities['player'],
  playerHB: ReturnType<typeof getPlayerHitbox>,
  store: Store,
) {
  if (player.isInvincible || store.isAwakened) return;

  const playerVisualHB = getPlayerVisualHitbox(player);
  const closeHB = expandHitbox(playerHB, GRAZE_CLOSE_EXPAND);
  const extremeHB = expandHitbox(playerHB, GRAZE_EXTREME_EXPAND);

  for (const bullet of entities.enemyBullets) {
    if (!bullet.active || bullet.grazed) continue;
    const overlapVisual = checkAABBOverlap(playerVisualHB, bullet);
    const overlapActual = checkAABBOverlap(playerHB, bullet);
    if (overlapVisual && !overlapActual) {
      bullet.grazed = true;

      // Determine tier: extreme > close > normal
      const overlapExtreme = checkAABBOverlap(extremeHB, bullet);
      const overlapClose = checkAABBOverlap(closeHB, bullet);

      let score: number;
      let exGain: number;
      let tfGain: number;
      let xpGain: number;

      if (overlapExtreme) {
        score = GRAZE_EXTREME_SCORE;
        exGain = GRAZE_EXTREME_EX_GAIN;
        tfGain = GRAZE_EXTREME_TF_GAIN;
        xpGain = FORM_XP_GRAZE_EXTREME;
      } else if (overlapClose) {
        score = GRAZE_CLOSE_SCORE;
        exGain = GRAZE_CLOSE_EX_GAIN;
        tfGain = GRAZE_CLOSE_TF_GAIN;
        xpGain = FORM_XP_GRAZE_CLOSE;
      } else {
        score = GRAZE_SCORE;
        exGain = GRAZE_EX_GAIN;
        tfGain = GRAZE_TF_GAIN;
        xpGain = FORM_XP_GRAZE;
      }

      store.addScore(score);
      if (!store.isEXBurstActive) store.addExGauge(exGain);
      store.addTransformGauge(tfGain);
      store.addFormXP(store.currentForm, xpGain);

      const bc = getCenter(bullet);
      onGraze(entities, bc.x, bc.y);
    }
  }
}
```

**必要な import 追加:**

```typescript
import { GRAZE_CLOSE_EXPAND, GRAZE_EXTREME_EXPAND, GRAZE_CLOSE_SCORE, GRAZE_CLOSE_EX_GAIN, GRAZE_CLOSE_TF_GAIN, GRAZE_EXTREME_SCORE, GRAZE_EXTREME_EX_GAIN, GRAZE_EXTREME_TF_GAIN, FORM_XP_GRAZE, FORM_XP_GRAZE_CLOSE, FORM_XP_GRAZE_EXTREME } from '@/constants/balance';
import { expandHitbox } from '@/engine/collision';
```

**検証:** `npx tsc --noEmit && npx jest --passWithNoTests`

### Task 2-2: 敵撃破・ゲート通過時のXP付与

**Files:**
- Modify: `src/engine/systems/enemyKillReward.ts` — `store.addFormXP` 呼び出し追加
- Modify: `src/engine/systems/GateSystem.ts` — enhance ゲート通過時に XP 付与

**enemyKillReward.ts:**

撃破報酬関数内に追加:

```typescript
// 既存の報酬処理の後に追加
const xp = (enemy.enemyType === 'phalanx' || enemy.enemyType === 'juggernaut')
  ? FORM_XP_STRONG_ENEMY_KILL
  : FORM_XP_ENEMY_KILL;
store.addFormXP(store.currentForm, xp);
```

**GateSystem.ts:**

enhance ゲート通過時の combo 処理付近に追加:

```typescript
// combo increment の後に追加
if (g.gateType === 'enhance' || g.gateType === 'growth' || g.gateType === 'roulette') {
  store.addFormXP(store.currentForm, FORM_XP_GATE_ENHANCE);
}
```

**検証:** `npx tsc --noEmit && npx jest --passWithNoTests`

---

## CP3: スキル効果の適用（3タスク）

### Task 3-1: スキル効果のリゾルバ関数

**Files:**
- Create: `src/engine/formSkillResolver.ts`

**実装:**

```typescript
import type { MechaFormId, MechaFormDefinition } from '@/types/forms';
import type { FormSkillChoice, FormSkillPassiveId } from '@/types/formSkills';
import { getFormSkillLevel } from '@/game/formSkills';

export interface ResolvedFormStats {
  bulletSpeedMul: number;
  bulletSizeMul: number;
  fireRateMul: number;
  damageMul: number;
  moveSpeedMul: number;
  aoeRadiusMul: number;
  bulletCountAdd: number;
  pierceCountAdd: number;
  passives: Set<FormSkillPassiveId>;
}

export function resolveFormSkills(formId: MechaFormId, skills: FormSkillChoice[]): ResolvedFormStats {
  const result: ResolvedFormStats = {
    bulletSpeedMul: 1,
    bulletSizeMul: 1,
    fireRateMul: 1,
    damageMul: 1,
    moveSpeedMul: 1,
    aoeRadiusMul: 1,
    bulletCountAdd: 0,
    pierceCountAdd: 0,
    passives: new Set(),
  };

  for (const skill of skills) {
    const def = getFormSkillLevel(formId, skill.level);
    if (!def) continue;
    const option = skill.choice === 'A' ? def.choiceA : def.choiceB;
    const effect = option.effect;

    switch (effect.type) {
      case 'stat_multiply':
        switch (effect.stat) {
          case 'bulletSpeed': result.bulletSpeedMul *= effect.value; break;
          case 'bulletSize': result.bulletSizeMul *= effect.value; break;
          case 'fireRate': result.fireRateMul *= effect.value; break;
          case 'damage': result.damageMul *= effect.value; break;
          case 'moveSpeed': result.moveSpeedMul *= effect.value; break;
          case 'aoeRadius': result.aoeRadiusMul *= effect.value; break;
        }
        break;
      case 'stat_add':
        switch (effect.stat) {
          case 'bulletCount': result.bulletCountAdd += effect.value; break;
          case 'pierceCount': result.pierceCountAdd += effect.value; break;
        }
        break;
      case 'passive':
        result.passives.add(effect.id);
        break;
    }
  }

  return result;
}
```

**検証:** `npx tsc --noEmit`

### Task 3-2: ShootingSystem にスキル効果を適用

**Files:**
- Modify: `src/engine/systems/ShootingSystem.ts`

**変更内容:**

`createShootingSystem` の引数に `getSkills` コールバックを追加:

```typescript
import { resolveFormSkills, type ResolvedFormStats } from '@/engine/formSkillResolver';
import { useGameSessionStore } from '@/stores/gameSessionStore';

export function createShootingSystem(getForm: () => MechaFormDefinition): GameSystem<GameEntities> {
  let fireTimer = 0;

  return (entities, { time }) => {
    const form = getForm();
    const store = useGameSessionStore.getState();
    const formXPState = store.formXP[store.currentForm];
    const skills = formXPState ? resolveFormSkills(store.currentForm, formXPState.skills) : null;

    const fireRateMul = skills ? skills.fireRateMul : 1;
    const interval = BASE_FIRE_INTERVAL / (form.fireRateMultiplier * fireRateMul);

    fireTimer += time.delta;
    if (fireTimer < interval) return;
    fireTimer -= interval;

    const p = entities.player;
    if (!p.active) return;

    const bulletConfig = form.bulletConfig;
    const damageMul = skills ? skills.damageMul : 1;
    const damage = 10 * form.attackMultiplier * damageMul;
    const isHoming = form.specialAbility === 'homing_invincible';
    const specialAbility = form.specialAbility;
    const bulletSpeedMul = skills ? skills.bulletSpeedMul : 1;
    const bulletSizeMul = skills ? skills.bulletSizeMul : 1;
    const count = bulletConfig.count + (skills ? skills.bulletCountAdd : 0);
    const centerX = p.x + p.width / 2;

    const bw = bulletConfig.width * bulletSizeMul;
    const bh = bulletConfig.height * bulletSizeMul;
    const bSpeed = bulletConfig.speed * bulletSpeedMul;

    if (count <= 1) {
      const bullet = createPlayerBullet(centerX, p.y, damage, {
        width: bw, height: bh, speed: bSpeed,
        homing: isHoming, specialAbility,
      });
      acquireFromPool(entities.playerBullets, bullet);
    } else {
      const halfSpread = ((count - 1) * SPREAD_ANGLE) / 2;
      for (let i = 0; i < count; i++) {
        const angleDeg = -halfSpread + i * SPREAD_ANGLE;
        const offsetX = Math.tan((angleDeg * Math.PI) / 180) * 20;
        const bullet = createPlayerBullet(centerX + offsetX, p.y, damage, {
          width: bw, height: bh, speed: bSpeed,
          homing: isHoming, specialAbility,
        });
        if (!acquireFromPool(entities.playerBullets, bullet)) break;
      }
    }
  };
}
```

**検証:** `npx tsc --noEmit && npx jest --passWithNoTests`

### Task 3-3: MovementSystem にスキル効果を適用

**Files:**
- Modify: `src/engine/systems/MovementSystem.ts`

**変更内容:**

プレイヤー移動速度の計算時にスキルの `moveSpeedMul` を適用。
既存の `PLAYER_MOVE_SPEED * form.moveSpeedMultiplier` に `* skills.moveSpeedMul` を掛ける。

`useGameSessionStore.getState()` から `currentForm` と `formXP` を取得し、`resolveFormSkills()` を呼ぶ。

**検証:** `npx tsc --noEmit && npx jest --passWithNoTests`

---

## CP4: HUD 表示（3タスク）

### Task 4-1: XP ゲージバー コンポーネント

**Files:**
- Create: `src/ui/FormXPBar.tsx`

**実装:**

フォーム名短縮表記 + XP進捗バー + 取得済みスキル数のドット表示。
Zustand セレクタで `formXP[currentForm]` を購読。
`FORM_XP_THRESHOLDS` で次のレベルまでの進捗を計算。
色は `FORM_DEFINITIONS[currentForm].spriteConfig.bodyColor` を使用。

**コンポーネント構成:**

```
[STD] ████████░░░░ Lv1 ●●○
```

- 左: フォーム短縮名（3文字）
- 中: XP進捗バー
- 右: Lv + 取得スキル数（●=取得、○=未取得）

**検証:** `npx tsc --noEmit`

### Task 4-2: スキル選択オーバーレイ

**Files:**
- Create: `src/ui/SkillChoiceOverlay.tsx`
- Modify: `app/game/[stageId]/index.tsx` — オーバーレイの配置

**実装:**

`pendingSkillChoice` が null でない時に表示。
二択をカード形式で左右に並べ、タップで選択。
選択時に `store.selectFormSkill()` を呼ぶ。

ゲームのスロー化は `GameLoop` 側の time.delta に倍率を掛ける方式ではなく、
`pendingSkillChoice` が存在する間はシステム更新を停止する（ポーズと同様）。

**オーバーレイ構成:**

```
┌─────────────────────────────┐
│       LEVEL UP! Lv2         │
│                             │
│  ┌──────┐    ┌──────┐      │
│  │Fire  │    │DMG   │      │
│  │Rate  │    │+20%  │      │
│  │+15%  │    │      │      │
│  └──TAP─┘    └──TAP─┘      │
└─────────────────────────────┘
```

**検証:** `npx tsc --noEmit`

### Task 4-3: HUD にXPバーを統合

**Files:**
- Modify: `src/ui/HUD.tsx` — `FormXPBar` を TopLeft セクション（HPバーの下）に配置
- Modify: `app/game/[stageId]/index.tsx` — `SkillChoiceOverlay` を配置、`pendingSkillChoice` 中はゲームループを停止

**HUD 変更:**

TopLeft セクション（PauseButton + HPBar の下）に `FormXPBar` を追加。

**ゲーム画面変更:**

```typescript
// pendingSkillChoice 中はゲームループを停止
const pendingChoice = useGameSessionStore(s => s.pendingSkillChoice);
// useGameLoop の isPaused に pendingChoice を含める
```

**検証:** `npx tsc --noEmit && npx expo lint && npx jest --passWithNoTests`

---

## CP5: 統合と調整（2タスク）

### Task 5-1: ゲームループ統合と動作確認

**Files:**
- Modify: `app/game/[stageId]/index.tsx` — 全体の統合確認

**確認事項:**

1. ゲーム開始時に formXP が全フォーム Lv0 で初期化される
2. 敵撃破で XP が蓄積される
3. 閾値到達でスキル選択オーバーレイが表示される
4. スキル選択後にゲームが再開される
5. 選択したスキル効果が ShootingSystem/MovementSystem に反映される
6. TF でフォーム切り替え時、切り替え先のXP/スキルが独立して保持される
7. グレイズ3段階で異なるスコア/ゲージ報酬が付与される

**検証:** `npx tsc --noEmit && npx expo lint && npx jest --passWithNoTests`

### Task 5-2: グレイズ段階のビジュアルフィードバック

**Files:**
- Modify: `src/engine/systems/CollisionSystem.ts` — グレイズ段階に応じたパーティクル色/サイズの変更
- Modify: `src/engine/systems/SyncRenderSystem.ts` — 必要に応じてスコアポップアップ色を段階で変更

**パーティクル色:**

- かすり: 現行通り（白系）
- 接近: 黄色 (`#FFD600`)
- 極限: 赤 (`#FF3366`) + パーティクル数2倍

**スコアポップアップ色:**

- かすり: 白
- 接近: 黄色
- 極限: 赤

`onGraze` 関数にグレイズ段階を引数で渡し、段階に応じてパーティクルの色と数を変更。

**検証:** `npx tsc --noEmit && npx expo lint && npx jest --passWithNoTests`

---

## Verification

各CPの完了時:
1. `npx tsc --noEmit` — 型チェック通過
2. `npx expo lint` — Lint 通過
3. `npx jest --passWithNoTests` — テスト通過

全CP完了後:
- フォームXPが蓄積されLvアップ時に二択が表示されること
- スキル効果がShootingSystem/MovementSystemに反映されること
- グレイズ3段階で報酬が異なること
- HUDにXPゲージが表示されること
- TF切替でフォーム別にXP/スキルが独立していること
- 既存システム（コンボ、EX、ボス等）に影響がないこと
