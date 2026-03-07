# Phase 3: メタゲーム — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** メタゲーム画面群（ステージセレクト、強化、設定、フォーム選択）+ セーブ/ロード統合 + リザルト画面拡張

**Architecture:** saveDataStore (既存) ↔ UI 画面 (新規実装) + resetSession 拡張 (upgrade bonuses)

**Tech Stack:** React Native, expo-router, Zustand, AsyncStorage

---

### Task 1: アップグレード定数 + フォームアンロック条件

**Files:**
- Create: `src/game/upgrades.ts`

**Step 1: Create upgrade config and form unlock conditions**

```typescript
import type { MechaFormId } from '@/types/forms';

export interface UpgradeConfig {
  effect: number;
  maxLevel: number;
  costPerLevel: number;
  label: string;
  unit: string;
}

export type FormUnlockCondition =
  | { type: 'initial' }
  | { type: 'unlock'; requiredStage: number; cost: number }
  | { type: 'combo_only' };

export const UPGRADE_CONFIG: Record<string, UpgradeConfig> = {
  atk:   { effect: 2,    maxLevel: 10, costPerLevel: 100, label: 'ATK',   unit: '+{value}' },
  hp:    { effect: 10,   maxLevel: 10, costPerLevel: 100, label: 'HP',    unit: '+{value}' },
  speed: { effect: 0.05, maxLevel: 5,  costPerLevel: 100, label: 'Speed', unit: '+{value}%' },
} as const;

export const FORM_UNLOCK_CONDITIONS: Record<MechaFormId, FormUnlockCondition> = {
  SD_Standard:       { type: 'initial' },
  SD_HeavyArtillery: { type: 'unlock', requiredStage: 3, cost: 500 },
  SD_HighSpeed:      { type: 'unlock', requiredStage: 7, cost: 500 },
  SD_Awakened:       { type: 'combo_only' },
};

export function getUpgradeCost(stat: string, currentLevel: number): number {
  const config = UPGRADE_CONFIG[stat];
  if (!config) return Infinity;
  return config.costPerLevel * (currentLevel + 1);
}

export function getUpgradeEffect(stat: string, level: number): number {
  const config = UPGRADE_CONFIG[stat];
  if (!config) return 0;
  return config.effect * level;
}

export function canUnlockForm(
  formId: MechaFormId,
  unlockedStages: number[],
  credits: number
): boolean {
  const cond = FORM_UNLOCK_CONDITIONS[formId];
  if (cond.type !== 'unlock') return false;
  return unlockedStages.includes(cond.requiredStage) && credits >= cond.cost;
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/game/upgrades.ts
git commit -m "feat: Add upgrade constants and form unlock conditions"
```

---

### Task 2: resetSession 拡張 (upgrade bonuses + form selection)

**Files:**
- Modify: `src/stores/gameSessionStore.ts`

**Step 1: Update resetSession to accept formId and apply upgrade bonuses**

Update `resetSession` signature:
```typescript
resetSession: (stageId: number, formId?: MechaFormId) => void;
```

Implementation:
```typescript
resetSession: (stageId, formId) => {
  const saveData = useSaveDataStore.getState();
  const initialForm = formId ?? 'SD_Standard';
  set({
    ...INITIAL_STATE,
    currentStageId: stageId,
    currentForm: initialForm,
    previousForm: initialForm,
    hp: PLAYER_INITIAL_HP + saveData.upgrades.baseHp * 10,
    maxHp: PLAYER_INITIAL_HP + saveData.upgrades.baseHp * 10,
    atk: PLAYER_INITIAL_ATK + saveData.upgrades.baseAtk * 2,
    speed: PLAYER_INITIAL_SPEED + saveData.upgrades.baseSpeed * 0.05,
  });
},
```

Add import: `import { useSaveDataStore } from '@/stores/saveDataStore';`

**Step 2: Update game screen to pass form from URL param**

