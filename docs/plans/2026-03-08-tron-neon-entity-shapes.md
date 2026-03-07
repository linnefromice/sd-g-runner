# Tron-Style Neon Entity Shapes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the generic `RoundedRect` entity rendering with Skia `Path`-based shapes per entity type, using a Tron-style neon aesthetic (sharp geometric outlines + glow).

**Architecture:** Each entity type gets a dedicated SVG path string builder in `src/rendering/shapes.ts`. `EntitySlot` in `GameCanvas.tsx` branches on the `type` field (already present in `RenderEntity`) to select the appropriate path. The existing `Shadow` component provides the neon glow. A second semi-transparent stroke layer adds the outer bloom characteristic of Tron's visual style.

**Tech Stack:** `@shopify/react-native-skia` (Path, Shadow, Group), `react-native-reanimated` (useDerivedValue)

---

## Entity Shape Definitions

| Entity Type | Shape | Description |
|-------------|-------|-------------|
| `player` | Arrow / fighter silhouette | Forward-pointing chevron (triangle with notched tail) |
| `enemy` | Inverted triangle | Downward-pointing triangle (attacking direction) |
| `boss` | Hexagon | Large imposing hexagonal shape |
| `playerBullet` | Diamond (tall) | Vertically elongated diamond |
| `enemyBullet` | Diamond (wide) | Small horizontally elongated diamond |
| `gate` | Rounded rect (keep current) | Gates use label text — rect is appropriate |
| `debris` | Irregular polygon (pentagon) | Rough rocky shape |
| `particle` | Small circle | Tiny dot — circle via path |
| `shockwave` | Circle outline (stroke only) | Expanding ring |
| `boostLane` | Rect (keep current) | Full-height background overlay — rect is correct |

---

## Task 1: Create shape path builder functions

**Files:**
- Create: `src/rendering/shapes.ts`

**Step 1: Write the shape builder module**

Create pure functions that return SVG path strings given (x, y, width, height). These run inside `useDerivedValue` on the UI thread, so they must be lightweight — string concatenation only, no `Skia.Path.Make()`.

```typescript
// src/rendering/shapes.ts

/**
 * Forward-pointing arrow / chevron shape for player.
 * Points: top-center, bottom-right, center-notch, bottom-left
 */
export function playerPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const top = y;
  const bottom = y + h;
  const notch = y + h * 0.7;
  return `M ${cx} ${top} L ${x + w} ${bottom} L ${cx} ${notch} L ${x} ${bottom} Z`;
}

/**
 * Inverted triangle for enemies (pointing down = attack direction).
 */
export function enemyPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  return `M ${x} ${y} L ${x + w} ${y} L ${cx} ${y + h} Z`;
}

/**
 * Hexagon for boss.
 */
export function bossPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  return [
    `M ${cx} ${y}`,
    `L ${x + w} ${cy - ry * 0.5}`,
    `L ${x + w} ${cy + ry * 0.5}`,
    `L ${cx} ${y + h}`,
    `L ${x} ${cy + ry * 0.5}`,
    `L ${x} ${cy - ry * 0.5}`,
    'Z',
  ].join(' ');
}

/**
 * Vertically elongated diamond for player bullets.
 */
export function playerBulletPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return `M ${cx} ${y} L ${x + w} ${cy} L ${cx} ${y + h} L ${x} ${cy} Z`;
}

/**
 * Small diamond for enemy bullets.
 */
export function enemyBulletPath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return `M ${cx} ${y} L ${x + w} ${cy} L ${cx} ${y + h} L ${x} ${cy} Z`;
}

/**
 * Irregular pentagon for debris (rocky feel).
 */
export function debrisPath(x: number, y: number, w: number, h: number): string {
  return [
    `M ${x + w * 0.2} ${y}`,
    `L ${x + w * 0.8} ${y + h * 0.1}`,
    `L ${x + w} ${y + h * 0.6}`,
    `L ${x + w * 0.5} ${y + h}`,
    `L ${x} ${y + h * 0.5}`,
    'Z',
  ].join(' ');
}

/**
 * Circle approximation via 4-point Bezier for particles.
 */
export function circlePath(x: number, y: number, w: number, h: number): string {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const k = 0.5522847498; // 4/3 * (sqrt(2) - 1)
  const kx = rx * k;
  const ky = ry * k;
  return [
    `M ${cx} ${y}`,
    `C ${cx + kx} ${y} ${x + w} ${cy - ky} ${x + w} ${cy}`,
    `C ${x + w} ${cy + ky} ${cx + kx} ${y + h} ${cx} ${y + h}`,
    `C ${cx - kx} ${y + h} ${x} ${cy + ky} ${x} ${cy}`,
    `C ${x} ${cy - ky} ${cx - kx} ${y} ${cx} ${y}`,
    'Z',
  ].join(' ');
}

/**
 * Select path builder by entity type. Returns null for types that should
 * keep using Rect (gate, boostLane).
 */
export function getEntityPath(
  type: string,
  x: number,
  y: number,
  w: number,
  h: number,
): string | null {
  switch (type) {
    case 'player':       return playerPath(x, y, w, h);
    case 'enemy':        return enemyPath(x, y, w, h);
    case 'boss':         return bossPath(x, y, w, h);
    case 'playerBullet': return playerBulletPath(x, y, w, h);
    case 'enemyBullet':  return enemyBulletPath(x, y, w, h);
    case 'debris':       return debrisPath(x, y, w, h);
    case 'particle':     return circlePath(x, y, w, h);
    case 'shockwave':    return circlePath(x, y, w, h);
    default:             return null; // gate, boostLane → Rect
  }
}
```

