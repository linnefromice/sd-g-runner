# Project G-Runner 実装チェックリスト

> 要件定義書: `docs/v1/REQUIREMENTS-r3.md` (v3.1) に基づく
> 最終更新: 2026-03-03 (PR #2 反映)

---

## 凡例

- [ ] 未着手
- [x] 完了
- 各項目の末尾 `§N` は要件定義書のセクション番号

---

## 0. プロジェクト基盤

- [x] Expo + expo-router セットアップ (§2)
- [x] 依存パッケージ導入 — Skia, Reanimated, Zustand, expo-av, AsyncStorage, GestureHandler
- [x] Babel 設定 (Reanimated plugin)
- [x] TypeScript / ESLint 設定
- [x] ディレクトリ構造スキャフォールド (§19)
- [x] expo-router 全画面プレースホルダー作成 (§15.2)

### スパイク検証 (PR #1)

- [x] `useGameLoop` — rAF ベース 60fps ループ (§22.1)
- [x] `GameCanvas` — Skia Canvas + SharedValue 描画パターン検証 (§22.1)
- [x] Zustand ブリッジ — Systems → Store のイベント駆動更新 (§22.3)
- [x] ジェスチャー入力統合 (GestureDetector + GameLoop)
- [x] 50 エンティティ同時描画パフォーマンス確認 (§22.2)

---

## Phase 1: コアメカニクス (§20)

### 1-1. 型定義・定数 (§21, §3)

- [x] `src/types/entities.ts` — `EntityType`, `BaseEntity`, `PlayerEntity`, `EnemyEntity`, `BulletEntity`, `GateEntity`, `BossEntity`, `GameEntities`
- [x] `src/types/forms.ts` — `MechaFormId`, `MechaFormDefinition`, `SpecialAbilityType`
- [x] `src/types/gates.ts` — `GateType`, `GateDefinition`, `GateEffect`, `GatePairConfig`, `StatKey`
- [x] `src/types/enemies.ts` — `EnemyType`, `EnemyDefinition`, `BossAttackPattern`, `MovePattern`
- [x] `src/types/stages.ts` — `StageDefinition`, `StageEvent`, `DifficultyParams`
- [x] `src/types/index.ts` — 全型のバレルエクスポート
- [x] `src/constants/dimensions.ts` — 論理座標 (X: 0-320)、スケール計算、移動可能領域 (§3.1)
- [x] `src/constants/colors.ts` — カラーパレット定義 (§17.1)
- [x] `src/constants/balance.ts` — ダメージ値、HP、ヒットボックスサイズ等 (§6, §3.2)

### 1-2. データ定義 (§8, §18)

- [x] `src/game/forms.ts` — 4フォームの定義データ (SD_Standard, HeavyArtillery, HighSpeed, Awakened)
- [x] `src/game/difficulty.ts` — 難易度スケーリング計算式 (§7.2)
- [x] `src/game/scoring.ts` — スコア加算ルール (§12.1)
- [x] `src/game/stages/stage1.ts` — ステージ1 タイムラインデータ (§18)
- [x] `src/game/stages/index.ts` — ステージレジストリ

### 1-3. エンジン — エンティティ定義

- [x] `src/engine/entities/Player.ts` — プレイヤーエンティティ生成 (ヒットボックス 16x16) (§3.2)
- [x] `src/engine/entities/Enemy.ts` — 敵エンティティ生成 (固定砲台型: HP20, 28x28) (§13.1)
- [x] `src/engine/entities/Bullet.ts` — 弾エンティティ生成 (プレイヤー弾 4x12, 敵弾 6x6) (§3.2)
- [x] `src/engine/entities/Gate.ts` — ゲートエンティティ生成 (140x24) (§3.2, §9)
- [x] `src/engine/entities/Boss.ts` — ボスエンティティ生成 (200x120) (§3.2, §13.2)
- [x] `src/engine/collision.ts` — AABB 衝突判定ユーティリティ (§2)
- [x] `src/engine/createGameEntities.ts` — エンティティプール初期化

### 1-4. エンジン — システム

- [x] `ScrollSystem.ts` — 背景縦スクロール + ボスフェーズ減速 (0.5x) (§4.4, §13.2)
- [x] `MovementSystem.ts` — プレイヤー移動 (画面下半分制限, X:16-304) (§3.1, §5)
- [x] `ShootingSystem.ts` — 自動射撃 (フォーム別弾種) (§5, §8.1)
- [x] `EnemyAISystem.ts` — 固定砲台: 静止+前方射撃 (2.0秒間隔) (§13.1)
- [x] `CollisionSystem.ts` — 弾↔敵, 弾↔プレイヤー, プレイヤー↔敵, プレイヤー↔ゲート (§6)
- [x] `SpawnSystem.ts` — タイムラインベースの敵/ゲートスポーン (§18)
- [x] `IFrameSystem.ts` — 1.5秒無敵 + 点滅 (0.1秒間隔, 透明度 0.3↔1.0) (§6.3)
- [x] `GateSystem.ts` — ゲート効果適用 — 換装 (フォーム変更) + 強化 (ステータスUP) (§9.1)
- [x] `GameOverSystem.ts` — HP 0 → リザルト画面遷移 (§4.3)
- [x] `SyncRenderSystem.ts` — エンティティ→SharedValue 同期

### 1-5. エンジン — ボス戦 (§13.2)

- [x] `BossSystem.ts` — ボスAI (ホバリング: 振幅30, 周期3秒)
- [x] ボスフェーズ切替 — スクロール減速, 敵/ゲートスポーン停止
- [x] 拡散弾パターン — 扇状5発 (HP 100%〜)
- [ ] レーザーパターン — 予告線1秒 + 直線ビーム (HP 50%〜) ← TODO placeholder
- [x] ドローン召喚パターン — 小型ユニット3体 (HP 25%〜)
- [x] ボスHP計算 — `500 × (1 + (bossIndex - 1) * 0.5)` (§7.3)
- [x] ボス撃破 → ステージクリア遷移

### 1-6. レンダリング (Skia)

- [x] `GameCanvas.tsx` — 128スロット + Shadow グロー + スクロール線 (エンティティタイプ別カラー)
- [ ] `PlayerRenderer` — フォーム別ビジュアル (§17.2) ← 現状は RoundedRect + カラーのみ
- [ ] `EnemyRenderer` — 敵描画 (SDスタイル)
- [ ] `BulletRenderer` — 弾描画 (プレイヤー弾 / 敵弾)
- [ ] `GateRenderer` — ゲート描画 + ラベル表示
- [ ] `BossRenderer` — ボス描画 (リアルスタイル)
- [ ] `BackgroundRenderer` — 背景スクロール描画 ← 現状はスクロール線のみ
- [ ] `EffectRenderer` — 爆発、バーニア等の Skia エフェクト (§17.2)
- [x] 被弾点滅エフェクト (透明度 0.3↔1.0, 0.1秒間隔) (§6.3) — SyncRenderSystem で実装

### 1-7. ストア (Zustand)

- [x] `gameSessionStore.ts` — 全フィールド実装 (§21 GameSession 型準拠)
  - [x] `currentForm`, `previousForm`, `atk`, `speed`, `fireRate`
  - [x] `isInvincible`
  - [x] `comboCount`, `exGauge`, `isAwakened`, `awakenedTimer`
  - [x] `currentStageId`, `isPaused`
  - [x] `credits`
- [x] `saveDataStore.ts` — 永続データ (§14.5) + AsyncStorage 連携

### 1-8. UI / HUD (§15.1)

- [x] `HUD.tsx` — レイアウト統合 (ポーズ, HP, スコア, コンボ, EX, フォーム)
- [x] HPBar — 本番仕様 (ネオンカラー対応)
- [x] ポーズボタン (画面左上) + ポーズ機能 (§5)
- [x] フォームアイコン表示 (画面左下)
- [x] スコア表示 (画面右上)
- [x] コンボゲージ (3セグメント + AWAKENED 表示)
- [x] EXゲージバー + EXボタン

### 1-9. 画面 (expo-router) (§15.2)

- [x] `app/game/[stageId]/index.tsx` — 本番ゲーム画面 (全システム統合 + ジェスチャー入力)
- [x] `app/game/[stageId]/result.tsx` — リザルト画面 (スコア, クレジット, クリア/ゲームオーバー分岐)
- [ ] バックグラウンド遷移時の自動ポーズ (§5)

### 1-10. サウンド (§16)

- [x] `AudioManager.ts` — BGM/SE 管理フレームワーク (expo-av) ← メソッドは placeholder
- [ ] 通常ステージBGM (ループ再生) — 音声ファイル未追加
- [ ] ボスステージBGM — 音声ファイル未追加
- [ ] SE: 射撃, 敵撃破, ゲート通過, 換装, ダメージ, 被弾 — 音声ファイル未追加

### 1-11. スコアリング (§12)

- [x] 雑魚撃破 100pt (巡回型 200pt)
- [x] ゲート通過 150pt
- [x] ステージクリアボーナス 1000pt
- [x] ボスステージクリアボーナス 3000pt
- [x] ボスダメージ (HP 1%あたり 50pt)

### 1-12. テスト

- [x] `src/constants/__tests__/dimensions.test.ts` — getScreenMetrics (3 tests)
- [x] `src/game/__tests__/difficulty.test.ts` — 難易度スケーリング + ボスHP (7 tests)
- [x] `src/game/__tests__/scoring.test.ts` — スコア/クレジット計算 (6 tests)
- [x] `src/engine/__tests__/collision.test.ts` — AABB 衝突判定 (5 tests)

---

## Phase 2: ゲームシステム拡充 (§20)

### 2-1. コンボ・覚醒システム (§10)

- [ ] コンボカウント管理 — 強化ゲート +1, 回復ゲート 維持, トレードオフ/換装/被弾 リセット (§10.2)
- [ ] 3セグメントゲージ UI (§10.3)
- [ ] セグメント点灯エフェクト — ネオングリーン発光 + パルス 0.3秒
- [ ] コンボリセットエフェクト — ネオンレッド + 砕散 0.5秒
- [ ] Awakened 形態発動 — 3連続で白フラッシュ → 変形 (§10.1)
- [ ] Awakened 持続管理 — 10秒タイマー, 残り3秒で点滅警告
- [ ] 覚醒中のゲージ → タイマーバー差し替え

### 2-2. EXバーストシステム (§11)

- [ ] EXゲージ蓄積 — 雑魚撃破 +5, ゲート +10, ボスヒット +2
- [ ] EXボタン (画面右下) — ゲージ100%でアクティブ化
- [ ] EXバースト発動 — 全敵一斉射撃 (ファンネル演出)
- [ ] EXゲージバー UI

### 2-3. 追加ゲートタイプ (§9)

- [ ] 回復ゲート — HP +20, HP +30% (§9.1)
- [ ] トレードオフゲート — ATK +50 / Speed -20% 等 (§9.1)
- [ ] 回避可能型レイアウト — 隙間あり配置 (§9.3)

### 2-4. 追加敵タイプ (§13.1)

- [ ] 巡回型 — 左右往復 + 射撃 (HP 40, 攻撃間隔 1.5秒)
- [ ] 巡回型スコア — 200pt (固定砲台の2倍) (§12.1)

### 2-5. 難易度カーブ (§7)

- [ ] ステージ進行に応じた敵パラメータスケーリング (§7.1, §7.2)
- [ ] ステージ2以降のタイムラインデータ作成
- [ ] ボスステージ (ステージ5) のデータ作成

---

## Phase 3: メタゲーム (§20)

### 3-1. ステージセレクト画面 (§15.2)

- [ ] `app/stages/index.tsx` — ステージ一覧 + ハイスコア表示
- [ ] アンロック状態の表示 (未到達ステージはロック)

### 3-2. リザルト画面 (§15.2)

- [ ] スコア内訳表示
- [ ] 獲得クレジット表示
- [ ] リプレイボタン
- [ ] 次ステージ / ステージセレクト遷移

### 3-3. クレジット経済 (§14)

- [ ] クレジット獲得 — 雑魚 1-3 Cr, ステージクリア 50 Cr, ボスクリア 150 Cr (§14.2)
- [ ] `app/upgrade.tsx` — 強化画面 UI
- [ ] 基礎ATK強化 — +2/Lv, コスト 100Cr×Lv, 最大Lv10 (§14.3)
- [ ] 基礎HP強化 — +10/Lv, コスト 100Cr×Lv, 最大Lv10
- [ ] 基礎Speed強化 — +0.05/Lv, コスト 100Cr×Lv, 最大Lv5

### 3-4. フォームアンロック (§14.4)

- [ ] SD_Standard — 初期解放
- [ ] SD_HeavyArtillery — ステージ3クリア + 500 Cr
- [ ] SD_HighSpeed — ステージ7クリア + 500 Cr
- [ ] `app/stages/[id]/select-form.tsx` — フォーム選択 UI (アンロック済みのみ選択可)

### 3-5. セーブ/ロード (§14.5)

- [ ] AsyncStorage 永続化 — ハイスコア, アンロック, クレジット, 強化レベル
- [ ] アプリ起動時のデータ復元
- [ ] `app/settings.tsx` — 音量設定 (BGM/SE 0.0-1.0) + 保存

---

## 横断的な品質基準 (§22.2)

- [ ] 60fps 安定 (iPhone SE 2nd gen)
- [ ] 50+ 同時エンティティ描画
- [ ] タッチ入力遅延 ≤ 33ms (2フレーム)
- [ ] システム更新 ≤ 16ms / フレーム