Modify `app/game/[stageId]/index.tsx`:
- Read `form` from search params: `const { stageId, form } = useLocalSearchParams<{ stageId: string; form?: string }>();`
- Pass to resetSession: `resetSession(stageIdNum, (form as MechaFormId) || undefined)`

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/stores/gameSessionStore.ts app/game/\[stageId\]/index.tsx
git commit -m "feat: Apply upgrade bonuses and form selection to game session"
```

---

### Task 3: セーブデータロード (app startup)

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Add save data loading on app startup**

```tsx
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    useSaveDataStore.getState().load().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a14' }}>
        <ActivityIndicator size="large" color="#00e5ff" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a14' },
      }}
    />
  );
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: Load save data on app startup with loading indicator"
```

---

### Task 4: ステージセレクト画面

**Files:**
- Modify: `app/stages/index.tsx`

**Step 1: Implement dynamic stage list with locks + high scores**

Full replacement of the placeholder. Key features:
- Read `unlockedStages`, `highScores` from `useSaveDataStore`
- Read `credits` for display
- Show stages 1-5 with lock/unlock state
- Display high score per stage
- Locked stages show lock icon, unlocked show stage name + score
- Tap navigates to `/stages/[id]/select-form`
- Link to upgrade screen
- Link back to title

Use `COLORS` from constants, `ScrollView` for stage list, `TouchableOpacity` for each stage card.

**Step 2: Verify**

Run: `npx tsc --noEmit && npx expo lint`
Expected: No errors

**Step 3: Commit**

```bash
git add app/stages/index.tsx
git commit -m "feat: Implement stage select screen with locks and high scores"
```

---

### Task 5: フォーム選択画面

**Files:**
- Modify: `app/stages/[id]/select-form.tsx`

**Step 1: Implement form selection with unlock + stats display**

Key features:
- Read `unlockedForms`, `unlockedStages`, `credits` from `useSaveDataStore`
- Display all 4 forms (SD_Standard, SD_HeavyArtillery, SD_HighSpeed, SD_Awakened)
- Awakened shown as "combo only" — not selectable
- Unlocked forms: show stats (ATK%, Speed%, FireRate%, ability), selectable
- Locked forms: show unlock condition + "Unlock" button if conditions met
- On select: navigate to `/game/[stageId]?form=[formId]`
- Use `getFormDefinition()` to show form stats

**Step 2: Verify**

Run: `npx tsc --noEmit && npx expo lint`
Expected: No errors

**Step 3: Commit**

```bash
git add app/stages/\[id\]/select-form.tsx
git commit -m "feat: Implement form selection screen with unlock conditions"
```

---

### Task 6: 強化画面

**Files:**
- Modify: `app/upgrade.tsx`

**Step 1: Implement upgrade screen with 3 stat cards**

Key features:
- Read `credits`, `upgrades` from `useSaveDataStore`
- Display credit balance at top
- 3 upgrade cards (ATK, HP, Speed):
  - Current level / max level
  - Effect per level
  - Next upgrade cost
  - "Upgrade" button (disabled if max level or insufficient credits)
  - "MAX" badge when maxed
- Use `UPGRADE_CONFIG` for display data
- Use `getUpgradeCost()` for cost calculation
- Call `saveDataStore.upgradeAtk/Hp/Speed()` on button press
- Back to stages link

**Step 2: Verify**

Run: `npx tsc --noEmit && npx expo lint`
Expected: No errors

**Step 3: Commit**

```bash
git add app/upgrade.tsx
git commit -m "feat: Implement upgrade screen with ATK/HP/Speed cards"
```

---

### Task 7: 設定画面

**Files:**
- Modify: `app/settings.tsx`

**Step 1: Implement settings screen with volume sliders**

Key features:
- Read `settings` from `useSaveDataStore`
- BGM volume slider (React Native Slider or custom)
- SE volume slider
- Display current value as percentage
- Call `saveDataStore.setVolume()` on change
- Back to title link

Note: Use a simple custom slider with `TouchableOpacity` + `View` (width-based) since RN doesn't have a built-in Slider on all platforms with Expo.
Or use `@react-native-community/slider` if already installed, otherwise use a simple row of buttons (0%, 25%, 50%, 75%, 100%).

Simplest approach: use stepped volume buttons (0%, 25%, 50%, 75%, 100%) for each volume type.

**Step 2: Verify**

Run: `npx tsc --noEmit && npx expo lint`
Expected: No errors

**Step 3: Commit**

```bash
git add app/settings.tsx
git commit -m "feat: Implement settings screen with volume controls"
```

---

### Task 8: リザルト画面拡張

**Files:**
- Modify: `app/game/[stageId]/result.tsx`

**Step 1: Fix boss stage credit calculation and enhance display**

Changes:
- Import `getStage` and check `isBossStage` for correct credit calculation
- Fix `getStageClearCredits(stage.isBossStage)` instead of hardcoded `false`
- Add stage clear bonus score display
- Show total credits from save store

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/game/\[stageId\]/result.tsx
git commit -m "fix: Correct boss stage credit calculation in result screen"
```

---

### Task 9: テスト

**Files:**
- Create: `src/game/__tests__/upgrades.test.ts`
- Create: `src/stores/__tests__/saveData.test.ts`

**Step 1: Write upgrade logic tests**

```typescript
// src/game/__tests__/upgrades.test.ts
describe('upgrades', () => {
  test('getUpgradeCost returns correct cost per level');
  test('getUpgradeEffect returns cumulative effect');
  test('canUnlockForm checks stage + credits');
  test('canUnlockForm returns false for initial/combo_only forms');
  test('UPGRADE_CONFIG has correct max levels');
});
```

**Step 2: Write saveData integration tests**

```typescript
// src/stores/__tests__/saveData.test.ts
describe('saveDataStore', () => {
  test('upgradeAtk increments level and deducts credits');
  test('upgradeAtk returns false at max level');
  test('upgradeHp increments level and deducts credits');
  test('upgradeSpeed has max level 5');
  test('unlockForm adds form to unlockedForms');
  test('unlockForm does not duplicate');
  test('spendCredits returns false if insufficient');
});
```

**Step 3: Run tests**

Run: `npx jest --passWithNoTests`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/game/__tests__/upgrades.test.ts src/stores/__tests__/saveData.test.ts
git commit -m "test: Add upgrade logic and save data store tests"
```

---

### Task 10: 最終品質チェック

**Step 1: Run full quality check**

```bash
npx expo lint
npx tsc --noEmit
npx jest --passWithNoTests
```

Expected: All pass

**Step 2: Verify all screens**

- Title → Stages → Form Select → Game → Result → Stages (navigation flow)
- Upgrade screen: all 3 stats display correctly
- Settings screen: volume controls work
- Stage locks: locked stages not navigable
