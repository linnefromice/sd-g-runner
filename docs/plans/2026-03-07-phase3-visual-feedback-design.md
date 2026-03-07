# Phase 3: ビジュアルフィードバック — 設計ドキュメント

**Goal:** ゲームプレイのジューシーさを大幅に向上させる4つのビジュアルフィードバック機能を実装

**Scope:** ヒットストップ、画面揺れ、パーティクルエフェクト、スコアポップアップ

**Out of scope (Phase 4):** 機体ビジュアル刷新、変形アニメーション、ゲート通過演出（専用）、背景パララックス

---

## 背景

Phase 2 までにゲームロジック（6メカニクス、5+ステージ、4フォーム、ボス戦）が完成。
しかしビジュアルは全エンティティが単色矩形で、フィードバックが弱い。
プレイ体験への即効性が高い4項目を先行実装し、ゲームの「手触り」を改善する。

## 既存レンダリングアーキテクチャ

| 要素 | 現状 |
|------|------|
| 描画方式 | Skia Canvas + pre-allocated RoundedRect slots (128) |
| データフロー | Systems → entities mutation → SyncRenderSystem → SharedValue → Skia useDerivedValue |
| RenderEntity | `{ type, x, y, width, height, color, opacity, label }` |
| 背景 | フラット暗色 + 2本のスクロールライン |

---

## 1. ヒットストップ (Hit Stop)

### 概要

特定イベント発生時にゲームループを一時的にフリーズし、インパクトを強調する。
描画は最後のフレームを維持（システム更新のみスキップ）。

### トリガーと強度

| トリガー | 停止時間 |
|---------|---------|
| 敵撃破 | 50ms |
| プレイヤー被弾 | 50ms |
| パリィ成功 | 50ms |
| ボス撃破 | 150ms |

### 実装方針

- `GameEntities` に `hitStopTimer: number` 追加
- `useGameLoop` 内でタイマーチェック — 0 より大きければシステム実行をスキップし、タイマーだけ減算
- 各トリガー箇所（CollisionSystem 等）で `entities.hitStopTimer = duration` をセット

---

## 2. 画面揺れ (Screen Shake)

### 概要

Canvas 全体にランダムオフセットを適用し、衝撃を視覚化する。

### トリガーと強度

| トリガー | 振幅 | 持続 |
|---------|------|------|
| 敵撃破 | 2px | 100ms |
| プレイヤー被弾 | 4px | 150ms |
| パリィ成功 | 4px | 150ms |
| ボス撃破 | 8px | 300ms |

### 実装方針

- `GameEntities` に `shakeTimer`, `shakeIntensity`, `shakeOffsetX`, `shakeOffsetY` 追加
- `ScreenShakeSystem` が毎フレーム offset をランダム計算（タイマー経過でフェードアウト）
- `GameCanvas` が SharedValue 経由で offset を受け取り、Canvas 全体を translate

---

## 3. パーティクルエフェクト

### 概要

各種ゲームイベントで小さな矩形パーティクルを飛散させ、視覚的なフィードバックを提供する。

### パーティクル仕様

```typescript
interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
}
```

### トリガーと設定

| トリガー | 数 | 色 | 寿命 | 挙動 |
|---------|------|------|------|------|
| 敵撃破 | 6-8 | 赤系 (#FF4444) | 400ms | 放射状飛散 |
| プレイヤー被弾 | 4-6 | 白/青 (#4488FF) | 300ms | プレイヤー位置から飛散 |
| ゲート通過 | 4 | ゲート色 | 300ms | 左右に広がる |
| EX Burst | 8-10 | シアン (#00E5FF) | 500ms | 上方向に飛散 |
| パリィ成功 | 8 | 白 (#FFFFFF) | 400ms | 円形放射 |
| ボス撃破 | 16 | 赤+オレンジ | 600ms | 大爆発（大サイズ） |

### プール設計

- `MAX_PARTICLES = 64`
- エンティティプールパターン（既存の enemies/bullets と同一設計）
- 通常使用量: 20-30、最悪ケース: 40未満

### システム

- `ParticleSystem`: 毎フレーム位置更新（vx/vy）、寿命管理、画面外非アクティブ化
- `SyncRenderSystem`: 小さな矩形として描画（opacity は life/maxLife でフェードアウト）

---

## 4. スコアポップアップ

### 概要

スコア獲得時に、発生位置からスコア文字が浮き上がってフェードアウトする（アーケードゲーム風）。

### ポップアップ仕様

```typescript
interface ScorePopupEntity {
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  active: boolean;
}
```

### トリガーと設定

| トリガー | テキスト | 色 |
|---------|---------|------|
| 敵撃破 | "+{score}" | 黄色 (#FFD600) |
| グレイズ | "+20" | シアン (#00E5FF) |
| パリィ | "+300" | 白 (#FFFFFF) |
| デブリ破壊 | "+50" | 緑 (#00FF88) |

### プール設計

- `MAX_SCORE_POPUPS = 16`
- 浮き上がり速度: -40px/s (上方向)
- 寿命: 800ms
- フェードアウト: 後半 50% でフェード

### GameCanvas 拡張

- `RenderEntity` に `text?: string`, `fontSize?: number` フィールド追加
- `type === 'scorePopup'` の場合、`RoundedRect` の代わりに Skia `Text` で描画
- 新しい `TextSlot` コンポーネントを `EntitySlot` と並列に配置

---

## アーキテクチャ変更サマリ

### GameEntities 新フィールド

```
hitStopTimer: number
shakeTimer: number
shakeIntensity: number
shakeOffsetX: number
shakeOffsetY: number
particles: ParticleEntity[]
scorePopups: ScorePopupEntity[]
```

### 新システム

| システム | 責務 |
|---------|------|
| ScreenShakeSystem | shakeTimer → offset 計算（フェードアウト付き） |
| ParticleSystem | パーティクル位置更新 + 寿命管理 |

### 変更対象システム

| システム | 変更内容 |
|---------|---------|
| useGameLoop | hitStop 中のシステムスキップ |
| CollisionSystem | 撃破/被弾時に hitStop + shake + particle + popup 発火 |
| GateSystem | ゲート通過時に particle 発火 |
| EXBurstSystem | EX 発動時に particle 発火 |
| SyncRenderSystem | particle/popup 描画追加 |
| GameCanvas | shake offset 適用 + Text 描画スロット追加 |
| createGameEntities | 新プール初期化 |

### パフォーマンス考慮

- パーティクル 64 + スコアポップアップ 16 = 最大80エンティティ追加
- 既存128スロット + 80 = 208 → MAX_VISIBLE_ENTITIES を 256 に拡張
- パーティクルは小さな矩形で Shadow なし（軽量）
- ヒットストップ中はシステム更新スキップ → CPU 負荷ゼロのフレーム

---

## スコープ外

- サウンドエフェクト連動 → 別タスク
- スプライト/アニメーションシート → Phase 4
- 背景パララックス → Phase 4
- 変形アニメーション → Phase 4
