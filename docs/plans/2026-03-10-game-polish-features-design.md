# Game Polish & Features Pack Design

## Goal

ゲーム体験を全面的に向上させる改善パッケージ。オーディオ配線、ハプティクス、演出強化、ボスビジュアル差別化、実績システム、エンドレスモード、ミニボス、UI改善を含む。

## Architecture

既存のデータ駆動アーキテクチャ・ECSパターン・Zustand永続化を活用。新システムは最小限（EndlessWaveGenerator のみ）、他は既存システムへの拡張で実装。

## Content

### 1. Audio Wiring（SE/BGM呼び出し接続）

AudioManager の `playSe()` / `playBgm()` を全ゲームイベントに接続。音声ファイル追加時に即動作する状態にする。

| イベント | SE ID | 呼び出し箇所 |
|---------|-------|-------------|
| プレイヤー射撃 | `shoot` | ShootingSystem |
| 敵撃破 | `enemyDestroy` | CollisionSystem |
| ゲート通過 | `gatePass` | GateSystem |
| リフィット | `refit` | GateSystem |
| 被ダメージ | `damage` | CollisionSystem |
| EX発動 | `exBurst` | EXSystem |
| ボス登場 | `bossAppear` | BossSystem（新SE ID） |
| 覚醒発動 | `awaken` | ComboSystem（新SE ID） |
| ステージBGM | `stage` | ゲーム画面マウント時 |
| ボスBGM | `boss` | BossPhaseSystem フェーズ切替時 |

### 2. Haptics（振動フィードバック）

`expo-haptics` を追加し、主要ゲームイベントで振動を発生。

| イベント | 振動タイプ | 強度 |
|---------|-----------|------|
| 被ダメージ | `notificationAsync(Error)` | 強 |
| 敵撃破 | `impactAsync(Light)` | 弱 |
| ゲート通過 | `impactAsync(Medium)` | 中 |
| EX発動 | `notificationAsync(Success)` | 強 |
| 覚醒 | `notificationAsync(Warning)` | 強 |
| ボス撃破 | `notificationAsync(Success)` | 強 |

Settings に「ハプティクス ON/OFF」トグルを追加。SaveData に `hapticsEnabled: boolean` を追加。

### 3. Visual Key Moments（演出強化）

#### 3a. ボス登場演出
- ボススポーン時に画面全体を暗転（0.5s）→ 警告テキスト表示（1s）→ 暗転解除
- SyncRenderSystem に `bossEntranceOpacity` overlay 追加
- gameSessionStore に `bossEntrance` state 追加

#### 3b. 覚醒バースト強化
- 覚醒発動時: 放射状パーティクル20個 + 0.3s スローモーション
- ParticleSystem にバーストパターン追加
- GameLoop の deltaTime に一時的なスローファクター

#### 3c. EX Burst 強化
- 既存シアンフラッシュに加え、円形拡大シャープウェーブ + 画面シェイク(intensity: 4)
- 既存 shockwave エフェクト流用

### 4. Boss Visual Differentiation（ボス外見差別化）

| Boss | 形状 | テーマカラー |
|------|------|-------------|
| Boss 1 (Core Breach) | 六角形（既存） | 赤系 |
| Boss 2 (Omega Core) | 八角形 + 4つの突起 | 紫系 |
| Boss 3 (Terminus Core) | 菱形 + 回転リング | 金系 |

shapes.ts に `boss2Path`, `boss3Path` を追加。SyncRenderSystem で `bossIndex` に基づいてパス選択。

### 5. Achievement System（実績システム）

#### データ定義
```typescript
type AchievementId =
  | 'first_clear' | 'all_forms' | 'all_stages'
  | 'no_damage_clear' | 'boss_slayer' | 'credit_hoarder'
  | 'combo_master' | 'speed_demon' | 'guardian_angel'
  | 'endless_survivor';
```

#### 実績一覧（10個）
| ID | 条件 | 報酬 |
|----|------|------|
| first_clear | Stage 1 クリア | 100 Cr |
| boss_slayer | ボスステージ初クリア | 300 Cr |
| all_forms | 全フォーム解放 | 500 Cr |
| all_stages | 全15ステージクリア | 1000 Cr |
| no_damage_clear | ノーダメージクリア(任意ステージ) | 500 Cr |
| combo_master | 覚醒フォーム発動 | 200 Cr |
| credit_hoarder | 累計5000 Cr獲得 | 300 Cr |
| speed_demon | スピードクリアボーナス獲得 | 200 Cr |
| guardian_angel | SD_Guardian でクリア | 200 Cr |
| endless_survivor | エンドレスモードで5分生存 | 500 Cr |

#### UI
- `app/achievements.tsx` — 新画面
- ステージ選択画面のフッターにボタン追加
- saveDataStore に `achievements: AchievementId[]` を追加

### 6. Endless Mode（エンドレスモード）

