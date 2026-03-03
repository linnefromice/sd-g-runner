# 要件定義書 v3.1：Project G-Runner (Tactical SD Refit Action)

## 1. プロジェクト概要

| 項目 | 内容 |
|---|---|
| **タイトル** | Project G-Runner |
| **ジャンル** | ハイパーカジュアル・SFゲートランナー（2D縦スクロール） |
| **プラットフォーム** | React Native (iOS / Android) |
| **ビジュアルコンセプト** | 「SDメカ × リアルボス」 |

---

## 2. 技術スタック

| レイヤー | 技術 | 備考 |
|---|---|---|
| フレームワーク | Expo (Managed Workflow) | |
| ルーティング | `expo-router` | ファイルベースルーティング |
| ゲームループ / ECS | `react-native-game-engine` | 60fps 更新ループ + エンティティ管理 |
| レンダリング | `@shopify/react-native-skia` | ネオングロー・パーティクル等のSFエフェクト |
| 衝突判定 | 自前 AABB (Axis-Aligned Bounding Box) | matter-js は不使用 |
| 状態管理 | `zustand` | ゲームセッション・永続状態両方 |
| サウンド | `expo-av` | BGM + SE |
| 永続化 | `AsyncStorage` | ハイスコア、アンロック状況、通貨 |

### 対象デバイス

| プラットフォーム | 最低ライン |
|---|---|
| iOS | iPhone SE 2nd gen 以上 |
| Android | 最新 OS |

---

## 3. ゲーム座標系

### 3.1 論理座標

画面サイズに依存しない**論理座標系**を使用する。

| 軸 | 範囲 | 説明 |
|---|---|---|
| X | `0` 〜 `320` | 横幅固定。画面左端=0、右端=320 |
| Y | `0` 〜 `動的` | 画面上端=0。アスペクト比に応じて下端が決まる |

- 実デバイスの画面幅に対して `scale = screenWidth / 320` で統一スケール
- Y方向の可視範囲: `visibleHeight = screenHeight / scale`
- **プレイヤー移動可能領域:** X: `16` 〜 `304`（左右マージン16）、Y: `visibleHeight * 0.5` 〜 `visibleHeight - 48`（画面下半分）

### 3.2 ヒットボックス

| エンティティ | 論理サイズ (W×H) | ヒットボックス | 備考 |
|---|---|---|---|
| プレイヤー | 32×40 | 16×16（中心） | 見た目より小さく、被弾の理不尽感を軽減 |
| プレイヤー弾 | 4×12 | 4×12（全体） | |
| 敵（雑魚） | 28×28 | 28×28（全体） | |
| 敵弾 | 6×6 | 6×6（全体） | |
| ゲート | 140×24 | 140×24（全体） | 左右に2つ配置（隙間40） |
| ボス | 200×120 | 200×120（全体） | |

---

## 4. ゲームフロー

### 4.1 画面遷移図

```
[タイトル画面]
    │
    ├─→ [ステージセレクト]
    │       │
    │       ├─→ [フォーム選択画面]
    │       │       │
    │       │       └─→ [ゲーム画面]
    │       │               │
    │       │               ├─→ [リザルト画面（クリア）]
    │       │               │       ├─→ [ステージセレクト]（次へ）
    │       │               │       └─→ [リプレイ]
    │       │               │
    │       │               └─→ [リザルト画面（ゲームオーバー）]
    │       │                       └─→ [ステージセレクト]
    │       │
    │       └─→ [強化画面]
    │
    └─→ [設定画面]（音量等）
```

### 4.2 ステージ構成

- **固定ステージ制**（ステージ 1, 2, 3, ...）
- **通常ステージ:** 1〜2分で完走
- **ボスステージ:** 5ステージに1回出現（ステージ5, 10, 15...）、約3分
- ステージクリア → リザルト画面 → ステージセレクトへ戻る

### 4.3 ゲームオーバー

- **条件:** HP が 0 になる
- **復帰:** リザルト画面（ゲームオーバー） → ステージセレクトへ戻る

### 4.4 基本ゲームプレイループ

```
ステージ開始
  → 縦スクロール自動進行
  → 敵出現 & 自動射撃で撃破
  → ゲート選択（左右に分岐 or 通過/回避）
  → ボスステージの場合：ボス戦（縦スクロール継続）
  → ステージクリア → リザルト
```

---

## 5. プレイヤー操作

