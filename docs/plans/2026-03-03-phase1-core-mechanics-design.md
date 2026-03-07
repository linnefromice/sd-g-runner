# Phase 1: Core Mechanics — Design Document

> Date: 2026-03-03
> Source: `docs/v1/REQUIREMENTS-r3.md` (v3.1)
> Branch: `feature/phase1-core-mechanics`
> Commit Strategy: `layered`

---

## Overview

Phase 1 implements the core game loop: vertical scrolling, player movement, auto-shooting, enemies, gates, boss battle, HP/damage, scoring, and sound. All game entities use plain JS object mutation + Skia SharedValue rendering (no React state for coordinates).

---

## Implementation Layers (9 commits)

### Layer 1: Type Definitions + Constants

**Files:** `src/types/*.ts`, `src/constants/*.ts`

Types from REQUIREMENTS §21 verbatim, plus engine-specific types:

```typescript
type EntityType = 'player' | 'enemy' | 'playerBullet' | 'enemyBullet' | 'gate' | 'boss';

interface BaseEntity {
  id: string;
  type: EntityType;
  x: number; y: number;
  width: number; height: number;
  active: boolean;
}
```

Constants from §3.1 (coordinates), §3.2 (hitboxes), §6 (damage), §17.1 (colors).

### Layer 2: Game Data Definitions

**Files:** `src/game/*.ts`, `src/game/stages/*.ts`

- `forms.ts` — 4 MechaFormDefinition objects (§8.1)
- `difficulty.ts` — DifficultyParams calculator (§7.2)
- `scoring.ts` — Score table + credit rewards (§12.1, §14.2)
- `stages/stage1.ts` — Stage 1 timeline (§18 sample data)

### Layer 3: Engine — Entities + Collision

**Files:** `src/engine/entities/*.ts`, `src/engine/collision.ts`

Object pool pattern: pre-allocate arrays with `active` flag. No runtime `new` / GC pressure.

```
MAX_ENEMIES = 20
MAX_PLAYER_BULLETS = 30
MAX_ENEMY_BULLETS = 50
MAX_GATES = 4 (2 pairs)
```

AABB collision: rectangle overlap check using §3.2 hitbox sizes.

### Layer 4: Engine — Systems

**Files:** `src/engine/systems/*.ts`

All systems: `(entities, args) => void`, direct mutation.

| System | Zustand Bridge |
|--------|---------------|
| ScrollSystem | — |
| MovementSystem | — |
| ShootingSystem | — |
| EnemyAISystem | — |
| SpawnSystem | — |
| CollisionSystem | setHp, addScore |
| GateSystem | setForm, addScore |
| BossSystem | setHp, addScore |
| IFrameSystem | setInvincible |
| GameOverSystem | setGameOver |
| SyncRenderSystem | — |

### Layer 5: Skia Rendering

**Files:** `src/rendering/*.tsx`

Extend spike's GameCanvas. `RenderEntity` gains `type` field. Slot allocation:

```
0      : Player
1-20   : Enemies
21-50  : Player bullets
51-100 : Enemy bullets
101-104: Gates
105    : Boss
MAX = 128
```

Phase 1 visuals: geometric shapes + neon glow (no sprite images).

### Layer 6: Zustand Store Update

**Files:** `src/stores/gameSessionStore.ts`, `src/stores/saveDataStore.ts`

Expand gameSessionStore to full §21 GameSession type. Add saveDataStore with AsyncStorage persistence.

### Layer 7: HUD Components

**Files:** `src/ui/*.tsx`

Add: Pause button (top-left), form icon (bottom-left), combo placeholder. Upgrade HPBar with neon colors.

### Layer 8: Game Screen + Result Screen

**Files:** `app/game/[stageId]/index.tsx`, `app/game/[stageId]/result.tsx`

Replace spike bounce demo with real game. Wire up all systems, canvas, HUD, gesture input. Implement result screen with score display and navigation.

### Layer 9: Audio System

**Files:** `src/audio/AudioManager.ts`

expo-av based manager. BGM loop playback, SE one-shot playback. Placeholder audio files (silent/free assets).

---

## Key Design Decisions

1. **Object Pool over dynamic allocation** — avoid GC at 60fps
2. **Slot-based rendering** — fixed Skia component tree, SharedValue data swaps
3. **Systems bridge to Zustand via getState()** — event-driven HUD updates only
4. **Geometric visuals for Phase 1** — sprites deferred to polish phase
5. **Stage data is static JSON** — no runtime generation
