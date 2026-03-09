# Visual Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Shadow 除去による性能改善 + 4つのビジュアルエフェクト追加（フェイクGlow, BlendMode, Trail, スキャンライン）

**Architecture:** SyncRenderSystem で事前計算した描画データ（glowPath, glowColor, blendMode）を RenderEntity 経由で Skia Canvas に渡す。Trail は MovementSystem でリングバッファに位置を記録し SyncRenderSystem で RenderEntity に展開。スキャンラインは useTexture で初回のみテクスチャ生成して Image 1枚で描画。

**Tech Stack:** @shopify/react-native-skia (Path, Image, useTexture), react-native-reanimated (useDerivedValue, SharedValue), TypeScript

**Design Doc:** `docs/plans/2026-03-09-visual-enhancement-design.md`

---

### Task 1: RenderEntity 型に glow / blendMode フィールドを追加

**Files:**
- Modify: `src/types/rendering.ts:1-18`

**Step 1: 型にフィールドを追加**

```typescript
// src/types/rendering.ts — 既存フィールドの後ろに追加
export type RenderEntity = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  label?: string;
  /** Pre-computed SVG path string (built on JS thread by SyncRenderSystem) */
  path?: string;
  /** HP ratio 0–1 for entities with health bars (enemies, debris, boss) */
  hpRatio?: number;
  /** Growth gate progress 0–1 (current value / max value) */
  gateProgress?: number;
  /** Pre-computed HP bar color (green/yellow/red based on hpRatio) */
  hpBarColor?: string;
  /** Enlarged SVG path for fake glow effect (drawn behind main shape at low opacity) */
  glowPath?: string;
  /** Pre-computed glow color with embedded alpha (e.g. '#00D4FF33') */
  glowColor?: string;
  /** Skia BlendMode name for additive blending (e.g. 'screen') */
  blendMode?: string;
};
```

**Step 2: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS (新フィールドはすべて optional)

**Step 3: コミット**

```bash
git add src/types/rendering.ts
git commit -m "feat: Add glowPath, glowColor, blendMode fields to RenderEntity type"
```

---

### Task 2: SyncRenderSystem に glowPath / glowColor / blendMode 生成を追加

**Files:**
- Modify: `src/engine/systems/SyncRenderSystem.ts:21-30` (ヘルパー追加)
- Modify: `src/engine/systems/SyncRenderSystem.ts:57-178` (各エンティティの push に glow/blendMode 追加)

**Step 1: ヘルパー関数を追加**

`buildPath` 関数の直後（`getHpBarColor` の前）に追加:

```typescript
/** Build enlarged glow path (centered, 1.4x scale) for fake glow effect */
function buildGlowPath(type: string, x: number, y: number, w: number, h: number, scale: number): string | undefined {
  const GLOW_SCALE = 1.4;
  const gw = w * GLOW_SCALE;
  const gh = h * GLOW_SCALE;
  const gx = x + (w - gw) / 2;
  const gy = y + (h - gh) / 2;
  return getEntityPath(type, gx * scale, gy * scale, gw * scale, gh * scale) ?? undefined;
}

/** Convert hex color to glow color with 20% alpha: '#RRGGBB' → '#RRGGBB33' */
function toGlowColor(hex: string): string {
  return hex + '33';
}
```

**Step 2: Player の push に glow を追加**

```typescript
// Player push (既存コードに glowPath, glowColor を追加)
out.push({
  type: playerType,
  x: p.x,
  y: p.y,
  width: p.width,
  height: p.height,
  color: COLORS.entityPlayer,
  opacity,
  path: buildPath(playerType, p.x, p.y, p.width, p.height, scale),
  glowPath: buildGlowPath(playerType, p.x, p.y, p.width, p.height, scale),
  glowColor: toGlowColor(COLORS.entityPlayer),
});
```

**Step 3: Enemy の push に glow を追加**

```typescript
out.push({
  type: enemyRenderType,
  x: e.x,
  y: e.y,
  width: e.width,
  height: e.height,
  color: enemyColor,
  opacity: 1.0,
  path: buildPath(enemyRenderType, e.x, e.y, e.width, e.height, scale),
  glowPath: buildGlowPath(enemyRenderType, e.x, e.y, e.width, e.height, scale),
  glowColor: toGlowColor(enemyColor),
  hpRatio: e.hp / e.maxHp,
  hpBarColor: getHpBarColor(e.hp / e.maxHp),
});
```