| 操作 | 方式 | 詳細 |
|---|---|---|
| **移動** | スワイプ（フリー移動） | 画面内を自由に左右移動。上下は画面下半分に制限 |
| **攻撃** | 自動射撃 | 常時前方（上方向）に射撃。フォームにより弾の種類が変化 |
| **EXバースト** | タップ（画面右下ボタン） | ゲージ100%時にアクティブ化 |
| **ゲート選択** | 移動で通過 | 通りたいゲート側に移動するだけ |
| **ポーズ** | 画面左上ボタン | ゲーム一時停止。バックグラウンド遷移時も自動ポーズ |

---

## 6. ダメージモデル

### 6.1 基本数値

| パラメータ | 値 | 備考 |
|---|---|---|
| プレイヤー初期HP | 100 | 恒久強化で増加可能 |
| プレイヤー初期ATK | 10 | 基礎ダメージ |
| プレイヤー初期Speed | 1.0 (100%) | 移動速度倍率 |
| プレイヤー初期FireRate | 1.0 (100%) | 発射レート倍率 |

### 6.2 被ダメージ

| ダメージ源 | ダメージ量 | 備考 |
|---|---|---|
| 雑魚敵の弾 | 10〜15 | ステージ進行で増加 |
| 雑魚敵との衝突 | 15〜20 | |
| ボスの拡散弾 | 15 | 1発あたり |
| ボスのレーザー | 30 | 持続ダメージではなく接触1回 |
| ボスのドローン弾 | 10 | 道中の雑魚と同等 |
| ボスとの衝突 | 50 | 即接近は非常に危険 |

### 6.3 被弾時の無敵時間（i-frame）

- **持続時間:** 1.5秒
- **演出:** プレイヤー機体が点滅（0.1秒間隔で透明度 0.3 ↔ 1.0）
- **仕様:** 無敵時間中はすべてのダメージを無効化。移動・攻撃は通常通り可能

---

## 7. 難易度カーブ

### 7.1 ステージ進行による変化

| パラメータ | ステージ1 | ステージ3 | ステージ5(ボス) | ステージ10(ボス) |
|---|---|---|---|---|
| スクロール速度 | 1.0x | 1.1x | 1.2x | 1.5x |
| 敵出現間隔 | 3.0秒 | 2.5秒 | 2.0秒 | 1.5秒 |
| 敵HP倍率 | 1.0x | 1.2x | 1.5x | 2.0x |
| 敵ATK倍率 | 1.0x | 1.1x | 1.3x | 1.6x |
| ゲート出現頻度 | 高（強化多め） | 中 | 中（トレードオフ増） | 低（トレードオフ中心） |
| 同時出現敵数上限 | 2 | 3 | 4 | 5 |

### 7.2 難易度スケーリング計算式

```typescript
// ステージIDに基づくスケーリング
interface DifficultyParams {
  scrollSpeedMultiplier: number;  // 1.0 + (stageId - 1) * 0.05
  enemySpawnInterval: number;     // max(1.5, 3.0 - (stageId - 1) * 0.15)
  enemyHpMultiplier: number;      // 1.0 + (stageId - 1) * 0.1
  enemyAtkMultiplier: number;     // 1.0 + (stageId - 1) * 0.06
  maxConcurrentEnemies: number;   // min(6, 2 + floor(stageId / 2))
}
```

### 7.3 ボスステージの追加仕様

- ボスHP: `500 × (1 + (bossIndex - 1) * 0.5)` （bossIndex: 1回目=1, 2回目=2, ...）
- ボス攻撃パターン切替: HP残量に応じて `100%→拡散弾中心` → `50%→レーザー追加` → `25%→全パターン同時`

---

## 8. フォーム（機体形態）システム

### 8.1 フォーム一覧

フォームは拡張可能な設計とし、初期リリースでは以下の4種を実装する。

| フォーム | タイプ | 移動速度 | 攻撃力 | 発射レート | 特殊能力 |
|---|---|---|---|---|---|
| **SD_Standard** | バランス型 | 100% | 100% | 100% | なし |
| **SD_HeavyArtillery** | 重火力型 | 80% | 180% | 60% | 弾に爆発範囲（範囲攻撃） |
| **SD_HighSpeed** | 高速型 | 140% | 70% | 150% | 弾が敵を貫通 |
| **SD_Awakened** | 覚醒型（時限） | 120% | 200% | 130% | 敵衝突無敵 + ホーミング弾 |

### 8.2 フォーム切替ルール

- **換装ゲート通過**により `Standard ↔ HeavyArtillery ↔ HighSpeed` を切り替え
- **Awakened** はコンボシステムでのみ発動（後述）
- 換装時に **HP・ゲージはリセットされない**（維持される）

### 8.3 フォーム拡張方針

将来的にフォームを追加する場合は、以下の型定義を拡張する。

