# Testing Guide

Project G-Runner のテスト戦略と実行方法。

## Overview

```
Test Suites: 14 passed
Tests:       128 passed
Time:        ~1s
```

**方針**: ゲームバランス・データ整合性・ステートマシンなど、バグが見えにくい「計算ロジック」に集中してテストする。レンダリング・UI は手動テストに委ねる。

## Commands

```bash
npx jest                              # 全テスト実行
npx jest --watch                      # ウォッチモード
npx jest src/game/__tests__/stages    # 特定スイートのみ
npx jest --passWithNoTests            # CI 用 (テストなしでも成功)
```

## Test Configuration

**`jest.config.js`**: `jest-expo` プリセット。`android/`, `ios/`, `node_modules/` を除外。Skia/Reanimated/RNGH の transform 設定あり。

**`jest.setup.js`**: 以下のネイティブモジュールをモック:

| Module | Mock |
|--------|------|
| `expo-av` | `Audio.Sound`, `setAudioModeAsync` |
| `expo-haptics` | `impactAsync`, `notificationAsync`, フィードバックスタイル enum |
| `@react-native-async-storage/async-storage` | `getItem`, `setItem`, `removeItem`, `clear` |

## Test Coverage by Layer

### Covered (高 ROI)

| Layer | Suites | Tests | What |
|-------|--------|-------|------|
| **Constants** | 1 | 3 | スクリーンメトリクス計算 |
| **Stores** | 3 | 30 | gameSessionStore (変身, 覚醒), saveDataStore (クレジット, アップグレード, アンロック) |
| **Game Data** | 5 | 51 | ゲート定義, スコアリング, ステージ構造, アップグレードコスト, 難易度スケーリング |
| **i18n** | 1 | 2 | EN/JA キー同期チェック |
| **Engine** | 4 | 42 | AABB 衝突, コリジョンユーティリティ, ボス撃破, エフェクト発生 |

### Not Covered (意図的)

| Layer | Reason |
|-------|--------|
| **Rendering** (GameCanvas, shapes) | Skia は GPU 描画。スナップショットテストのベースラインが未構築 |
| **UI Components** (HUD, PauseMenu) | React コンポーネントテストの ROI が低い |
| **Pages** (app/) | expo-router 統合テストの範囲。E2E テスト向き |
| **Engine Systems** (Movement, Spawn, AI 等) | ゲームループ内の統合ロジック。個別テストのセットアップコストが高い |
| **Audio/Haptics** | ネイティブモジュール。jest.setup.js でモック済み |

## Test Suites Detail

### Constants

**`dimensions.test.ts`** (3 tests)
- `getScreenMetrics()` のスケールと visibleHeight 計算
- iPhone SE 2nd gen (375×667) での実値検証

### Stores

**`transform.test.ts`** (8 tests)
- `resetSession()` 初期化、ゲージ蓄積・クランプ、変身トグル
- 覚醒中はアクティベートしないガード検証

**`saveData.test.ts`** (14 tests)
- クレジット加算/消費 (残高不足チェック)、アップグレードレベル (MAX チェック, コスト検証)
- フォーム/ステージアンロック (重複防止)、ハイスコア更新 (ダウングレード防止)
- 設定値クランプ (ボリューム 0–1)

**`awakened.test.ts`** (8 tests)
- 覚醒発動/終了のステートマシン、コンボカウントしきい値、セッションリセット

### Game Data

**`gates.test.ts`** (6 tests)
- ゲートプリセット定義の型・効果検証 (enhance, recovery, tradeoff, refit)

**`scoring.test.ts`** (6 tests)
- 敵タイプ別スコア (100–600 pts)、ステージクリアボーナス (1000/3000)

**`stages.test.ts`** (6 tests)
- 全 15 ステージの構造検証 (ID, name, duration, timeline)
- ボスステージ判定 (5, 10, 15)、タイムライン時系列順チェック
- エンドレスステージ (99) の登録・除外検証

**`upgrades.test.ts`** (14 tests)
- コストスケーリング (ATK/HP/Speed/DEF/CreditBoost)
- 効果累積計算、フォームアンロック条件 (ステージクリア + クレジット)

**`difficulty.test.ts`** (7 tests)
- ステージ別難易度パラメータ (scrollSpeed, spawnInterval, HP/ATK 倍率)
- クランプ値検証、ボス HP 計算 (500/750/1000)

### i18n

**`locale-keys.test.ts`** (2 tests)
- EN と JA の辞書キーパス完全一致
- 関数型キーの型一致

### Engine

**`collision.test.ts`** (5 tests)
- AABB オーバーラップ判定、接触エッジの排他判定、包含判定
- プレイヤーヒットボックスのセンタリング (32×40 visual → 16×16 hitbox)

**`collision-utils.test.ts`** (5 tests)
- `getCenter()`, `getDistance()` のユーティリティ関数

**`bossKill.test.ts`** (3 tests)
- `applyBossKill()` のボス非活性化 + ステージクリアフラグ設定
- null/非活性ボスのエッジケース

**`effects.test.ts`** (11 tests)
- 各エフェクトトリガーの検証 (敵撃破, プレイヤー被弾, ボス撃破, グレイズ, ゲート通過, パリィ, デブリ破壊)
- パーティクル数・ヒットストップ値・シェイク強度の定数一致

## Testing Patterns

### Store テスト

```typescript
beforeEach(() => {
  useGameSessionStore.getState().resetSession(1, 'SD_Standard', 'SD_HeavyArtillery');
});

test('gauge increments', () => {
  const store = useGameSessionStore.getState();
  store.addTransformGauge(50);
  expect(store.transformGauge).toBe(50);
});
```

Zustand ストアは `getState()` / `setState()` で直接テスト。

### Entity モック

```typescript
function createMockEntities(): Pick<GameEntities, 'particles' | 'scorePopups' | ...> {
  return {
    particles: Array.from({ length: 64 }, () => ({ active: false, ... })),
    hitStopTimer: 0,
    ...
  };
}
```

テストに必要なプロパティのみ `Pick` で絞る。

### パラメタライズドテスト

```typescript
test.each([1, 2, 3, ..., 15])('stage %i has valid structure', (id) => {
  const stage = getStage(id);
  expect(stage.timeline.length).toBeGreaterThan(0);
});
```

## Adding New Tests

新しいテストを追加する際のガイドライン:

1. **配置**: テスト対象ファイルと同じディレクトリに `__tests__/` フォルダを作成
2. **命名**: `<module>.test.ts`
3. **ネイティブモジュール**: 新しいネイティブ依存を追加した場合、`jest.setup.js` にモックを追加
4. **ストアテスト**: `beforeEach` で `resetSession()` または `setState()` でリセット
5. **キー同期**: i18n に新しいキーを追加したら、EN/JA 両方に追加（`locale-keys.test.ts` が検知する）
