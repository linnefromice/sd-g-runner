# Game Design Overview

Project G-Runner の全ゲームシステム・コンテンツの概要。数値はすべてコードベースの定義に基づく。

## Mecha Forms

7 種のメカフォーム。プレイヤーはステージ開始前に Primary/Secondary を選択し、ゲーム中に変身で切り替える。

| Form | Move | ATK | Fire Rate | Bullet | Special Ability | Unlock |
|------|------|-----|-----------|--------|-----------------|--------|
| SD_Standard | 1.0x | 1.0x | 1.0x | 単発 cyan | — | 初期 |
| SD_HeavyArtillery | 0.8x | 1.8x | 0.6x | 単発 orange | 爆発範囲攻撃 | Stage 3 + 500 Cr |
| SD_HighSpeed | 1.4x | 0.7x | 1.5x | 単発 green | 弾貫通 | Stage 5 + 500 Cr |
| SD_Sniper | 0.6x | 2.5x | 0.3x | 単発 purple | シールド貫通 | Stage 7 + 800 Cr |
| SD_Scatter | 1.0x | 0.6x | 1.0x | 5 連散弾 orange | — | Stage 8 + 800 Cr |
| SD_Guardian | 0.7x | 0.8x | 0.8x | 単発 cyan | ダメージ軽減 30% | Stage 10 + 1000 Cr |
| SD_Awakened | 1.2x | 2.0x | 1.3x | 3 連 gold | ホーミング + 無敵 | コンボ MAX (10 秒限定) |

### Form XP & Skill Tree

各フォームは使用中に XP を獲得し、レベルアップで追加スキルを解放する。

| Level | 必要 XP (累積) |
|-------|--------------|
| Lv.1 | 50 |
| Lv.2 | 200 |
| Lv.3 | 500 |

**XP 獲得源**: 敵撃破 (+5), 強敵撃破 (+10), グレイズ (+3/+6/+15), Enhance ゲート通過 (+8)

## Stages

15 キャンペーンステージ + エンドレスモード。ステージ 5/10/15 はボスステージ。

| Stage | Duration | Type | Boss |
|-------|----------|------|------|
| 1. Training Ground | 90s | Normal | — |
| 2. Asteroid Belt | 100s | Normal | — |
| 3. Nebula Corridor | 110s | Normal | — |
| 4. Gravity Well | 120s | Normal | — |
| 5. Core Breach | 180s | **Boss** | Boss 1 (HP: 500) |
| 6. Scrap Yard | 100s | Normal | — |
| 7. Fortress Gate | 110s | Normal | — |
| 8. War Front | 120s | Normal | — |
| 9. Final Approach | 130s | Normal | — |
| 10. Omega Core | 180s | **Boss** | Boss 2 (HP: 750) |
| 11. Phantom Zone | 110s | Normal | — |
| 12. Hive Cluster | 120s | Normal | — |
| 13. Command Nexus | 120s | Normal | — |
| 14. Chaos Corridor | 130s | Normal | — |
| 15. Terminus Core | 180s | **Boss** | Boss 3 (HP: 1000) |
| 99. Endless | ∞ | Endless | — |

### Difficulty Scaling (Stages 1–15)

```
scrollSpeedMultiplier    = 1.0 + (stageId - 1) × 0.06
enemySpawnInterval       = max(1.2, 3.0 - (stageId - 1) × 0.18)
enemyHpMultiplier        = 1.0 + (stageId - 1) × 0.12
maxConcurrentEnemies     = min(7, 2 + ⌊stageId / 2⌋)
```

### Endless Mode

全 15 ステージクリア後に解放。30 秒ごとにウェーブを生成し、時間経過で難易度が上昇する。

## Enemy Types

11 種の敵。HP は `enemyHpMultiplier` で各ステージに応じてスケーリングされる。

| Type | Base HP | Damage | Attack Interval | Score | Credits | Behavior |
|------|---------|--------|-----------------|-------|---------|----------|
| Stationary | 20 | 10 | 2.0s | 100 | 1 | 静止、定期射撃 |
| Patrol | 40 | 10 | 1.5s | 200 | 2 | 水平パトロール、照準射撃 |
| Rush | 15 | 15 | — | 100 | 1 | 高速突進、遠距離攻撃なし |
| Swarm | 1 | 5 | — | 30 | 0 | 小型、群れで出現 |
| Phalanx | 60 | 15 | 2.0s | 300 | 4 | 前面シールド (50% 軽減)、低速 |
| Juggernaut | 120 | 25 | 1.5s | 500 | 7 | 最重量、スクロール 0.3x |
| Dodger | 35 | 12 | 1.8s | 250 | 3 | 弾回避 AI (検知 60px, 回避速度 120/s) |
| Splitter | 50 | 8 | 2.0s | 200 | 3 | 撃破時に Swarm × 3 分裂 |
| Summoner | 80 | 0 | — | 400 | 5 | 3 秒ごとにミニオン生成 (最大 6 体) |
| Sentinel | 120 | 15 | 2.0s | 600 | 7 | 3 方向拡散射撃、範囲内味方のダメージ 50% 軽減 |
| Carrier | 100 | 0 | — | 500 | 6 | 5 秒ごとに Patrol × 2 生成 |

## Gate Types

6 種のゲート。ステージタイムラインで左右ペアとして出現し、プレイヤーが通過した側の効果が適用される。