```typescript
type MechaFormId = 'SD_Standard' | 'SD_HeavyArtillery' | 'SD_HighSpeed' | 'SD_Awakened';
// | 'SD_Sniper' | 'SD_Shield' など将来追加

interface MechaFormDefinition {
  id: MechaFormId;
  displayName: string;
  moveSpeedMultiplier: number;    // 1.0 = 100%
  attackMultiplier: number;       // 1.0 = 100%
  fireRateMultiplier: number;     // 1.0 = 100%
  specialAbility: SpecialAbilityType;
  isTimeLimited: boolean;         // Awakened のみ true
  spriteConfig: SpriteConfig;
  bulletConfig: BulletConfig;
}
```

---

## 9. ゲートシステム

### 9.1 ゲート種別

| ゲート種別 | 内容 | 効果の例 |
|---|---|---|
| **強化ゲート** | 純粋なステータスUP | `ATK +10`, `FireRate x1.2` |
| **換装(変形)ゲート** | 武装と外見（SDモデル）の総入れ替え | `Standard → HeavyArtillery` |
| **トレードオフゲート** | リスクとリターン | `ATK +50 / Speed -20%` |
| **回復ゲート** | HPの回復 | `HP +20`, `HP +30%` |

### 9.2 ゲート出現ルール

- ゲートは一定間隔で出現（画面上部からスクロール）
- 1回の出現で **2つのゲートが左右に並ぶ**
- ゲート種別はステージ定義データに基づき出現（完全ランダムではない）

### 9.3 ゲート通過の強制度

ゲートには**強制通過型**と**回避可能型**の2種類がある。

| 配置タイプ | 説明 | 使い分け |
|---|---|---|
| **強制通過型** | 2つのゲートが画面幅全体をカバー。必ずどちらかを通る | 序盤の強化ゲート、換装ゲートに多用。戦略的選択を強制 |
| **回避可能型** | 2つのゲートの間や左右に隙間がある。通らない選択が可能 | トレードオフゲートに多用。リスク回避の選択肢を提供 |

```
【強制通過型の配置】          【回避可能型の配置】
┌──────┐┌──────┐          ┌──────┐  ┌──────┐
│Gate A││Gate B│          │Gate A│  │Gate B│
└──────┘└──────┘          └──────┘  └──────┘
   隙間なし                    隙間あり（通り抜け可能）
```

- 強制型: ゲート幅 140 × 2 + 隙間 40 = 320（画面幅全体）
- 回避型: ゲート幅 100 × 2 + 配置間隔で左右と中央に隙間

---

## 10. コンボ・覚醒システム

### 10.1 フォーム・チェンジ（オーバードライブ）

- **発動条件:** 強化系ゲートを **3回連続** で、**ダメージを受けずに** 通過
- **効果:** 機体が `SD_Awakened` 形態に変形
- **持続時間:** 10秒間
- **ビジュアル:** 煌びやかなエフェクト、グロー強化
- **終了後:** 変形前のフォームに戻る

### 10.2 コンボカウントのリセット条件

| イベント | コンボカウント |
|---|---|
| 強化ゲート通過 | +1 |
| 回復ゲート通過 | 維持（変化なし） |
| トレードオフゲート通過 | リセット (0) |
| 換装ゲート通過 | リセット (0) |
| ダメージを受ける | リセット (0) |

### 10.3 コンボUIと視覚フィードバック

コンボ状態はプレイヤーに常に明示し、状態変化時に明確なフィードバックを返す。

#### UI表示: 3セグメントゲージ

```
[通常時]     ○ ○ ○         ← 3つの空セグメント
[1回通過]    ● ○ ○         ← 1つ点灯（ネオングリーン）
[2回通過]    ● ● ○         ← 2つ点灯（グロー強化）
[3回通過]    ● ● ● → 覚醒！  ← 3つ点灯 → 覚醒トランジション発動
```

#### 状態変化時のエフェクト

| イベント | 演出 |
|---|---|
| **セグメント点灯** | 対象セグメントがネオングリーンに発光 + 短いパルスアニメーション（0.3秒） |
| **コンボリセット** | 全セグメントがネオンレッドに光った後、砕け散るように消滅（0.5秒）。リセット原因が明確にわかる演出 |
| **覚醒発動（3/3）** | 3セグメントが融合 → 画面全体に白フラッシュ（0.3秒）→ Awakened形態へトランジション |
| **覚醒残り時間** | 覚醒中はゲージが10秒のタイマーバーに変化。残り3秒で点滅警告 |

---

## 11. EXバーストシステム