**Step 4: Boss の push に glow を追加**

```typescript
out.push({
  type: 'boss',
  x: b.x,
  y: b.y,
  width: b.width,
  height: b.height,
  color: COLORS.entityBoss,
  opacity: 1.0,
  path: buildPath('boss', b.x, b.y, b.width, b.height, scale),
  glowPath: buildGlowPath('boss', b.x, b.y, b.width, b.height, scale),
  glowColor: toGlowColor(COLORS.entityBoss),
});
```

**Step 5: PlayerBullet の push に glow + blendMode を追加**

```typescript
out.push({
  type: 'playerBullet',
  x: b.x,
  y: b.y,
  width: b.width,
  height: b.height,
  color: COLORS.entityPlayerBullet,
  opacity: 1.0,
  path: buildPath('playerBullet', b.x, b.y, b.width, b.height, scale),
  glowPath: buildGlowPath('playerBullet', b.x, b.y, b.width, b.height, scale),
  glowColor: toGlowColor(COLORS.entityPlayerBullet),
  blendMode: 'screen',
});
```

**Step 6: EnemyBullet の push に glow を追加（blendMode なし — 敵弾は通常合成）**

```typescript
out.push({
  type: 'enemyBullet',
  x: b.x,
  y: b.y,
  width: b.width,
  height: b.height,
  color: COLORS.entityEnemyBullet,
  opacity: 1.0,
  path: buildPath('enemyBullet', b.x, b.y, b.width, b.height, scale),
  glowPath: buildGlowPath('enemyBullet', b.x, b.y, b.width, b.height, scale),
  glowColor: toGlowColor(COLORS.entityEnemyBullet),
});
```

**Step 7: Particle の push に blendMode を追加（glowPath なし — 小さすぎる）**

```typescript
out.push({
  type: 'particle',
  x: px,
  y: py,
  width: pt.size,
  height: pt.size,
  color: pt.color,
  opacity,
  path: buildPath('particle', px, py, pt.size, pt.size, scale),
  blendMode: 'screen',
});
```

**Step 8: EX Beam / Laser Beam / Shockwave の push に blendMode を追加**

exBeam:
```typescript
out.push({
  type: 'exBeam',
  x: beamX,
  y: 0,
  width: EX_BURST_WIDTH,
  height: p.y,
  color: '#00E5FF',
  opacity: 0.35,
  blendMode: 'screen',
});
```

laserBeam (firing のみ):
```typescript
out.push({
  type: 'laserBeam',
  x: boss.laserX - BOSS_LASER_WIDTH / 2,
  y: boss.y + boss.height,
  width: BOSS_LASER_WIDTH,
  height: entities.screen.visibleHeight,
  color: '#FF0044',
  opacity: 0.7,
  blendMode: 'screen',
});
```

shockwave:
```typescript
out.push({
  type: 'shockwave',
  x: swX,
  y: swY,
  width: swSize,
  height: swSize,
  color: COLORS.white,
  opacity: opacity * 0.5,
  path: buildPath('shockwave', swX, swY, swSize, swSize, scale),
  blendMode: 'screen',
});
```

**Step 9: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 10: コミット**

```bash
git add src/engine/systems/SyncRenderSystem.ts
git commit -m "feat: Generate glowPath/glowColor/blendMode in SyncRenderSystem"
```

---

### Task 3: GameCanvas の EntitySlot を Shadow 除去 + フェイクGlow + BlendMode に変更

**Files:**
- Modify: `src/rendering/GameCanvas.tsx:1-11` (import から Shadow を削除)
- Modify: `src/rendering/GameCanvas.tsx:95-233` (EntitySlot コンポーネント全体)

**Step 1: import から Shadow を削除**

```typescript
// Before:
import {
  Canvas,
  matchFont,
  Path,
  Rect,
  RoundedRect,
  Shadow,
  Text as SkiaText,
} from '@shopify/react-native-skia';

// After:
import {
  Canvas,
  matchFont,
  Path,
  Rect,
  RoundedRect,
  Text as SkiaText,
} from '@shopify/react-native-skia';
```

**Step 2: EntitySlot に glowPath / glowColor / blendMode の useDerivedValue を追加**

