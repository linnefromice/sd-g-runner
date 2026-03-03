# 要件定義書 v2：Project G-Runner (Tactical SD Refit Action)

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

## 3. ゲームフロー

### 3.1 ステージ構成

- **固定ステージ制**（ステージ 1, 2, 3, ...）
- **通常ステージ:** 1〜2分で完走
- **ボスステージ:** 5ステージに1回出現（ステージ5, 10, 15...）、約3分
- ステージクリア → 次ステージ選択（またはリザルト画面）

### 3.2 ゲームオーバー

- **条件:** HP が 0 になる
- **復帰:** リザルト画面 → ステージセレクトへ戻る

### 3.3 基本ゲームプレイループ

```
ステージ開始
  → 縦スクロール自動進行
  → 敵出現 & 自動射撃で撃破
  → ゲート選択（左右に分岐 or 通過/回避）
  → ボスステージの場合：ボス戦（縦スクロール継続）
  → ステージクリア → リザルト
```

---

## 4. プレイヤー操作

| 操作 | 方式 | 詳細 |
|---|---|---|
| **移動** | スワイプ（フリー移動） | 画面内を自由に左右移動。上下は画面下半分に制限 |
| **攻撃** | 自動射撃 | 常時前方（上方向）に射撃。フォームにより弾の種類が変化 |
| **EXバースト** | タップ（画面右下ボタン） | ゲージ100%時にアクティブ化 |
| **ゲート選択** | 移動で通過 | 通りたいゲート側に移動するだけ |

---

## 5. フォーム（機体形態）システム

### 5.1 フォーム一覧

フォームは拡張可能な設計とし、初期リリースでは以下の4種を実装する。

| フォーム | タイプ | 移動速度 | 攻撃力 | 発射レート | 特殊能力 |
|---|---|---|---|---|---|
| **SD_Standard** | バランス型 | 100% | 100% | 100% | なし |
| **SD_HeavyArtillery** | 重火力型 | 80% | 180% | 60% | 弾に爆発範囲（範囲攻撃） |
| **SD_HighSpeed** | 高速型 | 140% | 70% | 150% | 弾が敵を貫通 |
| **SD_Awakened** | 覚醒型（時限） | 120% | 200% | 130% | 敵衝突無敵 + ホーミング弾 |

### 5.2 フォーム切替ルール

- **換装ゲート通過**により `Standard ↔ HeavyArtillery ↔ HighSpeed` を切り替え
- **Awakened** はコンボシステムでのみ発動（後述）
- 換装時に **HP・ゲージはリセットされない**（維持される）

### 5.3 フォーム拡張方針

将来的にフォームを追加する場合は、以下の型定義を拡張する。

```typescript
// フォームIDは文字列リテラル型で管理し、拡張時に追加
type MechaFormId = 'SD_Standard' | 'SD_HeavyArtillery' | 'SD_HighSpeed' | 'SD_Awakened';
// | 'SD_Sniper' | 'SD_Shield' など将来追加

interface MechaFormDefinition {
  id: MechaFormId;
  displayName: string;
  moveSpeedMultiplier: number;    // 1.0 = 100%
  attackMultiplier: number;       // 1.0 = 100%
  fireRateMultiplier: number;     // 1.0 = 100%
  specialAbility: SpecialAbility | null;
  // ビジュアル情報
  spriteConfig: SpriteConfig;
  bulletConfig: BulletConfig;
}
```

---

## 6. ゲートシステム

### 6.1 ゲート種別

| ゲート種別 | 内容 | 効果の例 |
|---|---|---|
| **強化ゲート** | 純粋なステータスUP | `ATK +10`, `FireRate x1.2` |
| **換装(変形)ゲート** | 武装と外見（SDモデル）の総入れ替え | `Standard → HeavyArtillery` |
| **トレードオフゲート** | リスクとリターン | `ATK +50 / Speed -20%` |
| **回復ゲート** | HPの回復 | `HP +20`, `HP +30%` |

### 6.2 ゲート出現ルール

- ゲートは一定間隔で出現（画面上部からスクロール）
- 1回の出現で **2つのゲートが左右に並ぶ**（どちらかを選択）
- ゲート種別はステージ定義データに基づき出現（完全ランダムではない）

---

## 7. コンボ・覚醒システム

### 7.1 フォーム・チェンジ（オーバードライブ）

- **発動条件:** 強化系ゲートを **3回連続** で、**ダメージを受けずに** 通過
- **効果:** 機体が `SD_Awakened` 形態に変形
- **持続時間:** 10秒間
- **ビジュアル:** 煌びやかなエフェクト、グロー強化
- **終了後:** 変形前のフォームに戻る

### 7.2 コンボカウントのリセット条件

- ダメージを受ける → リセット
- トレードオフゲートを通る → リセット
- 換装ゲートを通る → リセット
- 回復ゲートは → **リセットしない**

---

## 8. EXバーストシステム

- **ゲージ蓄積:** 敵撃破 + ゲート通過で加算
- **最大値:** 100
- **発動:** 画面右下ボタンをタップ（ゲージ100%時に点灯）
- **効果:** 画面内の全敵ユニットへ一斉射撃（ファンネル/マルチロックオン演出）
- **使用後:** ゲージ 0 にリセット

---

## 9. 敵キャラクター

### 9.1 道中の敵（SDスタイル）

| 敵タイプ | 行動パターン | HP目安 | 備考 |
|---|---|---|---|
| **固定砲台型** | 静止して前方に射撃 | 低 | 最も基本的な敵 |
| **巡回型** | 左右に往復移動 + 射撃 | 中 | 移動パターンは固定 |
| **突進型** | プレイヤー方向へ直進（将来実装） | 低 | 衝突でダメージ |