| パラメータ | 値 |
|---|---|
| ゲージ最大値 | 100 |
| 雑魚撃破時の蓄積 | +5 |
| ゲート通過時の蓄積 | +10 |
| ボスにヒット時の蓄積 | +2（ヒットごと） |
| 発動ボタン位置 | 画面右下 |
| 効果 | 画面内の全敵ユニットへ一斉射撃（ファンネル演出） |
| 使用後 | ゲージ 0 にリセット |

→ 通常ステージで 1〜2回、ボス戦で 1〜2回発動可能な蓄積ペース

---

## 12. スコアリング

### 12.1 スコア加算要素

| 要素 | 基本スコア | 備考 |
|---|---|---|
| 雑魚敵撃破 | 100pt | |
| 巡回型撃破 | 200pt | 固定砲台型の2倍 |
| ボスダメージ（HP1%あたり） | 50pt | ボス撃破で計5000pt相当 |
| ゲート通過 | 150pt | 種別問わず |
| ステージクリアボーナス | 1000pt | |
| ボスステージクリアボーナス | 3000pt | |

### 12.2 将来追加候補（Phase 2以降）

- コンボボーナス（覚醒発動で倍率）
- ノーダメージボーナス
- タイムボーナス（残り時間に応じた加算）

---

## 13. 敵キャラクター

### 13.1 道中の敵（SDスタイル）

| 敵タイプ | 行動パターン | 基礎HP | 攻撃間隔 | 備考 |
|---|---|---|---|---|
| **固定砲台型** | 静止して前方に射撃 | 20 | 2.0秒 | 最も基本的な敵 |
| **巡回型** | 左右に往復移動 + 射撃 | 40 | 1.5秒 | 移動パターンは固定 |
| **突進型** | プレイヤー方向へ直進（将来実装） | 15 | なし | 衝突でダメージ |

- デザイン: **SDスタイル（2〜3頭身のデフォルメメカ）**
- 出現方式: **画面上部からスクロールで出現**
- HPは `基礎HP × 難易度倍率(enemyHpMultiplier)` で算出

### 13.2 ボス（リアルスタイル）

- デザイン: **リアル頭身・巨大な非人間型兵器**

#### ボスフェーズの挙動

ボス出現時、ゲームは**ボスフェーズ**に移行する。通常フェーズとの違いは以下の通り。

| 項目 | 通常フェーズ | ボスフェーズ |
|---|---|---|
| 背景スクロール | 通常速度 | **継続（速度 0.5x に減速）** — 視覚的な移動感を維持 |
| ボス位置 | - | **画面上部に固定（Y: 30〜50）**。左右に緩やかにホバリング（振幅30、周期3秒） |
| 雑魚敵スポーン | タイムラインに従う | **停止**（ドローン召喚で出現する敵のみ） |
| ゲートスポーン | タイムラインに従う | **停止** |
| プレイヤー移動 | 通常 | 通常（変化なし） |

- ボス撃破後、ステージクリアとなりリザルト画面へ遷移
- ボスフェーズ中もプレイヤーの自動射撃・EXバーストは通常通り使用可能

#### 攻撃パターン（初期3種）

ボスは HP 残量に応じてパターンを追加していく（既存パターンは継続）。

| パターン | 説明 | 発動タイミング |
|---|---|---|
| **拡散弾** | 前方に扇状に弾を5発ばらまく | HP 100%〜 |
| **レーザー** | 予告線(1秒)の後、直線ビームを照射 | HP 50%〜（拡散弾に追加） |
| **ドローン召喚** | 小型ユニットを3体召喚 | HP 25%〜（全パターン同時使用） |

---

## 14. メタプログレッション（ラン間成長）

### 14.1 通貨

| 通貨 | 獲得方法 | 用途 |
|---|---|---|
| **クレジット（Cr）** | 敵撃破、ステージクリア報酬 | 恒久強化、フォームアンロック |

### 14.2 クレジット獲得量

| 獲得源 | 量 |
|---|---|
| 雑魚撃破 | 1〜3 Cr |
| ステージクリア | 50 Cr |
| ボスステージクリア | 150 Cr |

### 14.3 恒久強化

| 強化項目 | 効果 | コスト | 最大レベル |
|---|---|---|---|
| 基礎ATK | +2 / レベル | 100 Cr × 現レベル | 10 |
| 基礎HP | +10 / レベル | 100 Cr × 現レベル | 10 |
| 基礎Speed | +0.05 (5%) / レベル | 100 Cr × 現レベル | 5 |

### 14.4 フォームアンロック条件

| フォーム | 条件 |
|---|---|
| SD_Standard | 初期解放 |
| SD_HeavyArtillery | ステージ3クリア + 500 Cr |
| SD_HighSpeed | ステージ7クリア + 500 Cr |

### 14.5 セーブデータ