`pathStr` と `type` の useDerivedValue の後ろに追加:

```typescript
const glowPathStr = useDerivedValue(() => renderData.value[index]?.glowPath ?? '');
const glowColor = useDerivedValue(() => renderData.value[index]?.glowColor ?? 'transparent');
const blendMode = useDerivedValue(() => renderData.value[index]?.blendMode as any);
```

**Step 3: EntitySlot の return JSX を変更**

```tsx
return (
  <>
    {/* Fake glow: enlarged path at embedded alpha, behind main shape */}
    <Path path={glowPathStr} color={glowColor} opacity={fillOpacity} />
    {/* Main shape: no Shadow, with optional blendMode */}
    <Path path={pathStr} color={color} opacity={fillOpacity} blendMode={blendMode} />
    {/* Stroke ring (shockwave only) with blendMode */}
    <Path path={pathStr} color={color} opacity={strokeOpacity} style="stroke" strokeWidth={2} blendMode={blendMode} />
    {/* Non-gate rect types (boostLane, beams) with blendMode */}
    <RoundedRect x={x} y={y} width={width} height={height} r={2} color={color} opacity={rectOpacity} blendMode={blendMode} />

    {/* === Gate rendering: unchanged === */}
    <RoundedRect x={x} y={y} width={width} height={height} r={2} color={color} opacity={gateFillOpacity} />
    <Rect x={x} y={y} width={width} height={1} color="#FFFFFF" opacity={gateBorderOpacity} />
    <Rect x={x} y={gateBorderBottomY} width={width} height={1} color="#FFFFFF" opacity={gateBorderOpacity} />
    <Rect x={x} y={y} width={GATE_ACCENT_W} height={height} color={color} opacity={gateAccentOpacity} />
    <Rect x={gateRightAccentX} y={y} width={GATE_ACCENT_W} height={height} color={color} opacity={gateAccentOpacity} />
    <Rect x={x} y={y} width={gateProgressW} height={height} color={color} opacity={gateProgressOpacity} />
    <SkiaText x={labelX} y={labelY} text={label} font={gateLabelFont} color="#FFFFFF" opacity={gateLabelOpacity} />

    {/* HP bar: unchanged */}
    <Rect x={x} y={hpBarY} width={width} height={HP_BAR_H} color="#333333" opacity={hpBarTrackOpacity} />
    <Rect x={x} y={hpBarY} width={hpBarFillW} height={HP_BAR_H} color={hpBarColor} opacity={hpBarFillOpacity} />
  </>
);
```

**Step 4: 型チェック + Lint**

Run: `npx tsc --noEmit && npx expo lint`
Expected: PASS

**Step 5: コミット**

```bash
git add src/rendering/GameCanvas.tsx
git commit -m "feat: Replace Shadow with fake glow paths and add BlendMode support"
```

---

### Task 4: PlayerEntity に Trail フィールドを追加 + 定数追加

**Files:**
- Modify: `src/types/entities.ts:22-29` (PlayerEntity)
- Modify: `src/constants/balance.ts` (末尾に定数追加)
- Modify: `src/engine/entities/Player.ts:6-20` (createPlayer)

**Step 1: PlayerEntity に trail フィールドを追加**

```typescript
export interface PlayerEntity extends BaseEntity {
  type: 'player';
  isInvincible: boolean;
  invincibleTimer: number;
  /** When set, player slides toward this position (from tap gesture) */
  targetX: number | null;
  targetY: number | null;
  /** Ring buffer of recent positions for trail rendering */
  trailHistory: Array<{ x: number; y: number }>;
  /** Current write index in trailHistory ring buffer */
  trailIndex: number;
  /** Frame counter for trail sampling */
  trailFrameCount: number;
}
```

**Step 2: balance.ts に Trail 定数を追加**

`src/constants/balance.ts` の末尾（`FORM_XP_THRESHOLDS` の後）に追加:

```typescript
/** Trail (afterimage) */
export const TRAIL_HISTORY_SIZE = 3;
export const TRAIL_SAMPLE_INTERVAL = 3;
export const TRAIL_MIN_DISTANCE_SQ = 9; // 3^2 — avoid sqrt per frame
export const TRAIL_BASE_OPACITY = 0.15;
export const TRAIL_OPACITY_DECAY = 0.6;
```

