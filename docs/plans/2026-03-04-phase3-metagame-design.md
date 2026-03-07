# Phase 3: メタゲーム — 設計ドキュメント

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** ステージセレクト、強化画面、設定画面、フォーム選択、リザルト画面の本番実装 + セーブ/ロード統合

**Approach:** レイヤー別積み上げ（Phase 1/2 と同一パターン）

---

## 背景

Phase 1 でゲームプレイ基盤、Phase 2 でゲームシステム拡充が完成。
Phase 3 ではメタゲーム層（画面遷移、経済、永続化）を実装し、ゲームとしてのリプレイ性を完成させる。

## 既存資産の活用

| 資産 | ファイル | 状態 |
|------|---------|------|
| セーブデータストア (全CRUD) | saveDataStore.ts | ✅ 完全実装 |
| クレジット定数 (雑魚1-3, クリア50, ボス150) | balance.ts | ✅ 定義済み |
| スコア計算 (getStageClearCredits) | scoring.ts | ✅ 実装済み |
| リザルト画面 (基本版) | result.tsx | ✅ スコア/クレジット表示あり |
| アップグレード関数 (ATK/HP/Speed) | saveDataStore.ts | ✅ upgradeAtk/Hp/Speed 実装済み |
| ステージ 1-5 定義 | stages/ | ✅ Phase 2 で作成済み |
| フォーム定義 (4種) | forms.ts | ✅ 定義済み |

## 新規実装

### 1. アップグレード定数 (src/game/upgrades.ts)

```typescript
export const UPGRADE_CONFIG = {
  atk:   { effect: 2, maxLevel: 10, costPerLevel: 100, label: 'ATK' },
  hp:    { effect: 10, maxLevel: 10, costPerLevel: 100, label: 'HP' },
  speed: { effect: 0.05, maxLevel: 5, costPerLevel: 100, label: 'Speed' },
} as const;

export const FORM_UNLOCK_CONDITIONS: Record<MechaFormId, FormUnlockCondition> = {
  SD_Standard: { type: 'initial' },
  SD_HeavyArtillery: { type: 'unlock', requiredStage: 3, cost: 500 },
  SD_HighSpeed: { type: 'unlock', requiredStage: 7, cost: 500 },
  SD_Awakened: { type: 'combo_only' },  // コンボでのみ発動
};
```

### 2. ストア拡張 — resetSession にアップグレードボーナス適用

- `resetSession(stageId, formId?)` に `formId` パラメータ追加
- `saveDataStore.upgrades` からボーナス計算: `hp += baseHp * 10`, `atk += baseAtk * 2`, `speed += baseSpeed * 0.05`
- 初期フォーム指定: `currentForm = formId ?? 'SD_Standard'`

### 3. アプリ起動時のセーブデータロード

- `app/_layout.tsx` で `useSaveDataStore.getState().load()` を `useEffect` で呼ぶ
- ロード完了まではスプラッシュ/ローディング表示

### 4. ステージセレクト画面 (app/stages/index.tsx)

- `saveDataStore.unlockedStages` からアンロック済みステージ一覧表示
- ステージ 1-5 を一覧表示（ロック/アンロック状態で表示分岐）
- ハイスコア表示 (`saveDataStore.highScores`)
- タップでフォーム選択画面 (`/stages/[id]/select-form`) へ遷移
- 強化画面へのリンク維持

### 5. フォーム選択画面 (app/stages/[id]/select-form.tsx)

- アンロック済みフォーム一覧表示 (`saveDataStore.unlockedForms`)
- フォームごとのステータス表示 (ATK%, Speed%, FireRate%, 特殊能力)
- ロック中フォームはアンロック条件表示 + 購入ボタン（条件満たす場合）
- 選択後 `/game/[stageId]?form=[formId]` へ遷移

### 6. 強化画面 (app/upgrade.tsx)

- 3つの強化項目 (ATK, HP, Speed) をカード形式で表示
- 各カード: 現在レベル / 最大レベル, 効果量, 次レベルのコスト, 強化ボタン
- クレジット残高表示
- 最大レベル到達時は "MAX" 表示
- クレジット不足時はボタン disabled

### 7. 設定画面 (app/settings.tsx)

- BGM ボリュームスライダー (0.0 〜 1.0)
- SE ボリュームスライダー (0.0 〜 1.0)
- 現在値のリアルタイム表示

### 8. リザルト画面拡張 (app/game/[stageId]/result.tsx)

- ボスステージ判定を追加 (`getStage(stageIdNum).isBossStage`)
- ボスステージ時のクレジット計算を正しく処理
- スコア内訳表示（将来拡張用の構造）

## 実装レイヤー順序

| レイヤー | 内容 |
|---------|------|
| L1: データ | アップグレード定数, フォームアンロック条件 |
| L2: ストア | resetSession 拡張 (formId + upgrade bonuses), _layout.tsx でロード |
| L3: 画面 | ステージセレクト, フォーム選択, 強化画面, 設定画面 |
| L4: 修正 | リザルト画面ボスステージ修正, ゲーム画面 form パラメータ対応 |
| L5: テスト | アップグレードロジック, アンロック条件, ストア統合 |

## スコープ外

- サウンド統合（BGM/SE ファイル追加）→ 別タスク
- 個別レンダラー（PlayerRenderer 等）→ 別タスク
- AppState でのバックグラウンド自動ポーズ → 別タスク
