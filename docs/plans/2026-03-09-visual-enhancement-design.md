# Visual Enhancement Design — パフォーマンス維持型ビジュアル改善

Date: 2026-03-09

## Overview

現在の `<Shadow blur={10}>` による GPU 負荷を削減しつつ、4つのアプローチで視覚品質を向上させる。全 Phase でパフォーマンスを維持または改善する。

## Current State

- 全128スロットの EntitySlot に `<Shadow blur={10}>` が毎フレーム適用されている
- PR #58 で `useDerivedValue` の大量追加と stroke Shadow が性能劣化を起こし即座に削除された教訓がある
- 背景は単色 `#0a0a14` + 星空24個 + グリッド線のみ
- パーティクルは通常合成（`srcOver`）で発光感が弱い

## Design

### Phase 1: Glow フェイク化（Shadow 除去 → 拡大パス重ね掛け）

**目的:** `<Shadow>` を除去し、軽量な拡大パスで発光感を再現する。

**変更ファイル:**
- `src/types/rendering.ts` — `glowPath`, `glowColor` フィールド追加
- `src/engine/systems/SyncRenderSystem.ts` — 1.4倍スケールの glowPath + glowColor を事前計算
- `src/rendering/GameCanvas.tsx` — `<Shadow>` 除去、glowPath を背面に描画

**glowPath 生成ロジック:**
```typescript
function buildGlowPath(type, x, y, w, h, scale) {
  const GLOW_SCALE = 1.4;
  const gw = w * GLOW_SCALE;
  const gh = h * GLOW_SCALE;
  const gx = x + (w - gw) / 2;  // 中心維持
  const gy = y + (h - gh) / 2;
  return getEntityPath(type, gx * scale, gy * scale, gw * scale, gh * scale) ?? undefined;
}
```

**glowColor 事前計算:**
```typescript
function toGlowColor(hex: string): string {
  return hex + '33';  // 20% opacity
}
```

**対象エンティティ:** `player`, `enemy`, `boss`, `playerBullet`, `enemyBullet`
**対象外:** `particle`, `debris`, `shockwave`（小さすぎるか一時的）

**EntitySlot 描画順序:**
```tsx
<Path path={glowPathStr} color={glowColor} opacity={fillOpacity} />  // 背面 glow
<Path path={pathStr} color={color} opacity={fillOpacity} />            // 前面 本体
```

**useDerivedValue 追加:** +2 (`glowPathStr`, `glowColor`)
**性能影響:** **改善**（Shadow の GPU blur 処理が完全になくなる）

---

### Phase 2: 加算合成（BlendMode）の導入

**目的:** 発光エンティティに `blendMode="screen"` を適用し、色が重なる部分が白く光るネオン感を演出する。

**変更ファイル:**
- `src/types/rendering.ts` — `blendMode?: string` フィールド追加
- `src/engine/systems/SyncRenderSystem.ts` — 対象エンティティに blendMode 設定
- `src/rendering/GameCanvas.tsx` — EntitySlot で blendMode を描画要素に適用

**適用対象:**

| エンティティ | BlendMode | 理由 |
|-------------|-----------|------|
| `particle` | `"screen"` | 爆発エフェクトの重なりで白く光る |
| `playerBullet` | `"screen"` | 弾幕密集時の発光感 |
| `exBeam` | `"screen"` | EXバースト発動時の輝き |
| `shockwave` | `"screen"` | パリィ衝撃波の発光 |
| `laserBeam` | `"screen"` | ボスレーザーの輝き |

**適用しない:** `player`, `enemy`, `boss`, `gate`, `debris`, `enemyBullet`, `laserWarning`, `boostLane`

**EntitySlot:**
```tsx
const blendMode = useDerivedValue(() => renderData.value[index]?.blendMode as any);
// Path, stroke Path, RoundedRect すべてに blendMode prop を適用
```

**useDerivedValue 追加:** +1
**性能影響:** ±ゼロ（GPU の固定機能パイプラインで処理）

---

### Phase 3: 残像（Trail）の実装

**目的:** プレイヤー機体のフォーム固有形状で残像を描画し、高速移動感を演出する。

**変更ファイル:**
- `src/types/entities.ts` — `PlayerEntity` に `trailHistory`, `trailIndex`, `trailFrameCount` 追加
- `src/constants/balance.ts` — Trail 関連定数追加
- `src/engine/systems/MovementSystem.ts` — 3フレームごとに位置を記録
- `src/engine/systems/SyncRenderSystem.ts` — trail 位置からフォーム形状の RenderEntity を生成