| 項目 | 説明 |
|---|---|
| ハイスコア | ステージごとの最高スコア |
| アンロック状況 | 解放済みフォーム、到達ステージ |
| クレジット残高 | 累計獲得 - 消費 |
| 恒久強化レベル | 各ステータスの強化段階 |

---

## 15. UI / HUD 構成

### 15.1 ゲーム中HUD

```
┌──────────────────────────────┐
│ [⏸] [HP Bar ██████░░]  1250 │  ← ポーズ、HP、スコア
│                              │
│                              │
│        (ゲームエリア)          │
│                              │
│                              │
│              [● ● ○] Combo   │  ← コンボゲージ（3セグメント）
│  [SD_Std]        [EX ●]     │  ← フォームアイコン、EXボタン
│  [EX Gauge ████░░░░░░]      │  ← EXゲージバー
└──────────────────────────────┘
```

- **コンボゲージ:** 3セグメント式（詳細はセクション 10.3 参照）
- **覚醒中:** コンボゲージ → 残り時間タイマーバーに差し替え

### 15.2 画面一覧（expo-router パス）

| 画面 | ルートパス | 主な機能 |
|---|---|---|
| タイトル画面 | `/` | ゲーム開始、設定 |
| ステージセレクト | `/stages` | ステージ選択、最高スコア表示 |
| フォーム選択画面 | `/stages/[id]/select-form` | 出撃フォームの選択 |
| ゲーム画面 | `/game/[stageId]` | メインゲームプレイ |
| リザルト画面 | `/game/[stageId]/result` | スコア、獲得Cr、リプレイ/次ステージ |
| 強化画面 | `/upgrade` | Cr消費による恒久強化 |
| 設定画面 | `/settings` | 音量調整等 |

---

## 16. サウンド

| 種別 | 内容 | 備考 |
|---|---|---|
| **BGM** | 通常ステージ用、ボスステージ用 | ループ再生 |
| **SE** | 射撃、敵撃破、ゲート通過、換装、EXバースト、ダメージ、被弾 | 同時再生対応 |

プロトタイプ段階からサウンドを組み込む。初期はフリー素材を使用。

---

## 17. ビジュアル・演出指針

### 17.1 カラーパレット