- 全15ステージクリア後にアンロック
- 手続き生成: 30秒ごとにウェーブ生成。敵タイプ・配置をランダム選択
- 難易度は時間経過で無限にスケール
- ボスなし。ゲートは60秒ごとにランダムペア出現
- 死亡で終了。生存時間とスコアを記録

#### 技術設計
- `src/game/stages/endless.ts` に `generateEndlessWave(waveNumber)` 関数
- SpawnSystem に `isEndless` フラグ分岐
- saveDataStore に `endlessBestTime`, `endlessBestScore` を追加

### 7. Mini-Boss Enemies（+2タイプ）

| タイプ | HP | ATK | Score | Credits | 行動パターン |
|--------|-----|------|-------|---------|-------------|
| sentinel | 120 | 15 | 600 | 7 | 画面上部固定。3方向弾を周期的に発射。被ダメ50%減シールド |
| carrier | 100 | 0 | 500 | 6 | 移動しながら5秒ごとにpatrol×2を射出。本体は攻撃しない |

Stage 8, 9, 12, 14 のタイムラインに配置。

### 8. Quick Restart Enhancement

リザルト画面の Replay ボタン: 長押し(0.5s)でフォーム選択なしの即リスタート（前回と同じフォーム）。

### 9. Gate Visual Enhancement

- Forced ゲート: アクセントバーに加え、上下に点滅する矢印マーカー
- ゲートロックイン演出: プレイヤーが左右確定時に白フラッシュ + パーティクル散布

## Files to Modify

| Category | Files | Action |
|----------|-------|--------|
| Types | `src/types/enemies.ts` | Add sentinel, carrier to EnemyType |
| Types | `src/types/achievements.ts` (NEW) | Achievement type definitions |
| Balance | `src/constants/balance.ts` | Add mini-boss stats, haptics/visual constants |
| Colors | `src/constants/colors.ts` | Add boss theme colors, mini-boss colors |
| Dimensions | `src/constants/dimensions.ts` | Add mini-boss hitboxes |
| Audio | `src/audio/AudioManager.ts` | Add bossAppear, awaken SE IDs |
| Audio | `src/audio/HapticsManager.ts` (NEW) | Haptics wrapper with settings check |
| Achievements | `src/game/achievements.ts` (NEW) | Achievement definitions + check logic |
| Enemies | `src/game/enemies.ts` | Add sentinel, carrier definitions |
| Stages | `src/game/stages/endless.ts` (NEW) | Endless wave generator |
| Stages | `src/game/stages/stage8.ts` | Add mini-boss spawns |
| Stages | `src/game/stages/stage9.ts` | Add mini-boss spawns |
| Stages | `src/game/stages/stage12.ts` | Add mini-boss spawns |
| Stages | `src/game/stages/stage14.ts` | Add mini-boss spawns |
| Stages | `src/game/stages/index.ts` | Register endless mode |
| Rendering | `src/rendering/shapes.ts` | Add boss2Path, boss3Path |
| Engine | `src/engine/systems/ShootingSystem.ts` | Add playSe('shoot') |
| Engine | `src/engine/systems/CollisionSystem.ts` | Add playSe('enemyDestroy','damage'), haptics |
| Engine | `src/engine/systems/GateSystem.ts` | Add playSe('gatePass','refit'), haptics |
| Engine | `src/engine/systems/EXSystem.ts` | Add playSe('exBurst'), haptics, shockwave |
| Engine | `src/engine/systems/BossSystem.ts` | Add playSe('bossAppear'), boss entrance state |
| Engine | `src/engine/systems/ComboSystem.ts` | Add playSe('awaken'), haptics, slow-mo |
| Engine | `src/engine/systems/EnemyAISystem.ts` | Add sentinel/carrier AI |
| Engine | `src/engine/systems/SpawnSystem.ts` | Add endless mode wave generation |
| Engine | `src/engine/systems/SyncRenderSystem.ts` | Boss shapes, gate forced markers, boss entrance overlay |
| Engine | `src/engine/systems/ParticleSystem.ts` | Radial burst pattern for awakening |
| Engine | `src/engine/entities/Enemy.ts` | Add sentinel/carrier hitboxes |
| Stores | `src/stores/saveDataStore.ts` | Add achievements, endlessBest*, hapticsEnabled |
| Stores | `src/stores/gameSessionStore.ts` | Add bossEntrance, slowMotionFactor |
| UI | `app/achievements.tsx` (NEW) | Achievement list screen |
| UI | `app/stages/index.tsx` | Add endless mode card, achievements button |
| UI | `app/game/[stageId]/result.tsx` | Quick restart, achievement check |
| UI | `app/settings.tsx` | Haptics toggle |
| i18n | `src/i18n/locales/en.ts` | All new strings |
| i18n | `src/i18n/locales/ja.ts` | All new strings |