| Type | Color | Combo | Effects |
|------|-------|-------|---------|
| **Enhance** | Green | +1 | ATK +5/+10/+15/+20, SPD +10%, FR +20%/+30% |
| **Recovery** | Pink | ±0 | HP +15/+20/+30/+50%/+100% |
| **Tradeoff** | Yellow | Reset | ATK↑SPD↓, SPD↑ATK↓, FR↑ATK↓ 等 (任意通過) |
| **Refit** | Blue | Reset | フォーム変更 (Heavy/Speed/Guardian) |
| **Growth** | Green | +1 | Enhance と同等 (後半ステージ用) |
| **Roulette** | Orange | +1 | 500ms 間隔で 2 効果が切り替わる |

### Combo → Awakening

Enhance/Growth/Roulette ゲートを連続 3 回通過でコンボ MAX → SD_Awakened に変身 (10 秒)。
Tradeoff/Refit/被ダメージでコンボリセット。

## Boss Encounters

3 体のボス。各ボスはステージ終盤に出現し、撃破でステージクリア。

| Boss | HP | Visual | Attack Patterns |
|------|-----|--------|----------------|
| Boss 1 (Stage 5) | 500 | 標準形状 | 5 方向スプレッド (15°間隔, 15 dmg) |
| Boss 2 (Stage 10) | 750 | 八角形 + スパイク | スプレッド + レーザー (幅 30px, 20 dmg/300ms) |
| Boss 3 (Stage 15) | 1000 | ダイヤモンド形 | スプレッド + レーザー (幅 40px) + ドローン × 5 |

**共通仕様**:
- ホバリング: 振幅 30px, 周期 3000ms, Y=40 固定
- ドローン生成: HP 25% 以下で発動 (Boss 1: 3 体, Boss 2: 4 体, Boss 3: 5 体)
- 接触ダメージ: 50 HP
- 撃破ボーナス: HP 1% あたり 50 pts

## Scoring

| Action | Points |
|--------|--------|
| 敵撃破 | 敵タイプ別 (30–600 pts) |
| ゲート通過 | 150 pts |
| ステージクリア (通常) | 1,000 pts |
| ステージクリア (ボス) | 3,000 pts |
| ボスダメージ (HP 1% あたり) | 50 pts |
| グレイズ (通常/Close/Extreme) | 20 / 50 / 150 pts |
| パリィ (Just TF) | 300 pts |

### Boost Lane

一部ステージにはブーストレーンが配置され、レーン内では:
- スコア × 1.5
- スクロール速度 × 1.3

## Credit Economy

| Source | Amount |
|--------|--------|
| 敵撃破 (ランダム) | 1–3 Cr |
| ステージクリア (通常) | 50 Cr |
| ステージクリア (ボス) | 150 Cr |
| 実績報酬 | 100–1,000 Cr |

### Upgrades

| Upgrade | Effect/Level | Max Level | Cost Formula |
|---------|-------------|-----------|-------------|
| ATK | +2 | 10 | 100 × (Lv + 1) |
| HP | +10 | 10 | 100 × (Lv + 1) |
| Speed | +5% | 5 | 100 × (Lv + 1) |
| DEF | +3% | 5 | 150 × (Lv + 1) |
| Credit Boost | +10% | 5 | 200 × (Lv + 1) |

## Special Systems

### EX Burst

| Parameter | Value |
|-----------|-------|
| ゲージ MAX | 100 |
| 敵撃破獲得 | +5 |
| ゲート通過獲得 | +10 |
| ボスヒット獲得 | +2 |
| バースト時間 | 2,000ms |
| バースト幅 | 80 units |
| バーストダメージ | 50 dmg / 100ms tick |

### Transform

| Parameter | Value |
|-----------|-------|
| ゲージ MAX | 100 |
| 敵撃破獲得 | +8 |
| ゲート通過獲得 | +12 |
| 時間経過獲得 | +2/s |

ゲージ満タンで TF ボタン → Primary/Secondary フォーム切り替え。

### Graze (Near-Miss)

敵弾との近接回避で報酬を獲得。3 段階:

| Tier | 距離 | EX | TF | Score | Form XP |
|------|------|-----|-----|-------|---------|
| Normal | 標準 | +3 | +2 | +20 | +3 |
| Close | +4px | +6 | +4 | +50 | +6 |
| Extreme | +1px | +12 | +8 | +150 | +15 |

### Just TF / Parry

変身直後 200ms 以内に被弾 → ダメージ無効 + 衝撃波 (半径 60, 30 dmg) + 300 pts。

## Achievements

10 種の実績。結果画面で自動判定、クレジット報酬。

| Achievement | Condition | Reward |
|-------------|-----------|--------|
| First Clear | 任意ステージ初クリア | 100 Cr |
| Boss Slayer | ボス 3 体すべて撃破 | 300 Cr |
| All Forms | 全フォーム解放 | 500 Cr |
| All Stages | 全 15 ステージクリア | 1,000 Cr |
| No Damage Clear | 無傷でステージクリア | 500 Cr |
| Combo Master | 覚醒状態 10 回到達 | 200 Cr |
| Credit Hoarder | 累計 5,000 Cr 獲得 | 300 Cr |
| Speed Demon | 制限時間 50% 以内でクリア | 200 Cr |
| Guardian Angel | Guardian フォームでクリア | 200 Cr |
| Endless Survivor | エンドレスモード 5 分生存 | 500 Cr |
