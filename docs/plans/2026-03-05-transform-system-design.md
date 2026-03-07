# Transform System Design

Date: 2026-03-05

## Overview

ステージ中にプレイヤーが能動的にメカフォームを切り替えられる「変形システム」を追加する。
既存の Refit ゲート（強制変形）と併存するハイブリッド方式。

## Core Mechanics

### 2形態トグル

- Select Form 画面で **プライマリ** と **セカンダリ** の2形態を選択してステージに入る
- プライマリ = ステージ開始時のフォーム
- セカンダリ = 変形先のフォーム
- 同じフォームの重複選択は不可

### 変形ゲージ（Transform Gauge）

専用ゲージ（0〜100）。MAX で変形可能、変形で全消費。

| ソース | 量 | 備考 |
|--------|-----|------|
| 敵撃破 | +8 | 30体 → 240 |
| ゲート通過 | +12 | 8回 → 96 |
| 時間経過 | +2/秒 | 90秒 → 180 |
| **合計目安** | ~516 | 1ステージ約5回変形可能 |

### 制約

- 覚醒（Awakened）中はゲージ蓄積しない＆変形不可
- Refit ゲートは従来通り強制変形（プライマリ/セカンダリの枠外も可）
- 能動変形のトグルはプライマリ ↔ セカンダリのみ

## State Changes

### gameSessionStore 追加フィールド

```typescript
secondaryForm: MechaFormId;
transformGauge: number;       // 0〜100
canTransform: boolean;        // computed (gauge >= MAX)
```

### gameSessionStore 追加アクション

```typescript
addTransformGauge(amount: number): void;
activateTransform(): void;
```

### activateTransform ロジック

```
if gauge < MAX → return
if isAwakened → return
nextForm = (currentForm === secondaryForm) ? primaryForm : secondaryForm
set currentForm = nextForm, previousForm = currentForm, gauge = 0
```

## Engine Systems

### TransformGaugeSystem（新規）

毎フレーム時間経過分（+2/秒）をゲージに加算。覚醒中はスキップ。

### MovementSystem 修正

現在 `PLAYER_MOVE_SPEED` 定数のみ使用 → `form.moveSpeedMultiplier` を掛ける。
`createMovementSystem(getForm)` ファクトリ関数に変更。

### CollisionSystem 修正

敵撃破時に `addTransformGauge(8)` 追加。

### GateSystem 修正

ゲート通過時に `addTransformGauge(12)` 追加。

## UI Changes

### HUD

EX Burst ボタンの隣に変形ボタンを追加。
- ゲージ未満 → 半透明 + ゲージ%表示
- ゲージMAX → 光る + 「READY」
- 覚醒中 → グレーアウト

### Select Form 画面

1形態選択 → プライマリ/セカンダリ2段階選択に変更。
両方選んだら Start ボタンが有効に。

## Files Changed

| File | Change |
|------|--------|
| `src/constants/balance.ts` | TRANSFORM_GAUGE_MAX, TRANSFORM_GAIN_* 定数追加 |
| `src/stores/gameSessionStore.ts` | secondaryForm, transformGauge, canTransform, アクション追加 |
| `src/engine/systems/TransformGaugeSystem.ts` | **新規** |
| `src/engine/systems/MovementSystem.ts` | createMovementSystem(getForm) に変更 |
| `src/engine/systems/CollisionSystem.ts` | ゲージ加算追加 |
| `src/engine/systems/GateSystem.ts` | ゲージ加算追加 |
| `app/game/[stageId]/index.tsx` | ハンドラ追加、システム変更、セカンダリ受け取り |
| `src/ui/HUD.tsx` | 変形ボタン + ゲージ表示 |
| `app/stages/[id]/select-form.tsx` | 2段階選択UI |
| `app/how-to-play.tsx` | 変形メカニクス説明追加 |