**Step 2: Verify types compile**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/rendering/shapes.ts
git commit -m "feat: Add Skia path builder functions for Tron-style entity shapes"
```

---

## Task 2: Refactor EntitySlot to use Path + fallback Rect

**Files:**
- Modify: `src/rendering/GameCanvas.tsx`

**Step 1: Update imports**

Add `Path`, `Group`, and `Circle` from Skia. Import `getEntityPath` from shapes module.

```typescript
import {
  Canvas,
  matchFont,
  Rect,
  RoundedRect,
  Shadow,
  Text as SkiaText,
  Path,
  Group,
  Circle,
} from '@shopify/react-native-skia';
import { getEntityPath } from '@/rendering/shapes';
```

**Step 2: Refactor EntitySlot to branch on type**

Replace the single `RoundedRect` with conditional rendering. Use `useDerivedValue` to compute the SVG path string. When the path is `null` (gate, boostLane), fall back to `RoundedRect`.

The key insight: we need TWO rendering layers per entity for the Tron neon effect:
1. **Inner fill** — the entity shape with full color
2. **Outer glow** — `Shadow` component on the same shape

```typescript
function EntitySlot({
  renderData,
  index,
  scale,
}: {
  renderData: GameCanvasProps['renderData'];
  index: number;
  scale: number;
}) {
  const entity = useDerivedValue(() => renderData.value[index]);

  const x = useDerivedValue(() => (entity.value?.x ?? -200) * scale);
  const y = useDerivedValue(() => (entity.value?.y ?? -200) * scale);
  const width = useDerivedValue(() => (entity.value?.width ?? 0) * scale);
  const height = useDerivedValue(() => (entity.value?.height ?? 0) * scale);
  const color = useDerivedValue(() => entity.value?.color ?? 'transparent');
  const opacity = useDerivedValue(() => entity.value?.opacity ?? 0);
  const type = useDerivedValue(() => entity.value?.type ?? '');

  // Compute SVG path string — null for rect-based types
  const pathStr = useDerivedValue(() => {
    const e = entity.value;
    if (!e) return '';
    return getEntityPath(e.type, e.x * scale, e.y * scale, e.width * scale, e.height * scale) ?? '';
  });

  // Whether this entity uses a path or rect
  const usePath = useDerivedValue(() => pathStr.value !== '');

  // Shockwave is stroke-only (ring effect)
  const isStroke = useDerivedValue(() => type.value === 'shockwave');

  // Path-based entity
  // Note: We render BOTH Path and RoundedRect but one will always have
  // empty/offscreen values. This avoids conditional React tree changes
  // which would break the pre-allocated slot pattern.
  return (
    <Group opacity={opacity}>
      {/* Path-based shape (neon fill + glow) */}
      <Path
        path={pathStr}
        color={color}
        style={isStroke.value ? 'stroke' : 'fill'}
        strokeWidth={2}
      >
        <Shadow dx={0} dy={0} blur={8} color={color} />
      </Path>
      {/* Rect fallback for gate/boostLane (when pathStr is empty, Path renders nothing) */}
      <RoundedRect
        x={x}
        y={y}
        width={width}
        height={height}
        r={2}
        color={color}
        opacity={usePath.value ? 0 : 1}
      >
        <Shadow dx={0} dy={0} blur={6} color={color} />
      </RoundedRect>
    </Group>
  );
}
```

**IMPORTANT CONSTRAINT:** The `isStroke` derived value used in `style` prop needs careful handling. Skia's `style` prop may not accept a derived value directly. If this doesn't work with derived values, we'll need an alternative approach — see Task 3 for the shockwave-specific solution.

**Step 3: Verify types and lint**

Run: `npx tsc --noEmit && npx expo lint`

**Step 4: Commit**

```bash
git add src/rendering/GameCanvas.tsx
git commit -m "feat: Refactor EntitySlot to use Path shapes with Tron neon glow"
```

---

## Task 3: Handle shockwave stroke rendering

**Files:**
- Modify: `src/rendering/GameCanvas.tsx`

The shockwave needs `style="stroke"` (ring outline only), while all other entities use `style="fill"`. Since Skia props may not support dynamic `style` switching via `useDerivedValue`, use TWO Path components — one fill, one stroke — and toggle visibility via opacity.

**Step 1: Modify EntitySlot**

```typescript
// Inside EntitySlot — replace the single Path with two:
const strokeOpacity = useDerivedValue(() =>
  type.value === 'shockwave' ? (entity.value?.opacity ?? 0) : 0
);
const fillOpacity = useDerivedValue(() =>
  type.value === 'shockwave' ? 0 : (entity.value?.opacity ?? 0)
);

