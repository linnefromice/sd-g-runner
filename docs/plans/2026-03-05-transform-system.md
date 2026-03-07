# Transform System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** プレイヤーがステージ中にプライマリ/セカンダリの2形態を能動的に切り替えられる変形システムを追加する。

**Architecture:** gameSessionStore に変形ゲージ + セカンダリフォームを追加し、専用の TransformGaugeSystem で蓄積。HUD に変形ボタンを配置。MovementSystem を修正してフォームの移動速度倍率を反映。既存の Refit ゲートとの併存。

**Tech Stack:** Zustand (state), custom game systems (engine), React Native (HUD), expo-router (navigation params)

**Design doc:** `docs/plans/2026-03-05-transform-system-design.md`

---

### Task 1: 定数定義

**Files:**
- Modify: `src/constants/balance.ts`

**Step 1: 定数を追加**

`src/constants/balance.ts` の末尾に以下を追加:

```typescript
/** Transform System */
export const TRANSFORM_GAUGE_MAX = 100;
export const TRANSFORM_GAIN_ENEMY_KILL = 8;
export const TRANSFORM_GAIN_GATE_PASS = 12;
export const TRANSFORM_GAIN_PER_SECOND = 2;
```

**Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: 成功（エラーなし）

**Step 3: コミット**

```bash
git add src/constants/balance.ts
git commit -m "feat: Add transform gauge constants"
```

---

### Task 2: gameSessionStore に変形状態を追加

**Files:**
- Modify: `src/stores/gameSessionStore.ts`
- Test: `src/stores/__tests__/transform.test.ts`

**Step 1: テストを書く**

`src/stores/__tests__/transform.test.ts` を新規作成:

```typescript
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { TRANSFORM_GAUGE_MAX } from '@/constants/balance';

describe('Transform system store logic', () => {
  beforeEach(() => {
    useGameSessionStore.getState().resetSession(1, 'SD_Standard', 'SD_HeavyArtillery');
  });

  test('resetSession sets primaryForm and secondaryForm', () => {
    const state = useGameSessionStore.getState();
    expect(state.currentForm).toBe('SD_Standard');
    expect(state.primaryForm).toBe('SD_Standard');
    expect(state.secondaryForm).toBe('SD_HeavyArtillery');
    expect(state.transformGauge).toBe(0);
  });

  test('resetSession defaults secondaryForm to SD_HeavyArtillery', () => {
    useGameSessionStore.getState().resetSession(1, 'SD_Standard');
    const state = useGameSessionStore.getState();
    expect(state.secondaryForm).toBe('SD_HeavyArtillery');
  });

  test('addTransformGauge increases gauge', () => {
    useGameSessionStore.getState().addTransformGauge(30);
    expect(useGameSessionStore.getState().transformGauge).toBe(30);
  });

  test('addTransformGauge clamps at MAX', () => {
    useGameSessionStore.getState().addTransformGauge(150);
    expect(useGameSessionStore.getState().transformGauge).toBe(TRANSFORM_GAUGE_MAX);
  });

  test('activateTransform switches to secondary form', () => {
    useGameSessionStore.getState().addTransformGauge(TRANSFORM_GAUGE_MAX);
    useGameSessionStore.getState().activateTransform();
    const state = useGameSessionStore.getState();
    expect(state.currentForm).toBe('SD_HeavyArtillery');
    expect(state.transformGauge).toBe(0);
  });

  test('activateTransform toggles back to primary form', () => {
    useGameSessionStore.getState().addTransformGauge(TRANSFORM_GAUGE_MAX);
    useGameSessionStore.getState().activateTransform();
    useGameSessionStore.getState().addTransformGauge(TRANSFORM_GAUGE_MAX);
    useGameSessionStore.getState().activateTransform();
    expect(useGameSessionStore.getState().currentForm).toBe('SD_Standard');
  });

  test('activateTransform does nothing when gauge not full', () => {
    useGameSessionStore.getState().addTransformGauge(50);
    useGameSessionStore.getState().activateTransform();
    expect(useGameSessionStore.getState().currentForm).toBe('SD_Standard');
    expect(useGameSessionStore.getState().transformGauge).toBe(50);
  });

  test('activateTransform does nothing when awakened', () => {
    useGameSessionStore.getState().addTransformGauge(TRANSFORM_GAUGE_MAX);
    useGameSessionStore.getState().activateAwakened();
    useGameSessionStore.getState().activateTransform();
    expect(useGameSessionStore.getState().currentForm).toBe('SD_Awakened');
  });
});
```