**Step 3: createPlayer に trail 初期化を追加**

```typescript
import { TRAIL_HISTORY_SIZE } from '@/constants/balance';

export function createPlayer(x: number, y: number): PlayerEntity {
  return {
    id: `player_${nextId++}`,
    type: 'player',
    x,
    y,
    width: HITBOX.playerVisual.width,
    height: HITBOX.playerVisual.height,
    active: true,
    isInvincible: false,
    invincibleTimer: 0,
    targetX: null,
    targetY: null,
    trailHistory: Array.from({ length: TRAIL_HISTORY_SIZE }, () => ({ x, y })),
    trailIndex: 0,
    trailFrameCount: 0,
  };
}
```

**Step 4: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 5: コミット**

```bash
git add src/types/entities.ts src/constants/balance.ts src/engine/entities/Player.ts
git commit -m "feat: Add trail history fields to PlayerEntity and trail constants"
```

---

### Task 5: MovementSystem に Trail 記録ロジックを追加

**Files:**
- Modify: `src/engine/systems/MovementSystem.ts:1-10` (import 追加)
- Modify: `src/engine/systems/MovementSystem.ts:52-58` (clamp の直後に trail 記録)

**Step 1: import 追加**

```typescript
import { PLAYER_MOVE_SPEED, BASE_SCROLL_SPEED, BOOST_LANE_SCROLL_MULTIPLIER, TRAIL_SAMPLE_INTERVAL, TRAIL_MIN_DISTANCE_SQ, TRAIL_HISTORY_SIZE } from '@/constants/balance';
```

**Step 2: player clamp の直後（58行目の後）に trail 記録を追加**

```typescript
  // Clamp player position to allowed bounds (§3.1)
  p.x = Math.max(PLAYER_MIN_X, Math.min(PLAYER_MAX_X - p.width, p.x));
  p.y = Math.max(minY, Math.min(maxY - p.height, p.y));

  // Record trail position (ring buffer, every N frames, only when moving)
  p.trailFrameCount++;
  if (p.trailFrameCount >= TRAIL_SAMPLE_INTERVAL) {
    p.trailFrameCount = 0;
    const lastIdx = p.trailIndex;
    const last = p.trailHistory[lastIdx];
    const tdx = p.x - last.x;
    const tdy = p.y - last.y;
    if (tdx * tdx + tdy * tdy >= TRAIL_MIN_DISTANCE_SQ) {
      const nextIdx = (lastIdx + 1) % TRAIL_HISTORY_SIZE;
      p.trailHistory[nextIdx] = { x: p.x, y: p.y };
      p.trailIndex = nextIdx;
    }
  }
```

**Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: コミット**

```bash
git add src/engine/systems/MovementSystem.ts
git commit -m "feat: Record player trail positions in MovementSystem"
```

---

### Task 6: SyncRenderSystem に Trail RenderEntity 生成を追加

**Files:**
- Modify: `src/engine/systems/SyncRenderSystem.ts` (import 追加 + Player 描画の直前に trail push)

**Step 1: import 追加**

```typescript
import { IFRAME_BLINK_INTERVAL, SHOCKWAVE_EFFECT_DURATION, JUST_TF_SHOCKWAVE_RADIUS, EX_BURST_WIDTH, BOSS_LASER_WIDTH, TRAIL_HISTORY_SIZE, TRAIL_BASE_OPACITY, TRAIL_OPACITY_DECAY } from '@/constants/balance';
```

**Step 2: Player 描画の直前（`// Player — form-specific shape` コメントの直前）に trail 生成を追加**

```typescript
    // Player trail (afterimage) — drawn behind player
    const p = entities.player;
    if (p.active) {
      const playerType = `player_${useGameSessionStore.getState().currentForm}`;
      for (let i = 0; i < TRAIL_HISTORY_SIZE; i++) {
        const idx = (p.trailIndex - i - 1 + TRAIL_HISTORY_SIZE * 2) % TRAIL_HISTORY_SIZE;
        const pos = p.trailHistory[idx];
        const tdx = p.x - pos.x;
        const tdy = p.y - pos.y;
        if (tdx * tdx + tdy * tdy < 1) continue;
        const age = i + 1;
        const trailOpacity = TRAIL_BASE_OPACITY * Math.pow(TRAIL_OPACITY_DECAY, age - 1);
        out.push({
          type: playerType,
          x: pos.x,
          y: pos.y,
          width: p.width,
          height: p.height,
          color: COLORS.entityPlayer,
          opacity: trailOpacity,
          path: buildPath(playerType, pos.x, pos.y, p.width, p.height, scale),
        });
      }
    }

    // Player — form-specific shape
```

