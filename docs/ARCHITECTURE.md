# Architecture Guide

Project G-Runner のアーキテクチャ概要。新規開発者向け。

## Three-Layer Separation

```
app/            → Screen pages (expo-router)
src/engine/     → Game logic (pure TS, no React)
src/rendering/  → Skia drawing (reads engine state, no game logic)
src/stores/     → Zustand stores bridging engine ↔ UI
src/game/       → Data definitions (forms, stages, scoring, upgrades)
src/ui/         → React Native HUD components
src/constants/  → Balance values, colors, dimensions
src/types/      → TypeScript type definitions
src/i18n/       → Internationalization
src/audio/      → Sound & haptics management
```

**ルール**: エンジン層は React に依存しない。レンダリング層はゲームロジックを持たない。

## Data Flow

```
Game Loop (60fps rAF)
  │
  ▼
Systems ──mutate──▶ entities (plain JS objects in useRef)
  │                     │
  │                     ▼
  │              SyncRenderSystem
  │                     │
  │                     ▼
  │              SharedValue (Reanimated)
  │                     │
  │                     ▼
  │              GameCanvas (Skia useDerivedValue)
  │                     │
  │                     ▼
  │                  Screen
  │
  ▼ (event-driven only)
Zustand gameSessionStore ──▶ HUD (React Native)
```

**重要**: エンティティ座標に `useState`/`setState` を使わない。60fps の再レンダーストームを引き起こす。

## Game Loop

`useGameLoop` (`src/engine/GameLoop.ts`) が requestAnimationFrame で毎フレームシステムを順次呼び出す。

- Delta time: 33ms にクランプ（低 FPS 時のトンネリング防止）
- Hit Stop: `hitStopTimer > 0` の間、SyncRenderSystem 以外のシステムをスキップ
- Slow Motion: `gameSessionStore.slowMotionFactor` を delta に乗算

### System Execution Order

```
 1. ScrollSystem          — stageTime/scrollY を進める
 2. BoostLaneSystem       — ブーストレーン判定
 3. MovementSystem        — プレイヤー移動、弾・パーティクル更新
 4. ShootingSystem        — プレイヤー弾発射
 5. EnemyAISystem         — 敵 AI（射撃タイマー、パトロール移動）
 6. SpawnSystem           — タイムラインに基づく敵/ゲート/デブリ生成
 7. TransformGaugeSystem  — 変身ゲージ蓄積
 8. AwakenedSystem        — 覚醒タイマー管理
 9. EXBurstSystem         — EX バーストタイマー管理
10. CollisionSystem       — 衝突判定・ダメージ・スコア・エフェクト
11. GateSystem            — ゲート通過判定・効果適用
12. IFrameSystem          — 無敵時間カウントダウン
13. BossSystem            — ボス AI（フェーズ遷移、攻撃パターン）
14. GameOverSystem        — 勝利/敗北条件チェック
15. ParticleSystem        — パーティクル/スコアポップアップ更新
16. ScreenShakeSystem     — 画面揺れ減衰
17. SyncRenderSystem      — RenderEntity[] 構築 → SharedValue 書き込み
```

SyncRenderSystem は常に最後。Hit Stop 中も実行される。

## Entity Pool Pattern

ゲーム中のメモリアロケーションをゼロにするため、全エンティティは起動時にプリアロケートされる。

```typescript
// src/engine/pool.ts
acquireFromPool<T extends { active: boolean }>(pool: T[], template: T): T | null
```

- `createGameEntities()` で固定サイズ配列を生成（例: enemies[40], bullets[30]）
- `acquireFromPool()` で `active === false` のスロットを再利用
- エンティティ破棄は `entity.active = false` のみ（GC 不要）

## SyncRenderSystem

エンジン → レンダリングの唯一のブリッジ。毎フレーム以下を行う:

1. 全アクティブエンティティから `RenderEntity[]` を構築
2. SVG パス文字列、グロー、シャドウ、HP バー等を計算
3. 視覚効果（スポーンフェードイン、2.5D 深度スケール、弾ストレッチ、ヒットフラッシュ）を適用
4. 画面オーバーレイ（危険表示、ボスフェーズ、覚醒、ゲートフラッシュ）を更新
5. `renderData.value = out.slice()` で SharedValue に書き込み（`.slice()` でフリーズ防止）

## GameCanvas

`@shopify/react-native-skia` の Canvas 上に全エンティティを描画する。

- **プリアロケートスロット**: `EntitySlot` × 128 個を固定レンダー
- 各スロットが `useDerivedValue` で `renderData.value[index]` を読み取り
- エンティティが存在すればレンダー、なければオフスクリーン (-200, -200)
- 背景: グラデーション + 星 (3 層パララックス) + グリッド線 + スキャンライン

**禁止パターン**: エンティティごとに個別の React コンポーネントを作らない。

## State Architecture

| Layer | Storage | Purpose | Update Frequency |
|-------|---------|---------|-----------------|
| Game entities | `useRef` (plain JS) | 位置、弾、敵 | 毎フレーム (60fps) |
| Session UI | Zustand `gameSessionStore` | HP, スコア, コンボ, EX ゲージ | イベント駆動 |
| Persistent | Zustand `saveDataStore` + AsyncStorage | ハイスコア, アンロック, クレジット | ゲーム終了時 |

Systems → Store の例: `CollisionSystem` が `gameSessionStore.getState().setHp(newHp)` を呼ぶ。

## Coordinate System

- 論理座標: X `0–320` (固定幅), Y はアスペクト比に依存
- スケール: `screenWidth / 320`
- プレイヤーヒットボックス (16×16) はビジュアル (32×40) より小さい

## Gesture Handling (Reanimated Safety)

RNGH v2 + Reanimated 4.x の組み合わせで、ジェスチャーコールバックはデフォルトでワークレット実行される。ワークレットは JS オブジェクトをフリーズするため、entities が変異不能になりゲームが停止する。

```typescript
// ✅ 必須: .runOnJS(true)
const pan = Gesture.Pan().runOnJS(true).onUpdate((e) => {
  entities.player.x = e.absoluteX / scale;
});

// ❌ 致命的: entities がフリーズ → ゲーム停止
const pan = Gesture.Pan().onUpdate((e) => {
  entities.player.x = e.absoluteX / scale;
});
```

**SharedValue ルール**:
- 書き込みは SyncRenderSystem のみ
- プリミティブ値または配列コピーのみ代入
- entities オブジェクトの参照を直接渡さない

## Key Files

| File | Purpose |
|------|---------|
| `src/engine/GameLoop.ts` | rAF ループ、システム呼び出し |
| `src/engine/systems/SyncRenderSystem.ts` | エンティティ → RenderEntity 変換 |
| `src/rendering/GameCanvas.tsx` | Skia Canvas、エンティティスロット描画 |
| `src/engine/pool.ts` | オブジェクトプールユーティリティ |
| `src/engine/createGameEntities.ts` | 全エンティティプール初期化 |
| `app/game/[stageId]/index.tsx` | システム登録、ジェスチャー、HUD 接続 |
| `src/stores/gameSessionStore.ts` | セッション状態 (HP, スコア等) |
| `src/stores/saveDataStore.ts` | 永続状態 (ハイスコア, アンロック等) |
