# Phase 2-B: コンテンツ拡充 — 設計

## Goal

ゲームのボリュームと深みを大幅に拡大する。新敵3種、ステージ6〜10（第2ボス含む）、ゲートバリエーション、スコアボーナス、新形態2種を追加。

## Checkpoints

```
CP1: 新敵タイプ + ステージ 6〜10 + ゲートバリエーション → PR & マージ
CP2: スコアボーナス → PR & マージ
CP3: 新形態（Sniper, Scatter） → PR & マージ
```

---

## CP1: 新敵 + ステージ + ゲート

### 新敵タイプ 3種

| 敵 | enemyType | HP | サイズ | 接触DMG | 射撃 | 移動 | スコア | Cr |
|----|-----------|-----|--------|---------|------|------|--------|----|
| Swarm | `swarm` | 1 | 16×16 | 5 | なし | 下降+sin横揺れ | 30 | 0 |
| Phalanx | `phalanx` | 60 | 36×36 | 15 | 2.0s間隔 | 左右巡回(40lps) | 300 | 3〜5 |
| Juggernaut | `juggernaut` | 120 | 56×48 | 25 | 3砲塔交互1.5s | 低速下降+左右 | 500 | 5〜8 |

#### Swarm
- HP1の小型機が大群で横一列 or V字フォーメーション出現
- Pierce で一列まとめて貫通 → High Speed 形態が最適

#### Phalanx — シールド判定
- 上半分にシールド: `bullet.y + bullet.height/2 < enemy.y + enemy.height/2` → ダメージ無効
- Explosion と Pierce はシールド無視
- Heavy Artillery の爆発で迂回、High Speed の貫通で貫通

#### Juggernaut — 3砲塔
- 独立エンティティではなく、shootTimer の剰余で左・中・右の発射位置を切替
- 位相ずらし: `shootTimer % (interval * 3)` で3段階に分岐
- 低速下降（スクロールの0.3倍速）で長時間滞在

### Boss 2（Stage 10）

- `createBoss(bossIndex)` — HP: `500 + 250 * bossIndex`
- Boss 2 (bossIndex=2): HP 1000, Phase `'all'` を HP 50% から, ドローン 4体
- 攻撃パターンは boss_1 と同じステートマシン（spread + laser + drone）

### 新ゲート

| ゲート名 | タイプ | 効果 |
|---------|--------|------|
| GATE_ATK_UP_15 | enhance | ATK +15 |
| GATE_FR_UP_30 | enhance | FR +30% |
| GATE_HEAL_FULL | recovery | HP 100% |
| GATE_RAPID_GLASS | tradeoff | FR ×2.0, HP -30 |
| GATE_TANK | tradeoff | HP +50, SPD ×0.7 |

新ペア: PAIR_ENHANCE_STRONG, PAIR_RECOVERY_FULL, PAIR_TRADEOFF_EXTREME, PAIR_ATK_FR

### ステージ 6〜10

| Stage | 名称 | 時間 | ボス | テーマ |
|-------|------|------|------|--------|
| 6 | Scrap Yard | 100s | - | Swarm 初登場 |
| 7 | Fortress Gate | 110s | - | Phalanx 初登場 |
| 8 | War Front | 120s | - | Juggernaut 初登場 |
| 9 | Final Approach | 130s | - | 全敵混合高密度 |
| 10 | Omega Core | 180s | boss_2 | 第2ボス戦 |

---

## CP2: スコアボーナス

| ボーナス | 条件 | 報酬 |
|---------|------|------|
| ノーダメージ | 被弾 0 回 | スコア ×1.5 + クレジット ×2 |
| コンボ | Awakened 発動回数 × 500pts | |
| フルクリア | 敵全撃破 | +1000 pts |
| スピードクリア | 残り時間 × 10pts | 非ボスステージのみ |

トラッキング状態（gameSessionStore）:
- `damageTaken: number`, `awakenedCount: number`, `enemiesSpawned: number`, `enemiesKilled: number`

リザルト画面に内訳表示を追加。

---

## CP3: 新形態

| 形態 | ATK | SPD | FR | 弾数 | 特殊能力 | 解放条件 |
|------|-----|-----|----|------|---------|---------|
| SD_Sniper | 2.5x | 0.6x | 0.3x | 1 | shield_pierce | Stage 7 クリア |
| SD_Scatter | 0.6x | 1.0x | 1.0x | 5 | none | Stage 8 クリア |

- `shield_pierce`: Phalanx シールドを無視、貫通はしない
- Scatter: 広角散弾（45°扇形）、ShootingSystem の既存 spread ロジックで対応