注意: 既存の `const p = entities.player;` を trail セクションに移動し、Player セクションの重複宣言を削除する。

**Step 3: 型チェック**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 4: コミット**

```bash
git add src/engine/systems/SyncRenderSystem.ts
git commit -m "feat: Generate trail afterimage RenderEntities for player"
```

---

### Task 7: スキャンラインオーバーレイを GameCanvas に追加

**Files:**
- Modify: `src/constants/balance.ts` (末尾に定数追加)
- Modify: `src/rendering/GameCanvas.tsx` (ScanlineOverlay コンポーネント追加 + Canvas 内に配置)

**Step 1: balance.ts にスキャンライン定数を追加**

```typescript
/** Scanline overlay */
export const SCANLINE_PITCH = 2;
export const SCANLINE_OPACITY = 0.04;
```

**Step 2: GameCanvas.tsx に import を追加**

```typescript
import {
  Canvas,
  Group,
  Image,
  matchFont,
  Path,
  Rect,
  RoundedRect,
  Text as SkiaText,
  useTexture,
} from '@shopify/react-native-skia';
```

`SCANLINE_PITCH, SCANLINE_OPACITY` を balance.ts の import に追加:

```typescript
import { SCORE_POPUP_FONT_SIZE, SCANLINE_PITCH, SCANLINE_OPACITY } from '@/constants/balance';
```

**Step 3: ScanlineOverlay コンポーネントを追加**

`GameCanvasInner` の直前に配置:

```tsx
function ScanlineOverlay({ width, height }: { width: number; height: number }) {
  const TILE_H = SCANLINE_PITCH * 64;
  const texture = useTexture(
    <Group>
      {Array.from({ length: Math.floor(TILE_H / SCANLINE_PITCH) }, (_, i) => (
        <Rect key={i} x={0} y={i * SCANLINE_PITCH} width={4} height={1} color="#000000" />
      ))}
    </Group>,
    { width: 4, height: TILE_H }
  );
  if (!texture) return null;
  return (
    <Image
      image={texture}
      x={0}
      y={0}
      width={width}
      height={height}
      opacity={SCANLINE_OPACITY}
      fit="cover"
    />
  );
}
```

**Step 4: Canvas 内の最前面に ScanlineOverlay を配置**

`GameCanvasInner` の `<Canvas>` 内、`<ScorePopups>` の直後に追加:

```tsx
<Canvas style={{ width, height }}>
  {/* Background */}
  <Rect x={0} y={0} width={width} height={height} color={COLORS.bgDark} />
  <StarField ... />
  {/* Grid */}
  {/* Entities */}
  {entitySlots.map(...)}
  <ScorePopups ... />
  {/* Scanline overlay — topmost layer */}
  <ScanlineOverlay width={width} height={height} />
</Canvas>
```

**Step 5: 型チェック + Lint**

Run: `npx tsc --noEmit && npx expo lint`
Expected: PASS

**Step 6: コミット**

```bash
git add src/constants/balance.ts src/rendering/GameCanvas.tsx
git commit -m "feat: Add scanline overlay texture for retro SF atmosphere"
```

---

### Task 8: 最終検証

**Step 1: 全品質チェック**

Run: `npx expo lint && npx tsc --noEmit && npx jest --passWithNoTests`
Expected: ALL PASS

**Step 2: git log で全コミットを確認**

Run: `git log --oneline -7`

Expected (7 commits):
```
feat: Add scanline overlay texture for retro SF atmosphere
feat: Generate trail afterimage RenderEntities for player
feat: Record player trail positions in MovementSystem
feat: Add trail history fields to PlayerEntity and trail constants
feat: Replace Shadow with fake glow paths and add BlendMode support
feat: Generate glowPath/glowColor/blendMode in SyncRenderSystem
feat: Add glowPath, glowColor, blendMode fields to RenderEntity type
```