**Step 2: テストが失敗することを確認**

Run: `npx jest src/stores/__tests__/transform.test.ts`
Expected: FAIL — `resetSession` が3引数を受け付けない、`primaryForm` / `secondaryForm` / `addTransformGauge` / `activateTransform` が存在しない

**Step 3: gameSessionStore を実装**

`src/stores/gameSessionStore.ts` に以下を変更:

1. import に `TRANSFORM_GAUGE_MAX` を追加:

```typescript
import {
  PLAYER_INITIAL_HP,
  PLAYER_INITIAL_ATK,
  PLAYER_INITIAL_SPEED,
  PLAYER_INITIAL_FIRE_RATE,
  COMBO_THRESHOLD,
  AWAKENED_DURATION,
  EX_GAUGE_MAX,
  TRANSFORM_GAUGE_MAX,
} from '@/constants/balance';
```

2. `GameSessionState` interface に追加:

```typescript
  // Transform
  primaryForm: MechaFormId;
  secondaryForm: MechaFormId;
  transformGauge: number;

  // Actions (追加)
  addTransformGauge: (amount: number) => void;
  activateTransform: () => void;
```

3. `INITIAL_STATE` に追加:

```typescript
  primaryForm: 'SD_Standard' as MechaFormId,
  secondaryForm: 'SD_HeavyArtillery' as MechaFormId,
  transformGauge: 0,
```

4. アクション実装を追加:

```typescript
  addTransformGauge: (amount) =>
    set((s) => ({ transformGauge: Math.min(TRANSFORM_GAUGE_MAX, s.transformGauge + amount) })),

  activateTransform: () => {
    const s = get();
    if (s.transformGauge < TRANSFORM_GAUGE_MAX) return;
    if (s.isAwakened) return;
    const nextForm = s.currentForm === s.secondaryForm
      ? s.primaryForm
      : s.secondaryForm;
    set({
      currentForm: nextForm,
      previousForm: s.currentForm,
      transformGauge: 0,
    });
  },
```

5. `resetSession` のシグネチャを変更:

```typescript
  resetSession: (stageId: number, formId?: MechaFormId, secondaryFormId?: MechaFormId) => void;
```

6. `resetSession` の実装を変更:

```typescript
  resetSession: (stageId, formId, secondaryFormId) => {
    const { upgrades } = useSaveDataStore.getState();
    const initialForm = formId ?? 'SD_Standard';
    const secondary = secondaryFormId ?? 'SD_HeavyArtillery';
    const bonusHp = getUpgradeEffect('hp', upgrades.baseHp);
    const bonusAtk = getUpgradeEffect('atk', upgrades.baseAtk);
    const bonusSpeed = getUpgradeEffect('speed', upgrades.baseSpeed);
    set({
      ...INITIAL_STATE,
      currentStageId: stageId,
      currentForm: initialForm,
      previousForm: initialForm,
      primaryForm: initialForm,
      secondaryForm: secondary,
      hp: PLAYER_INITIAL_HP + bonusHp,
      maxHp: PLAYER_INITIAL_HP + bonusHp,
      atk: PLAYER_INITIAL_ATK + bonusAtk,
      speed: PLAYER_INITIAL_SPEED + bonusSpeed,
    });
  },
```

**Step 4: テストがすべてパスすることを確認**

Run: `npx jest src/stores/__tests__/transform.test.ts`
Expected: PASS（全8テスト）

**Step 5: 既存テストが壊れていないことを確認**