// Fill path (all shapes except shockwave)
<Path path={pathStr} color={color} opacity={fillOpacity}>
  <Shadow dx={0} dy={0} blur={8} color={color} />
</Path>

// Stroke path (shockwave ring only)
<Path path={pathStr} color={color} opacity={strokeOpacity}
  style="stroke" strokeWidth={2}>
  <Shadow dx={0} dy={0} blur={12} color={color} />
</Path>
```

**Step 2: Test on device**

Trigger a Just TF parry to verify shockwave renders as an expanding neon ring.

**Step 3: Commit**

```bash
git add src/rendering/GameCanvas.tsx
git commit -m "feat: Add stroke-only shockwave ring rendering"
```

---

## Task 4: Add gate label text rendering to EntitySlot

**Files:**
- Modify: `src/rendering/GameCanvas.tsx`

Gates display a text label (e.g., "ATK +5"). Currently this label data is in `RenderEntity.label` but is not rendered. Add `SkiaText` inside EntitySlot for gate labels.

**Step 1: Add label rendering**

```typescript
// Inside EntitySlot, after the RoundedRect:
const label = useDerivedValue(() => entity.value?.label ?? '');
const labelX = useDerivedValue(() => (entity.value?.x ?? -200) * scale + 4);
const labelY = useDerivedValue(() => ((entity.value?.y ?? -200) + (entity.value?.height ?? 0) / 2 + 4) * scale);

<SkiaText
  x={labelX}
  y={labelY}
  text={label}
  font={gateLabelFont}
  color="#FFFFFF"
  opacity={opacity}
/>
```

**Step 2: Define gate label font**

```typescript
const gateLabelFontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });
const gateLabelFont = matchFont({
  fontFamily: gateLabelFontFamily,
  fontSize: 8,
  fontWeight: 'bold',
} as const);
```

**Step 3: Verify and commit**

Run: `npx tsc --noEmit && npx expo lint`

```bash
git add src/rendering/GameCanvas.tsx
git commit -m "feat: Add gate label text rendering in EntitySlot"
```

---

## Task 5: Enhance neon glow with dual-layer effect

**Files:**
- Modify: `src/rendering/GameCanvas.tsx`

The Tron aesthetic uses a bright inner shape + diffuse outer glow. Add a second `Shadow` with higher blur for the outer bloom.

**Step 1: Add outer glow layer**

For path-based entities, use nested Shadows:

```typescript
<Path path={pathStr} color={color} opacity={fillOpacity}>
  <Shadow dx={0} dy={0} blur={4} color={color} inner />
  <Shadow dx={0} dy={0} blur={10} color={color} />