| 用途 | カラー |
|---|---|
| 背景ベース | ダークグレー (#1A1A2E), ネイビー (#16213E) |
| アクセント | ネオンブルー (#00D4FF), ネオングリーン (#00FF88) |
| 警告・ダメージ | ネオンピンク (#FF006E), ネオンレッド (#FF3366) |
| UI テキスト | ホワイト (#FFFFFF), ライトグレー (#B0B0B0) |
| 強化ゲート | ネオングリーン (#00FF88) |
| 換装ゲート | ネオンブルー (#00D4FF) |
| トレードオフゲート | ネオンイエロー (#FFD600) |
| 回復ゲート | ネオンピンク (#FF69B4) |

### 17.2 エフェクト方針

- **Glow エフェクト（光彩）** をネオンカラーで多用
- ビーム・爆発・バーニアは Skia の Shadow/Blur フィルタで実現
- フォーム換装時は短いトランジション演出（0.5秒程度のフラッシュ）
- 被弾時は 1.5秒間点滅（i-frame 演出）

---

## 18. ステージ定義データ構造

各ステージはJSONデータとして定義し、敵配置・ゲート配置をデータドリブンに管理する。

```typescript
interface StageDefinition {
  id: number;
  name: string;
  isBossStage: boolean;
  duration: number;            // ステージの長さ（秒）
  difficulty: DifficultyParams;

  // スポーン定義: 時系列で並べたイベントリスト
  timeline: StageEvent[];
}

type StageEvent =
  | { time: number; type: 'enemy_spawn'; enemyType: EnemyType; x: number; count?: number }
  | { time: number; type: 'gate_spawn'; gateConfig: GatePairConfig }
  | { time: number; type: 'boss_spawn'; bossId: string };

interface GatePairConfig {
  layout: 'forced' | 'optional';  // 強制通過 or 回避可能
  left: GateDefinition;
  right: GateDefinition;
}

interface DifficultyParams {
  scrollSpeedMultiplier: number;
  enemySpawnInterval: number;
  enemyHpMultiplier: number;
  enemyAtkMultiplier: number;
  maxConcurrentEnemies: number;
}
```

### ステージデータ例（ステージ1）

```json
{
  "id": 1,
  "name": "Training Ground",
  "isBossStage": false,
  "duration": 90,
  "difficulty": {
    "scrollSpeedMultiplier": 1.0,
    "enemySpawnInterval": 3.0,
    "enemyHpMultiplier": 1.0,
    "enemyAtkMultiplier": 1.0,
    "maxConcurrentEnemies": 2
  },
  "timeline": [
    { "time": 5, "type": "enemy_spawn", "enemyType": "stationary", "x": 160 },
    { "time": 10, "type": "enemy_spawn", "enemyType": "stationary", "x": 80 },
    { "time": 10, "type": "enemy_spawn", "enemyType": "stationary", "x": 240 },
    { "time": 20, "type": "gate_spawn", "gateConfig": {
      "layout": "forced",
      "left": { "type": "enhance", "displayLabel": "ATK +5", "effects": [{ "kind": "stat_add", "stat": "atk", "value": 5 }] },
      "right": { "type": "enhance", "displayLabel": "SPD +10%", "effects": [{ "kind": "stat_multiply", "stat": "speed", "value": 1.1 }] }
    }},
    { "time": 35, "type": "enemy_spawn", "enemyType": "stationary", "x": 100, "count": 2 },
    { "time": 50, "type": "gate_spawn", "gateConfig": {
      "layout": "forced",
      "left": { "type": "refit", "displayLabel": "→ Heavy", "effects": [{ "kind": "refit", "targetForm": "SD_HeavyArtillery" }] },
      "right": { "type": "refit", "displayLabel": "→ Speed", "effects": [{ "kind": "refit", "targetForm": "SD_HighSpeed" }] }
    }}
  ]
}
```

---

## 19. プロジェクト構成

```
sd-g-runner/
├── app/                          # expo-router ページ
│   ├── _layout.tsx               # ルートレイアウト
│   ├── index.tsx                 # タイトル画面
│   ├── settings.tsx              # 設定画面
│   ├── stages/
│   │   ├── index.tsx             # ステージセレクト
│   │   └── [id]/
│   │       └── select-form.tsx   # フォーム選択
│   ├── game/
│   │   └── [stageId]/
│   │       ├── index.tsx         # ゲーム画面
│   │       └── result.tsx        # リザルト画面
│   └── upgrade.tsx               # 強化画面
│
├── src/
│   ├── engine/                   # ゲームエンジン層
│   │   ├── systems/              # RNGE システム（更新ロジック）
│   │   │   ├── MovementSystem.ts
│   │   │   ├── ShootingSystem.ts
│   │   │   ├── CollisionSystem.ts
│   │   │   ├── EnemyAISystem.ts
│   │   │   ├── ScrollSystem.ts
│   │   │   └── SpawnSystem.ts
│   │   ├── entities/             # エンティティ定義
│   │   │   ├── Player.ts
│   │   │   ├── Enemy.ts
│   │   │   ├── Bullet.ts
│   │   │   ├── Gate.ts
│   │   │   └── Boss.ts
│   │   └── collision.ts          # AABB 衝突判定ユーティリティ
│   │
│   ├── rendering/                # Skia レンダリング層
│   │   ├── components/           # Skia 描画コンポーネント
│   │   │   ├── PlayerRenderer.tsx
│   │   │   ├── EnemyRenderer.tsx
│   │   │   ├── BulletRenderer.tsx
│   │   │   ├── GateRenderer.tsx
│   │   │   ├── BossRenderer.tsx
│   │   │   ├── BackgroundRenderer.tsx
│   │   │   └── EffectRenderer.tsx
│   │   └── GameCanvas.tsx        # Skia Canvas ラッパー
│   │
│   ├── game/                     # ゲームロジック層
│   │   ├── forms.ts              # フォーム定義データ
│   │   ├── stages/               # ステージ定義データ
│   │   │   ├── stage1.ts
│   │   │   ├── stage2.ts
│   │   │   └── index.ts
│   │   ├── scoring.ts            # スコア計算
│   │   └── difficulty.ts         # 難易度スケーリング
│   │
│   ├── stores/                   # Zustand ストア
│   │   ├── gameSessionStore.ts   # インゲーム状態
│   │   └── saveDataStore.ts      # 永続データ
│   │
│   ├── ui/                       # React Native UI コンポーネント
│   │   ├── HUD.tsx
│   │   ├── HPBar.tsx
│   │   ├── EXButton.tsx
│   │   └── ComboCounter.tsx
│   │
│   ├── audio/                    # サウンド管理
│   │   ├── AudioManager.ts
│   │   └── sounds/               # 音声ファイル
│   │
│   ├── constants/                # 定数・設定
│   │   ├── colors.ts
│   │   ├── dimensions.ts         # 座標系定数
│   │   └── balance.ts            # バランス数値
│   │
│   └── types/                    # 型定義
│       ├── forms.ts
│       ├── gates.ts
│       ├── enemies.ts
│       ├── stages.ts
│       └── index.ts
│
├── assets/                       # 静的アセット
│   ├── sounds/
│   └── fonts/
│
├── docs/                         # ドキュメント
│   └── v1/
│       ├── REQUIREMENTS.md
│       ├── REQUIREMENTS-r2.md
│       └── REQUIREMENTS-r3.md
│
├── app.json
├── package.json
└── tsconfig.json
```

---

## 20. MVP スコープ（フェーズ分け）

### Phase 1: コアメカニクス
1. 縦スクロール + スワイプによるフリー移動
2. 自動射撃 + 敵（固定砲台型）の出現・撃破
3. ゲート通過による換装（ビジュアル変化 + ステータス変化）
4. HP システム + 被弾 i-frame + ゲームオーバー
5. 1体のボス戦（攻撃パターン3種）
6. BGM + 基本SE
7. 基本スコアリング（敵撃破 + ゲート通過 + ステージクリア）

### Phase 2: ゲームシステム拡充
8. コンボシステム + Awakened 形態
9. EXバーストシステム
10. 回復ゲート + トレードオフゲート
11. 強制通過 / 回避可能ゲートの両方実装
12. 巡回型の敵追加

### Phase 3: メタゲーム
13. ステージセレクト画面
14. リザルト画面 + スコアリング
15. クレジット獲得 + 恒久強化
16. フォームアンロック
17. セーブ/ロード

---

## 21. データ構造（型定義）

```typescript
// ===== フォーム =====
type MechaFormId = 'SD_Standard' | 'SD_HeavyArtillery' | 'SD_HighSpeed' | 'SD_Awakened';

type SpecialAbilityType = 'explosion_radius' | 'pierce' | 'homing_invincible' | 'none';

interface MechaFormDefinition {
  id: MechaFormId;
  displayName: string;
  moveSpeedMultiplier: number;
  attackMultiplier: number;
  fireRateMultiplier: number;
  specialAbility: SpecialAbilityType;
  isTimeLimited: boolean;
  spriteConfig: SpriteConfig;
  bulletConfig: BulletConfig;
}

// ===== ゲート =====
type GateType = 'enhance' | 'refit' | 'tradeoff' | 'recovery';

interface GateDefinition {
  type: GateType;
  displayLabel: string;
  effects: GateEffect[];
}

type GateEffect =
  | { kind: 'stat_add'; stat: StatKey; value: number }
  | { kind: 'stat_multiply'; stat: StatKey; value: number }
  | { kind: 'refit'; targetForm: MechaFormId }
  | { kind: 'heal'; value: number }
  | { kind: 'heal_percent'; value: number };

type StatKey = 'atk' | 'speed' | 'fireRate' | 'hp' | 'maxHp';

// ===== 敵 =====
type EnemyType = 'stationary' | 'patrol' | 'rush';
type BossAttackPattern = 'spread_shot' | 'laser_beam' | 'drone_summon';

interface EnemyDefinition {
  type: EnemyType;
  hp: number;
  attackDamage: number;
  movePattern: MovePattern;
  isBoss: boolean;
  bossPatterns?: BossAttackPattern[];
}

// ===== ステージ =====
interface StageDefinition {
  id: number;
  name: string;
  isBossStage: boolean;
  duration: number;
  difficulty: DifficultyParams;
  timeline: StageEvent[];
}

type StageEvent =
  | { time: number; type: 'enemy_spawn'; enemyType: EnemyType; x: number; count?: number }
  | { time: number; type: 'gate_spawn'; gateConfig: GatePairConfig }
  | { time: number; type: 'boss_spawn'; bossId: string };

interface GatePairConfig {
  layout: 'forced' | 'optional';
  left: GateDefinition;
  right: GateDefinition;
}

interface DifficultyParams {
  scrollSpeedMultiplier: number;
  enemySpawnInterval: number;
  enemyHpMultiplier: number;
  enemyAtkMultiplier: number;
  maxConcurrentEnemies: number;
}

// ===== セッション状態 (Zustand) =====
interface GameSession {
  // プレイヤー状態
  currentForm: MechaFormId;
  previousForm: MechaFormId;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  fireRate: number;

  // 被弾
  isInvincible: boolean;
  invincibleTimer: number;     // 残り秒数（1.5s）

  // システム状態
  comboCount: number;
  exGauge: number;
  score: number;
  credits: number;             // 獲得Cr（ステージ中）
  isAwakened: boolean;
  awakenedTimer: number;

  // ステージ
  currentStageId: number;
  stageProgress: number;
  isPaused: boolean;
}

// ===== 永続データ =====
interface SaveData {
  highScores: Record<number, number>;
  unlockedForms: MechaFormId[];
  unlockedStages: number[];
  credits: number;
  upgrades: {
    baseAtk: number;
    baseHp: number;
    baseSpeed: number;
  };
  settings: {
    bgmVolume: number;         // 0.0〜1.0
    seVolume: number;          // 0.0〜1.0
  };
}
```

---

## 22. 実装上の技術的制約

### 22.1 レンダリングアーキテクチャ（RNGE + Skia の統合）

`react-native-game-engine` と `@shopify/react-native-skia` を組み合わせる場合、**React の再レンダリングループとゲームエンジンの更新ループが競合しないよう**に設計する必要がある。

#### 必須アーキテクチャパターン

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ RNGE Systems     │────→│ Entity State     │←────│ Skia Canvas     │
│ (JS Thread)      │     │ (Plain JS Object)│     │ (UI Thread)     │
│                  │     │ ※React State不使用│     │                  │
│ MovementSystem   │     │ positions: {...}  │     │ useFrameCallback │
│ CollisionSystem  │     │ hp: 80           │     │ で毎フレーム読取  │
│ SpawnSystem      │     │ enemies: [...]   │     │                  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

#### 禁止パターン

- **エンティティ座標の `useState` / `setState` 管理は禁止。** 毎フレーム React の再レンダリングが走り、60fps を維持できない
- **個別エンティティの React コンポーネント化は禁止。** 敵100体 = 100個の `<Enemy />` は致命的。Skia Canvas 上に一括描画する

#### 推奨パターン

- **RNGE の `entities` オブジェクトを単一のデータストア（Plain JS Object）として使用**。Systems がこのオブジェクトを直接変更（mutation）する
- **Skia 側は `useFrameCallback` で毎フレーム entities を読み取り、Canvas 上に描画**。React の再レンダリングを経由しない
- **座標の補間やアニメーション**が必要な場合は `react-native-reanimated` の `useSharedValue` を活用し、UIスレッドで完結させる
- **HUD（HP, Score, EXゲージ等）のみ React State で管理**してよい。これらは毎フレーム更新ではなく、イベント駆動（HP変化時、スコア加算時等）で更新されるため

#### GameCanvas.tsx の設計指針

```typescript
// 概要: Skia Canvas が entities を直接参照して描画する
// React の再レンダリングとは独立して動作する
//
// - entities はRNGEのsystemsが毎フレーム更新する plain JS object
// - useFrameCallback 内で entities を読み取り Canvas に描画
// - React.memo で GameCanvas 自体の再レンダリングを防止
```

### 22.2 パフォーマンス基準

| 指標 | 目標値 | 備考 |
|---|---|---|
| フレームレート | 60fps 安定 | iPhone SE 2nd gen で計測 |
| 同時描画エンティティ数 | 50以上 | 弾 + 敵 + エフェクト含む |
| エンティティ更新 (Systems) | 16ms以内 / フレーム | JS Thread で完結 |
| タッチ入力遅延 | 2フレーム以内 (≤33ms) | スワイプ応答性 |

### 22.3 ゲームループとReactライフサイクルの分離

- **ゲーム状態（座標、弾、敵）** → RNGE entities（plain object、React外）
- **UI状態（HP表示、スコア表示、ポーズ）** → Zustand ストア（React 連携）
- **永続状態（セーブデータ）** → AsyncStorage + Zustand

ゲーム状態からUI状態への反映は **System 内で Zustand の `setState` を直接呼ぶ** ことで行う（例: `CollisionSystem` が HP 変化を検知 → `gameSessionStore.getState().setHp(newHp)` を呼ぶ）。これによりUI更新はイベント駆動となり、毎フレームの React 再レンダリングを回避する。

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| v1 | - | 初版（コンセプト・ざっくり仕様） |
| v2 | 2026-03-03 | 要件深掘り。技術スタック確定、フォーム詳細、ゲートに回復追加、敵パターン具体化、メタプログレッション定義、MVP フェーズ分け、データ構造設計 |
| v3 | 2026-03-03 | 座標系・ヒットボックス定義、ダメージモデル(i-frame含む)、難易度カーブ、スコアリング、ゲート強制/回避の2種、EXゲージ蓄積量、クレジット経済、フォームアンロック条件、ステージ定義データ構造、プロジェクト構成、画面遷移図、expo-router パス定義 |
| v3.1 | 2026-03-03 | Geminiレビュー反映。RNGE+Skiaレンダリングアーキテクチャ制約(§22)、ボスフェーズの挙動詳細(§13.2)、コンボUI視覚フィードバック仕様(§10.3, §15.1) |