Run: `npx jest`
Expected: 全テスト PASS（`resetSession` は既存呼び出しが `resetSession(1)` で下位互換あり）

**Step 6: コミット**

```bash
git add src/stores/gameSessionStore.ts src/stores/__tests__/transform.test.ts
git commit -m "feat: Add transform gauge state and actions to gameSessionStore"
```

---

### Task 3: TransformGaugeSystem（新規エンジンシステム）

**Files:**
- Create: `src/engine/systems/TransformGaugeSystem.ts`

**Step 1: システムを実装**

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { TRANSFORM_GAIN_PER_SECOND } from '@/constants/balance';

export const transformGaugeSystem: GameSystem<GameEntities> = (_entities, { time }) => {
  const store = useGameSessionStore.getState();
  if (store.isAwakened) return;
  store.addTransformGauge(TRANSFORM_GAIN_PER_SECOND * time.delta / 1000);
};
```

**Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: 成功

**Step 3: コミット**

```bash
git add src/engine/systems/TransformGaugeSystem.ts
git commit -m "feat: Add TransformGaugeSystem for time-based gauge accumulation"
```

---

### Task 4: CollisionSystem と GateSystem にゲージ蓄積を追加

**Files:**
- Modify: `src/engine/systems/CollisionSystem.ts`
- Modify: `src/engine/systems/GateSystem.ts`

**Step 1: CollisionSystem を修正**

`src/engine/systems/CollisionSystem.ts` に import を追加:

```typescript
import { IFRAME_DURATION, TRANSFORM_GAIN_ENEMY_KILL } from '@/constants/balance';
```

敵撃破時（L29 `store.addExGauge(5);` の直後）に追加:

```typescript
          store.addTransformGauge(TRANSFORM_GAIN_ENEMY_KILL);
```

**Step 2: GateSystem を修正**

`src/engine/systems/GateSystem.ts` に import を追加:

```typescript
import { SCORE, EX_GAIN, TRANSFORM_GAIN_GATE_PASS } from '@/constants/balance';
```

ゲート通過時（L44 `store.addExGauge(EX_GAIN.gatePass);` の直後）に追加:

```typescript
    store.addTransformGauge(TRANSFORM_GAIN_GATE_PASS);