</Path>
```

The `inner` shadow creates a bright edge effect, and the larger outer blur creates the characteristic Tron bloom.

**Step 2: Tune glow values per entity type**

If needed, increase blur for larger entities (boss: blur=14) and decrease for small ones (particle: blur=4). This can be done via a derived blur value:

```typescript
const glowBlur = useDerivedValue(() => {
  switch (type.value) {
    case 'boss': return 14;
    case 'particle': return 4;
    case 'playerBullet':
    case 'enemyBullet': return 6;
    default: return 10;
  }
});
```

**Note:** Check if `Shadow`'s `blur` prop accepts a `SharedValue`. If not, use a fixed value (10) for all — the visual difference is minor.

**Step 3: Commit**

```bash
git add src/rendering/GameCanvas.tsx
git commit -m "feat: Add dual-layer neon glow for Tron aesthetic"
```

---

## Task 6: Update entity colors for Tron palette

**Files:**
- Modify: `src/constants/colors.ts` — add entity-specific Tron neon colors
- Modify: `src/engine/systems/SyncRenderSystem.ts` — use new color constants

**Step 1: Add Tron entity colors to constants**

```typescript
// In COLORS object:
entityPlayer: '#00D4FF',      // Bright cyan (protagonist)
entityEnemy: '#FF3366',        // Hot pink-red
entityBoss: '#FF0044',         // Deep red with high saturation
entityPlayerBullet: '#00FFCC', // Cyan-green
entityEnemyBullet: '#FF006E',  // Neon pink (existing)
entityDebris: '#886644',       // Muted amber (less neon, more environmental)
entityParticle: '#FFFFFF',     // White (particles inherit per-effect color, this is fallback)
entityShockwave: '#FFFFFF',    // Pure white ring
```

**Step 2: Use constants in SyncRenderSystem**

Replace hardcoded hex colors:
- `'#4488FF'` → `COLORS.entityPlayer`
- `'#FF4444'` → `COLORS.entityEnemy`
- `'#CC0000'` → `COLORS.entityBoss`
- `'#00D4FF'` → `COLORS.entityPlayerBullet`
- `'#FF006E'` → (keep, already matches)
- `'#8B7355'` → `COLORS.entityDebris`

**Step 3: Commit**

```bash
git add src/constants/colors.ts src/engine/systems/SyncRenderSystem.ts
git commit -m "feat: Apply Tron neon color palette to all entities"
```

---

## Task 7: Performance verification and cleanup

**Files:**
- All modified files

**Step 1: Run full quality check**

```bash
npx tsc --noEmit && npx expo lint && npx jest --passWithNoTests
```

**Step 2: Device test — performance**

Test on device with high entity count (50+ entities):
- Verify 60fps is maintained
- Check that Path SVG string computation in `useDerivedValue` doesn't cause frame drops
- If frame drops occur, consider pre-computing common paths as constants

**Step 3: Visual inspection checklist**

- [ ] Player renders as forward-pointing arrow
- [ ] Enemies render as inverted triangles
- [ ] Boss renders as hexagon
- [ ] Player bullets are diamond-shaped
- [ ] Enemy bullets are diamond-shaped
- [ ] Debris is irregular polygon
- [ ] Particles are circular
- [ ] Shockwave is an expanding ring (stroke only)
- [ ] Gates remain as rounded rects with label text
- [ ] Boost lane remains as full-height rect overlay
- [ ] All entities have neon glow
- [ ] i-frame blink still works on player
- [ ] Screen shake applies to all shapes correctly

**Step 4: Final commit if any fixes needed**

---

## Risk Mitigation

### SVG path string in `useDerivedValue`

Building SVG path strings on every frame for 50+ entities could be expensive. Mitigation:
- Path functions use simple string concatenation (no array joins where possible)
- If performance is an issue, cache paths by rounding coordinates to integers

### Skia `Path` with dynamic `path` prop

The `Path` component re-parses the SVG string when it changes. This is expected to work since Skia's SVG parser is native C++ and fast, but monitor for issues.

### `Shadow` `blur` with SharedValue

If `Shadow`'s `blur` prop doesn't accept `SharedValue<number>`, fall back to a fixed blur value. The visual impact is minimal.

### Pre-allocated slot count

The 256 pre-allocated `EntitySlot` instances now each render 3 components (fill Path + stroke Path + RoundedRect fallback) instead of 1. This means ~768 Skia nodes. Monitor GPU memory. If needed, reduce `MAX_VISIBLE_ENTITIES` to 128.