- デザイン: **SDスタイル（2〜3頭身のデフォルメメカ）**
- 出現方式: **画面上部からスクロールで出現**

### 9.2 ボス（リアルスタイル）

- デザイン: **リアル頭身・巨大な非人間型兵器**
- 戦闘方式: **縦スクロール継続**（通常ステージと同じ）
- ボスは画面上部に位置し、上に向かって移動し続ける
- **攻撃パターン: 初期3種**

| パターン | 説明 |
|---|---|
| **拡散弾** | 前方に扇状に弾をばらまく |
| **レーザー** | 予告線の後、直線ビームを照射（回避猶予あり） |
| **ドローン召喚** | 小型ユニットを複数召喚（道中敵と同等） |

---

## 10. メタプログレッション（ラン間成長）

### 10.1 通貨

| 通貨 | 獲得方法 | 用途 |
|---|---|---|
| **クレジット（Cr）** | 敵撃破、ステージクリア報酬 | 恒久強化、フォームアンロック |

### 10.2 恒久強化

- **ベースステータスUP:** Cr消費で基礎ATK/HP/Speedを微増
- **新フォームアンロック:** 特定条件 + Cr消費で初期フォーム以外を解放

### 10.3 セーブデータ

| 項目 | 説明 |
|---|---|
| ハイスコア | ステージごとの最高スコア |
| アンロック状況 | 解放済みフォーム、到達ステージ |
| クレジット残高 | 累計獲得 - 消費 |
| 恒久強化レベル | 各ステータスの強化段階 |

---

## 11. UI / HUD 構成

### 11.1 ゲーム中HUD

```
┌──────────────────────────────┐
│  [HP Bar]          [Score]   │
│                              │
│                              │
│        (ゲームエリア)          │
│                              │
│                              │
│              [Combo Count]   │
│  [Form Icon]    [EX Button]  │
└──────────────────────────────┘
```

### 11.2 画面一覧

| 画面 | 主な機能 |
|---|---|
| タイトル画面 | ゲーム開始、設定 |
| ステージセレクト | ステージ選択、最高スコア表示 |
| ゲーム画面 | メインゲームプレイ |
| リザルト画面 | スコア、獲得Cr、リプレイ/次ステージ |
| 強化画面 | Cr消費による恒久強化 |
| フォーム選択画面 | 出撃フォームの選択 |

---

## 12. サウンド

| 種別 | 内容 | 備考 |
|---|---|---|
| **BGM** | 通常ステージ用、ボスステージ用 | ループ再生 |
| **SE** | 射撃、敵撃破、ゲート通過、換装、EXバースト、ダメージ | 同時再生対応 |

プロトタイプ段階からサウンドを組み込む。初期はフリー素材を使用。

---

## 13. ビジュアル・演出指針

### 13.1 カラーパレット

| 用途 | カラー |
|---|---|
| 背景ベース | ダークグレー (#1A1A2E), ネイビー (#16213E) |
| アクセント | ネオンブルー (#00D4FF), ネオングリーン (#00FF88) |
| 警告・ダメージ | ネオンピンク (#FF006E), ネオンレッド (#FF3366) |
| UI テキスト | ホワイト (#FFFFFF), ライトグレー (#B0B0B0) |

### 13.2 エフェクト方針

- **Glow エフェクト（光彩）** をネオンカラーで多用
- ビーム・爆発・バーニアは Skia の Shadow/Blur フィルタで実現
- フォーム換装時は短いトランジション演出（0.5秒程度のフラッシュ）

---

## 14. MVP スコープ（フェーズ1）

最小プロトタイプとして以下を実装する。

### Phase 1: コアメカニクス
1. 縦スクロール + スワイプによるフリー移動
2. 自動射撃 + 敵（固定砲台型）の出現・撃破
3. ゲート通過による換装（ビジュアル変化 + ステータス変化）
4. HP システム + ゲームオーバー
5. 1体のボス戦（攻撃パターン3種）
6. BGM + 基本SE

### Phase 2: ゲームシステム拡充
7. コンボシステム + Awakened 形態
8. EXバーストシステム
9. 回復ゲート + トレードオフゲート
10. 巡回型の敵追加

### Phase 3: メタゲーム
11. ステージセレクト画面
12. リザルト画面 + スコアリング
13. クレジット獲得 + 恒久強化
14. フォームアンロック
15. セーブ/ロード

---

## 15. データ構造（型定義）

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
  isTimeLimited: boolean; // Awakened のみ true
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

// ===== セッション状態 (Zustand) =====
interface GameSession {
  // プレイヤー状態
  currentForm: MechaFormId;
  previousForm: MechaFormId; // Awakened 終了後に戻るフォーム
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  fireRate: number;

  // システム状態
  comboCount: number;
  exGauge: number;       // 0〜100
  score: number;
  isAwakened: boolean;
  awakenedTimer: number; // 残り秒数

  // ステージ
  currentStageId: number;
  stageProgress: number; // 0.0〜1.0
}

// ===== 永続データ =====
interface SaveData {
  highScores: Record<number, number>;  // stageId → score
  unlockedForms: MechaFormId[];
  unlockedStages: number[];
  credits: number;
  upgrades: {
    baseAtk: number;   // 強化レベル
    baseHp: number;
    baseSpeed: number;
  };
}
```

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|---|---|---|
| v1 | - | 初版（コンセプト・ざっくり仕様） |
| v2 | 2026-03-03 | 要件深掘り。技術スタック確定、フォーム詳細、ゲートに回復追加、敵パターン具体化、メタプログレッション定義、MVP フェーズ分け、データ構造設計 |