```

**Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: 成功

**Step 4: コミット**

```bash
git add src/engine/systems/CollisionSystem.ts src/engine/systems/GateSystem.ts
git commit -m "feat: Add transform gauge accumulation on enemy kill and gate pass"
```

---

### Task 5: MovementSystem にフォーム速度倍率を反映

**Files:**
- Modify: `src/engine/systems/MovementSystem.ts`
- Modify: `app/game/[stageId]/index.tsx`（システム登録変更）

**Step 1: MovementSystem をファクトリ関数に変更**

`src/engine/systems/MovementSystem.ts` を修正:

import に追加:

```typescript
import type { MechaFormDefinition } from '@/types/forms';
```

`movementSystem` を `createMovementSystem` に変更:

```typescript
export function createMovementSystem(
  getForm: () => MechaFormDefinition
): GameSystem<GameEntities> {
  return (entities, { time }) => {
    const dt = time.delta / 1000;
    const { visibleHeight } = entities.screen;
    const form = getForm();

    // Smooth slide toward tap target (if set)
    const p = entities.player;
    if (p.targetX != null && p.targetY != null) {
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const step = PLAYER_MOVE_SPEED * form.moveSpeedMultiplier * dt;

      if (dist <= step) {
        p.x = p.targetX;
        p.y = p.targetY;
        p.targetX = null;
        p.targetY = null;
      } else {
        p.x += (dx / dist) * step;
        p.y += (dy / dist) * step;
      }
    }

    // ... 残りは変更なし（player bullets, enemy bullets, enemies, gates のループ）
```

重要: `const step = PLAYER_MOVE_SPEED * dt;` → `const step = PLAYER_MOVE_SPEED * form.moveSpeedMultiplier * dt;` の1行変更が本質。関数シグネチャの変更のためにファクトリ化が必要。

**Step 2: GameScreen でのシステム登録を変更**

`app/game/[stageId]/index.tsx` の import を変更:

```typescript
import { createMovementSystem } from '@/engine/systems/MovementSystem';
```

`systemsRef` 内の `movementSystem` を変更（L83-84 付近）:

```typescript
    scrollSystem,
    createMovementSystem(getForm),
    createShootingSystem(getForm),
```

**Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: 成功

**Step 4: コミット**

```bash
git add src/engine/systems/MovementSystem.ts app/game/\[stageId\]/index.tsx
git commit -m "feat: Apply form moveSpeedMultiplier in MovementSystem"
```

---

### Task 6: GameScreen にシステム登録 + 変形ハンドラ追加

**Files:**
- Modify: `app/game/[stageId]/index.tsx`

**Step 1: TransformGaugeSystem の import とセカンダリフォーム受け取りを追加**

import に追加:

```typescript
import { transformGaugeSystem } from '@/engine/systems/TransformGaugeSystem';
```

`useLocalSearchParams` の型を変更:

```typescript
const { stageId, form, secondary } = useLocalSearchParams<{
  stageId: string;
  form?: string;
  secondary?: string;
}>();
```

`resetSession` の呼び出しを変更:

```typescript
  useEffect(() => {
    useGameSessionStore.getState().resetSession(
      stageIdNum,
      (form as MechaFormId) || undefined,
      (secondary as MechaFormId) || undefined,
    );
  }, [stageIdNum, form, secondary]);
```

**Step 2: systemsRef に transformGaugeSystem を追加**

`systemsRef` の配列に追加（`awakenedSystem` の前が適切）:

```typescript
  const systemsRef = useRef<GameSystem<GameEntities>[]>([
    scrollSystem,
    createMovementSystem(getForm),
    createShootingSystem(getForm),
    enemyAISystem,
    createSpawnSystem(stage),
    transformGaugeSystem,
    awakenedSystem,
    collisionSystem,
    gateSystem,
    iframeSystem,
    bossSystem,
    gameOverSystem,
    createSyncRenderSystem(renderData),
  ]);
```

**Step 3: 変形ハンドラを追加**

`handleEXBurst` の近くに追加:

```typescript
  const handleTransform = useCallback(() => {
    useGameSessionStore.getState().activateTransform();
  }, []);
```

**Step 4: HUD に onTransform を渡す**

```typescript
        <HUD
          onPause={handlePause}
          onEXBurst={handleEXBurst}
          onTransform={handleTransform}
          entitiesRef={entitiesRef}
          stageDuration={stage.duration}
        />
```

**Step 5: 型チェック**

Run: `npx tsc --noEmit`
Expected: FAIL — HUD が `onTransform` prop を受け付けない（Task 7 で修正）

**Step 6: コミット**

```bash
git add app/game/\[stageId\]/index.tsx
git commit -m "feat: Register TransformGaugeSystem and transform handler in GameScreen"
```

---

### Task 7: HUD に変形ボタンとゲージを追加

**Files:**
- Modify: `src/ui/HUD.tsx`

**Step 1: TransformButton コンポーネントを追加**

`src/ui/HUD.tsx` に import を追加:

```typescript
import { COLORS } from '@/constants/colors';
import { EX_GAUGE_MAX, COMBO_THRESHOLD, TRANSFORM_GAUGE_MAX } from '@/constants/balance';
```

`EXButton` の後に `TransformButton` コンポーネントを追加:

```typescript
function TransformGaugeBar() {
  const transformGauge = useGameSessionStore((s) => s.transformGauge);
  const ratio = transformGauge / TRANSFORM_GAUGE_MAX;
  const isFull = transformGauge >= TRANSFORM_GAUGE_MAX;

  return (
    <View style={styles.transformContainer}>
      <View style={styles.transformTrack}>
        <View
          style={[
            styles.transformFill,
            {
              width: `${ratio * 100}%` as `${number}%`,
              backgroundColor: isFull ? COLORS.neonGreen : COLORS.neonPink,
            },
          ]}
        />
      </View>
      <Text style={styles.transformLabel}>TF</Text>
    </View>
  );
}

function TransformButton({ onActivate }: { onActivate: () => void }) {
  const transformGauge = useGameSessionStore((s) => s.transformGauge);
  const isAwakened = useGameSessionStore((s) => s.isAwakened);
  const isFull = transformGauge >= TRANSFORM_GAUGE_MAX;
  const canTransform = isFull && !isAwakened;

  return (
    <TouchableOpacity
      style={[styles.transformButton, canTransform && styles.transformButtonActive]}
      onPress={onActivate}
      disabled={!canTransform}
    >
      <Text style={[styles.transformButtonText, canTransform && styles.transformButtonTextActive]}>
        TF
      </Text>
    </TouchableOpacity>
  );
}
```

**Step 2: HUDProps と HUDInner を更新**

```typescript
type HUDProps = {
  onPause: () => void;
  onEXBurst: () => void;
  onTransform: () => void;
  entitiesRef: React.RefObject<GameEntities>;
  stageDuration: number;
};

function HUDInner({ onPause, onEXBurst, onTransform, entitiesRef, stageDuration }: HUDProps) {
```

**Step 3: bottomRight エリアに TransformButton と TransformGaugeBar を追加**

```typescript
        <View style={styles.bottomRight}>
          <ComboGauge />
          <View style={styles.buttonRow}>
            <TransformButton onActivate={onTransform} />
            <EXButton onActivate={onEXBurst} />
          </View>
          <TransformGaugeBar />
          <EXGaugeBar />
        </View>
```

**Step 4: スタイルを追加**

```typescript
  buttonRow: { flexDirection: 'row', gap: 8 },
  transformContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  transformTrack: {
    width: 80,
    height: 6,
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  transformFill: { height: '100%', borderRadius: 3 },
  transformLabel: { fontSize: 10, color: '#888', fontWeight: '600' },
  transformButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  transformButtonActive: {
    backgroundColor: COLORS.neonGreen,
    borderColor: '#fff',
  },
  transformButtonText: { fontSize: 14, fontWeight: 'bold', color: '#666' },
  transformButtonTextActive: { color: '#000' },
```

**Step 5: 型チェック + Lint**

Run: `npx tsc --noEmit && npx expo lint`
Expected: 成功

**Step 6: コミット**

```bash
git add src/ui/HUD.tsx
git commit -m "feat: Add transform button and gauge bar to HUD"
```

---

### Task 8: Select Form 画面をプライマリ/セカンダリ選択に変更

**Files:**
- Modify: `app/stages/[id]/select-form.tsx`

**Step 1: 状態管理を2段階選択に変更**

コンポーネント内の状態を追加:

```typescript
  const [primaryForm, setPrimaryForm] = useState<MechaFormId | null>(null);
  const [secondaryForm, setSecondaryForm] = useState<MechaFormId | null>(null);
```

**Step 2: handleSelect を変更**

既存の `handleSelect` を削除し、以下に置き換え:

```typescript
  const handleFormTap = (formId: MechaFormId) => {
    if (primaryForm === null) {
      setPrimaryForm(formId);
    } else if (primaryForm === formId) {
      // Deselect primary
      setPrimaryForm(secondaryForm);
      setSecondaryForm(null);
    } else if (secondaryForm === formId) {
      // Deselect secondary
      setSecondaryForm(null);
    } else if (secondaryForm === null) {
      setSecondaryForm(formId);
    } else {
      // Both selected — replace secondary
      setSecondaryForm(formId);
    }
  };

  const handleStart = () => {
    if (primaryForm && secondaryForm) {
      router.push(`/game/${stageIdNum}?form=${primaryForm}&secondary=${secondaryForm}`);
    }
  };
```

**Step 3: カードUI を修正**

各フォームカードの Select ボタンを以下に変更:

```typescript
              {isUnlocked ? (
                <View style={styles.selectRow}>
                  {primaryForm === formId && (
                    <Text style={styles.selectedBadge}>PRIMARY</Text>
                  )}
                  {secondaryForm === formId && (
                    <Text style={styles.selectedBadgeSecondary}>SECONDARY</Text>
                  )}
                  <TouchableOpacity
                    style={[
                      styles.selectButton,
                      (primaryForm === formId || secondaryForm === formId) && styles.selectButtonSelected,
                    ]}
                    onPress={() => handleFormTap(formId)}
                  >
                    <Text style={styles.selectButtonText}>
                      {primaryForm === formId || secondaryForm === formId ? 'Selected' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : /* ... unlock logic unchanged ... */ }
```

**Step 4: Back ボタンの上に Start ボタンを追加**

```typescript
      {primaryForm && secondaryForm && (
        <TouchableOpacity style={[styles.startButton, { marginBottom: 8 }]} onPress={handleStart}>
          <Text style={styles.startButtonText}>Start Stage</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.backButton, { marginBottom: Math.max(insets.bottom, 24) }]}
        onPress={() => router.push('/stages')}
      >
        <Text style={styles.backButtonText}>Back to Stages</Text>
      </TouchableOpacity>
```

**Step 5: スタイルを追加**

```typescript
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.neonBlue,
    backgroundColor: COLORS.neonBlue + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  selectedBadgeSecondary: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.neonGreen,
    backgroundColor: COLORS.neonGreen + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  selectButtonSelected: {
    backgroundColor: COLORS.neonBlue + '55',
  },
  startButton: {
    marginHorizontal: 24,
    backgroundColor: COLORS.neonBlue + '44',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.neonBlue,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.neonBlue,
  },
```

**Step 6: 型チェック + Lint**

Run: `npx tsc --noEmit && npx expo lint`
Expected: 成功

**Step 7: コミット**

```bash
git add app/stages/\[id\]/select-form.tsx
git commit -m "feat: Change Select Form to primary/secondary two-step selection"
```

---

### Task 9: How to Play ページの更新

**Files:**
- Modify: `app/how-to-play.tsx`

**Step 1: MECHA FORMS セクションに変形メカニクスの説明を追加**

`COMBO & AWAKENING` セクションの後に新セクションを追加:

```typescript
  {
    title: 'TRANSFORM',
    items: [
      { label: 'Transform Gauge', desc: 'Builds up over time, and by defeating enemies (+8) and passing through gates (+12). When full, you can transform.' },
      { label: 'How to Transform', desc: 'Tap the TF button (bottom-right) when the gauge is full. Switches between your Primary and Secondary form.' },
      { label: 'Form Selection', desc: 'Choose two forms before starting a stage. Primary is your starting form, Secondary is your transform target.' },
      { label: 'Refit Gates', desc: 'Refit gates still force-switch your form regardless of the transform gauge. This can put you in a form outside your selected pair.' },
    ],
  },
```

**Step 2: Lint チェック**

Run: `npx expo lint`
Expected: 成功

**Step 3: コミット**

```bash
git add app/how-to-play.tsx
git commit -m "feat: Add Transform section to How to Play page"
```

---

### Task 10: 全体検証 + 品質チェック

**Step 1: 全テスト実行**

Run: `npx jest`
Expected: 全テスト PASS

**Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: 成功

**Step 3: Lint**

Run: `npx expo lint`
Expected: 成功

**Step 4: 変更差分の確認**

Run: `git diff main --stat`

期待するファイル一覧:
- `src/constants/balance.ts` (modified)
- `src/stores/gameSessionStore.ts` (modified)
- `src/stores/__tests__/transform.test.ts` (new)
- `src/engine/systems/TransformGaugeSystem.ts` (new)
- `src/engine/systems/CollisionSystem.ts` (modified)
- `src/engine/systems/GateSystem.ts` (modified)
- `src/engine/systems/MovementSystem.ts` (modified)
- `app/game/[stageId]/index.tsx` (modified)
- `src/ui/HUD.tsx` (modified)
- `app/stages/[id]/select-form.tsx` (modified)
- `app/how-to-play.tsx` (modified)