**定数:**
```typescript
TRAIL_HISTORY_SIZE = 3        // 残像の数
TRAIL_SAMPLE_INTERVAL = 3     // 3フレームごとに記録（60fps → 20Hz）
TRAIL_MIN_DISTANCE = 3        // 最小移動距離（静止時は残像なし）
TRAIL_BASE_OPACITY = 0.15     // 最新残像の不透明度
TRAIL_OPACITY_DECAY = 0.6     // 減衰率（0.15 → 0.09 → 0.054）
```

**データ構造:** リングバッファ（固定長配列 + インデックス更新, O(1), GC フリー）

**MovementSystem:**
```typescript
p.trailFrameCount++;
if (p.trailFrameCount >= TRAIL_SAMPLE_INTERVAL) {
  p.trailFrameCount = 0;
  const last = p.trailHistory[p.trailIndex];
  const dx = p.x - (last?.x ?? p.x);
  const dy = p.y - (last?.y ?? p.y);
  if (dx * dx + dy * dy >= TRAIL_MIN_DISTANCE * TRAIL_MIN_DISTANCE) {
    p.trailIndex = (p.trailIndex + 1) % TRAIL_HISTORY_SIZE;
    p.trailHistory[p.trailIndex] = { x: p.x, y: p.y };
  }
}
```

**SyncRenderSystem:** Player 描画の直前に trail を push（背面に来る）。glowPath/blendMode なし（軽量化）。

**128スロット影響:** 最大+3（通常使用 ~95 → ~98, 余裕あり）
**useDerivedValue 追加:** 0
**性能影響:** 軽微（RenderEntity 3個追加、Path 計算3回）

---

### Phase 4: スキャンラインオーバーレイ

**目的:** 画面全体にブラウン管風の走査線模様を重ね、レトロSF感を演出する。

**変更ファイル:**
- `src/rendering/GameCanvas.tsx` — `ScanlineOverlay` コンポーネント追加
- `src/constants/balance.ts` — スキャンライン関連定数追加

**手法:** `useTexture` で初回にスキャンラインパターンをテクスチャ化 → `Image` 1枚で描画（スクロール追従なし）

**定数:**
```typescript
SCANLINE_PITCH = 2          // 2px おきに 1px の黒線
SCANLINE_OPACITY = 0.04     // 不透明度 4%（微か）
```

**ScanlineOverlay:**
```tsx
function ScanlineOverlay({ width, height }) {
  const TILE_H = SCANLINE_PITCH * 64;
  const texture = useTexture(
    <Group>
      {Array.from({ length: TILE_H / SCANLINE_PITCH }, (_, i) => (
        <Rect key={i} x={0} y={i * SCANLINE_PITCH} width={4} height={1} color="#000000" />
      ))}
    </Group>,
    { width: 4, height: TILE_H }
  );
  if (!texture) return null;
  return <Image image={texture} x={0} y={0} width={width} height={height} opacity={SCANLINE_OPACITY} fit="cover" />;
}
```

**配置:** Canvas 内の最前面（全エンティティの上に重ねる）

**useDerivedValue 追加:** 0
**性能影響:** ±ゼロ（テクスチャ生成は初回のみ、毎フレームは Image 1枚）

---

## Performance Budget

| Phase | useDerivedValue 追加 | RenderEntity 追加 | GPU 影響 |
|-------|---------------------|------------------|---------|
| 1 | +2 | 0 | **改善**（Shadow 除去） |
| 2 | +1 | 0 | ±ゼロ |
| 3 | 0 | +3（最大） | 軽微 |
| 4 | 0 | 0 | ±ゼロ（Image 1枚） |
| **合計** | **+3** | **+3** | **純改善** |

PR #58 で削除された useDerivedValue は128個。今回の追加は3個で、影響は無視できるレベル。

## Implementation Order

1. **Phase 1** → 性能改善のベースライン確保（Shadow 除去）
2. **Phase 2** → Phase 1 の上に BlendMode を追加
3. **Phase 3** → Trail の追加
4. **Phase 4** → スキャンラインで仕上げ

Phase 1-2 は同じファイルを触るため連続で実装。Phase 3-4 は独立しており並列可能。

## Risks & Mitigations

| リスク | 確率 | 対策 |
|-------|------|------|
| フェイク Glow の見栄えが Shadow より劣る | 中 | GLOW_SCALE を 1.3〜1.5 で調整、glowColor の alpha を 15-30% で調整 |
| BlendMode="screen" が一部エンティティで色飛び | 低 | 対象を限定済み。合わなければ個別に外す |
| Trail が密集戦闘でスロット不足 | 極低 | 128スロット中 ~98 使用、30の余裕あり |
| useTexture が一部デバイスで遅延 | 低 | テクスチャ生成は初回のみ。null チェックで安全 |
