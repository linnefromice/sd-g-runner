# Phase 3: ビジュアルフィードバック — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** ヒットストップ、画面揺れ、パーティクル、スコアポップアップの4つのビジュアルフィードバックを実装し、ゲームの手触りを大幅に改善する

**Architecture:** GameEntities にエフェクト用フィールド/プールを追加 → 新システム (ScreenShake, Particle) で毎フレーム更新 → SyncRenderSystem で描画 → GameCanvas に shake offset + Text 描画を追加。ヒットストップは useGameLoop 内でシステム実行スキップ。

**Tech Stack:** React Native, @shopify/react-native-skia (Canvas, Text), react-native-reanimated (SharedValue), Zustand

---

### Task 1: エフェクト定数の定義

**Files:**
- Modify: `src/constants/balance.ts`
- Modify: `src/constants/dimensions.ts`

**Step 1: Add visual feedback constants to balance.ts**

Append to `src/constants/balance.ts`:

```typescript
/** Hit Stop */
export const HIT_STOP_ENEMY_KILL = 50;
export const HIT_STOP_PLAYER_HIT = 50;
export const HIT_STOP_PARRY = 50;
export const HIT_STOP_BOSS_KILL = 150;

/** Screen Shake */
export const SHAKE_ENEMY_KILL_INTENSITY = 2;
export const SHAKE_ENEMY_KILL_DURATION = 100;
export const SHAKE_PLAYER_HIT_INTENSITY = 4;
export const SHAKE_PLAYER_HIT_DURATION = 150;
export const SHAKE_PARRY_INTENSITY = 4;
export const SHAKE_PARRY_DURATION = 150;
export const SHAKE_BOSS_KILL_INTENSITY = 8;
export const SHAKE_BOSS_KILL_DURATION = 300;

/** Particles */
export const PARTICLE_ENEMY_KILL_COUNT = 7;
export const PARTICLE_PLAYER_HIT_COUNT = 5;
export const PARTICLE_GATE_PASS_COUNT = 4;
export const PARTICLE_EX_BURST_COUNT = 9;
export const PARTICLE_PARRY_COUNT = 8;
export const PARTICLE_BOSS_KILL_COUNT = 16;
export const PARTICLE_DEFAULT_LIFE = 400;
export const PARTICLE_DEFAULT_SPEED = 80;
export const PARTICLE_DEFAULT_SIZE = 4;
export const PARTICLE_BOSS_SIZE = 8;

/** Score Popup */
export const SCORE_POPUP_SPEED = 40;
export const SCORE_POPUP_LIFE = 800;
```

**Step 2: Add pool size constants to dimensions.ts**

Append to `src/constants/dimensions.ts`:

```typescript
export const MAX_PARTICLES = 64;
export const MAX_SCORE_POPUPS = 16;
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/constants/balance.ts src/constants/dimensions.ts
git commit -m "feat: Add visual feedback constants (hit stop, shake, particles, popups)"
```

---

### Task 2: ParticleEntity / ScorePopupEntity 型とプール初期化

**Files:**
- Modify: `src/types/entities.ts`
- Modify: `src/engine/createGameEntities.ts`

**Step 1: Add entity types and GameEntities fields**

Add to `src/types/entities.ts` (before `GameEntity` union):

```typescript
export interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
}

export interface ScorePopupEntity {
  x: number;
  y: number;
  vy: number;
  text: string;
  life: number;
  maxLife: number;
  color: string;
  active: boolean;
}
```

Add to `GameEntities` interface:

```typescript
  /** Hit stop freeze timer (ms) */
  hitStopTimer: number;
  /** Screen shake timer (ms) */
  shakeTimer: number;
  /** Screen shake intensity (px in logical coords) */
  shakeIntensity: number;
  /** Current frame shake offset X (logical coords) */
  shakeOffsetX: number;
  /** Current frame shake offset Y (logical coords) */
  shakeOffsetY: number;
  /** Particle pool */
  particles: ParticleEntity[];
  /** Score popup pool */
  scorePopups: ScorePopupEntity[];
```

**Step 2: Initialize pools in createGameEntities**

Add to `src/engine/createGameEntities.ts`:

Import `MAX_PARTICLES, MAX_SCORE_POPUPS` from dimensions.

Add inactive factory functions:

```typescript
function createInactiveParticle(): ParticleEntity {
  return {
    x: -100, y: -100, vx: 0, vy: 0,
    life: 0, maxLife: 0, color: '#FFFFFF', size: 4, active: false,
  };
}

function createInactiveScorePopup(): ScorePopupEntity {
  return {
    x: -100, y: -100, vy: 0,
    text: '', life: 0, maxLife: 0, color: '#FFFFFF', active: false,
  };
}
```

Add to return object:

```typescript
    hitStopTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    shakeOffsetX: 0,
    shakeOffsetY: 0,
    particles: Array.from({ length: MAX_PARTICLES }, createInactiveParticle),
    scorePopups: Array.from({ length: MAX_SCORE_POPUPS }, createInactiveScorePopup),
```

Import `ParticleEntity, ScorePopupEntity` from types.

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/types/entities.ts src/engine/createGameEntities.ts
git commit -m "feat: Add particle and score popup entity types with pool initialization"
```

---

### Task 3: エフェクトスポーンヘルパー

**Files:**
- Create: `src/engine/effects.ts`

**Step 1: Create effect spawn helper functions**

```typescript
import type { GameEntities } from '@/types/entities';
import {
  PARTICLE_DEFAULT_LIFE,
  PARTICLE_DEFAULT_SPEED,
  PARTICLE_DEFAULT_SIZE,
  PARTICLE_BOSS_SIZE,
  PARTICLE_ENEMY_KILL_COUNT,
  PARTICLE_PLAYER_HIT_COUNT,
  PARTICLE_GATE_PASS_COUNT,
  PARTICLE_EX_BURST_COUNT,
  PARTICLE_PARRY_COUNT,
  PARTICLE_BOSS_KILL_COUNT,
  SCORE_POPUP_SPEED,
  SCORE_POPUP_LIFE,
  HIT_STOP_ENEMY_KILL,
  HIT_STOP_PLAYER_HIT,
  HIT_STOP_PARRY,
  HIT_STOP_BOSS_KILL,
  SHAKE_ENEMY_KILL_INTENSITY,
  SHAKE_ENEMY_KILL_DURATION,
  SHAKE_PLAYER_HIT_INTENSITY,
  SHAKE_PLAYER_HIT_DURATION,
  SHAKE_PARRY_INTENSITY,
  SHAKE_PARRY_DURATION,
  SHAKE_BOSS_KILL_INTENSITY,
  SHAKE_BOSS_KILL_DURATION,
} from '@/constants/balance';

// --- Low-level spawners ---

function spawnParticles(
  entities: GameEntities,
  x: number,
  y: number,
  count: number,
  color: string,
  life: number = PARTICLE_DEFAULT_LIFE,
  speed: number = PARTICLE_DEFAULT_SPEED,
  size: number = PARTICLE_DEFAULT_SIZE,
  pattern: 'radial' | 'horizontal' | 'upward' = 'radial',
) {
  let spawned = 0;
  for (const p of entities.particles) {
    if (spawned >= count) break;
    if (p.active) continue;

    p.active = true;
    p.x = x;
    p.y = y;
    p.size = size;
    p.color = color;
    p.life = life;
    p.maxLife = life;

    switch (pattern) {
      case 'radial': {
        const angle = (Math.PI * 2 * spawned) / count + (Math.random() - 0.5) * 0.5;
        const s = speed * (0.7 + Math.random() * 0.6);
        p.vx = Math.cos(angle) * s;
        p.vy = Math.sin(angle) * s;
        break;
      }
      case 'horizontal': {
        p.vx = (spawned % 2 === 0 ? 1 : -1) * speed * (0.5 + Math.random() * 0.5);
        p.vy = (Math.random() - 0.5) * speed * 0.3;
        break;
      }
      case 'upward': {
        const spread = (Math.random() - 0.5) * speed;
        p.vx = spread;
        p.vy = -speed * (0.5 + Math.random() * 0.5);
        break;
      }
    }

    spawned++;
  }
}

function spawnScorePopup(
  entities: GameEntities,
  x: number,
  y: number,
  text: string,
  color: string,
) {
  for (const popup of entities.scorePopups) {
    if (popup.active) continue;
    popup.active = true;
    popup.x = x;
    popup.y = y;
    popup.vy = -SCORE_POPUP_SPEED;
    popup.text = text;
    popup.color = color;
    popup.life = SCORE_POPUP_LIFE;
    popup.maxLife = SCORE_POPUP_LIFE;
    return;
  }
}

function triggerHitStop(entities: GameEntities, duration: number) {
  entities.hitStopTimer = Math.max(entities.hitStopTimer, duration);
}

function triggerShake(entities: GameEntities, intensity: number, duration: number) {
  // Stronger shake overrides weaker one
  if (intensity >= entities.shakeIntensity || entities.shakeTimer <= 0) {
    entities.shakeIntensity = intensity;
    entities.shakeTimer = duration;
  }
}

// --- High-level event triggers ---

export function onEnemyKill(entities: GameEntities, x: number, y: number, score: number) {
  triggerHitStop(entities, HIT_STOP_ENEMY_KILL);
  triggerShake(entities, SHAKE_ENEMY_KILL_INTENSITY, SHAKE_ENEMY_KILL_DURATION);
  spawnParticles(entities, x, y, PARTICLE_ENEMY_KILL_COUNT, '#FF4444');
  spawnScorePopup(entities, x, y, `+${score}`, '#FFD600');
}

export function onPlayerHit(entities: GameEntities, x: number, y: number) {
  triggerHitStop(entities, HIT_STOP_PLAYER_HIT);
  triggerShake(entities, SHAKE_PLAYER_HIT_INTENSITY, SHAKE_PLAYER_HIT_DURATION);
  spawnParticles(entities, x, y, PARTICLE_PLAYER_HIT_COUNT, '#4488FF');
}

export function onGatePass(entities: GameEntities, x: number, y: number, color: string) {
  spawnParticles(entities, x, y, PARTICLE_GATE_PASS_COUNT, color, 300, PARTICLE_DEFAULT_SPEED, PARTICLE_DEFAULT_SIZE, 'horizontal');
}

export function onEXBurst(entities: GameEntities, x: number, y: number) {
  spawnParticles(entities, x, y, PARTICLE_EX_BURST_COUNT, '#00E5FF', 500, PARTICLE_DEFAULT_SPEED, PARTICLE_DEFAULT_SIZE, 'upward');
}

export function onParry(entities: GameEntities, x: number, y: number) {
  triggerHitStop(entities, HIT_STOP_PARRY);
  triggerShake(entities, SHAKE_PARRY_INTENSITY, SHAKE_PARRY_DURATION);
  spawnParticles(entities, x, y, PARTICLE_PARRY_COUNT, '#FFFFFF');
  spawnScorePopup(entities, x, y, `+${300}`, '#FFFFFF');
}

export function onBossKill(entities: GameEntities, x: number, y: number) {
  triggerHitStop(entities, HIT_STOP_BOSS_KILL);
  triggerShake(entities, SHAKE_BOSS_KILL_INTENSITY, SHAKE_BOSS_KILL_DURATION);
  spawnParticles(entities, x, y, PARTICLE_BOSS_KILL_COUNT, '#FF4444', 600, PARTICLE_DEFAULT_SPEED * 1.5, PARTICLE_BOSS_SIZE);
  spawnParticles(entities, x, y, PARTICLE_BOSS_KILL_COUNT, '#FF8800', 600, PARTICLE_DEFAULT_SPEED, PARTICLE_BOSS_SIZE);
}

export function onGraze(entities: GameEntities, x: number, y: number) {
  spawnScorePopup(entities, x, y, '+20', '#00E5FF');
}

export function onDebrisDestroy(entities: GameEntities, x: number, y: number) {
  spawnParticles(entities, x, y, 4, '#8B7355');
  spawnScorePopup(entities, x, y, '+50', '#00FF88');
}
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/engine/effects.ts
git commit -m "feat: Add effect spawn helpers (particles, popups, hit stop, shake)"
```

---

### Task 4: ヒットストップ — useGameLoop 修正

**Files:**
- Modify: `src/engine/GameLoop.ts`

**Step 1: Add hit stop check to game loop**

In `useGameLoop`, modify the tick function. After computing `time`, before running systems, check for `hitStopTimer`:

```typescript
      if (systems && entities) {
        // Hit stop: skip systems, only decrement timer
        if ((entities as { hitStopTimer?: number }).hitStopTimer &&
            (entities as { hitStopTimer?: number }).hitStopTimer! > 0) {
          (entities as { hitStopTimer: number }).hitStopTimer = Math.max(
            0,
            (entities as { hitStopTimer: number }).hitStopTimer - delta
          );
        } else {
          for (let i = 0; i < systems.length; i++) {
            systems[i](entities, { time });
          }
        }
      }
```

Note: `GameLoop.ts` uses generic `Entities` type, so we cast to access `hitStopTimer`. This keeps the generic signature intact while enabling hit stop for any entities that have the field.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/engine/GameLoop.ts
git commit -m "feat: Add hit stop support to game loop (skip systems while frozen)"
```

---

### Task 5: ScreenShakeSystem

**Files:**
- Create: `src/engine/systems/ScreenShakeSystem.ts`

**Step 1: Implement screen shake system**

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';

export const screenShakeSystem: GameSystem<GameEntities> = (entities, { time }) => {
  if (entities.shakeTimer <= 0) {
    entities.shakeOffsetX = 0;
    entities.shakeOffsetY = 0;
    return;
  }

  entities.shakeTimer = Math.max(0, entities.shakeTimer - time.delta);

  // Fade intensity as timer decreases
  const progress = entities.shakeTimer > 0
    ? entities.shakeIntensity
    : 0;

  entities.shakeOffsetX = (Math.random() * 2 - 1) * progress;
  entities.shakeOffsetY = (Math.random() * 2 - 1) * progress;

  if (entities.shakeTimer <= 0) {
    entities.shakeOffsetX = 0;
    entities.shakeOffsetY = 0;
    entities.shakeIntensity = 0;
  }
};
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/engine/systems/ScreenShakeSystem.ts
git commit -m "feat: Add ScreenShakeSystem for camera shake effect"
```

---

### Task 6: ParticleSystem

**Files:**
- Create: `src/engine/systems/ParticleSystem.ts`

**Step 1: Implement particle system**

```typescript
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';

export const particleSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const dt = time.delta / 1000; // seconds

  for (const p of entities.particles) {
    if (!p.active) continue;

    p.life -= time.delta;
    if (p.life <= 0) {
      p.active = false;
      p.x = -100;
      p.y = -100;
      continue;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }

  for (const popup of entities.scorePopups) {
    if (!popup.active) continue;

    popup.life -= time.delta;
    if (popup.life <= 0) {
      popup.active = false;
      popup.x = -100;
      popup.y = -100;
      continue;
    }

    popup.y += popup.vy * dt;
  }
};
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/engine/systems/ParticleSystem.ts
git commit -m "feat: Add ParticleSystem for particle and score popup updates"
```

---

### Task 7: SyncRenderSystem にパーティクル/ポップアップ描画追加

**Files:**
- Modify: `src/engine/systems/SyncRenderSystem.ts`

**Step 1: Add particle and score popup rendering**

Add `RenderEntity` fields: `text?: string` and `fontSize?: number` (they already have `label` but we need explicit text support).

After the shockwave section (before `renderData.value = out`), add:

```typescript
    // Particles
    for (const p of entities.particles) {
      if (!p.active) continue;
      const opacity = p.life / p.maxLife;
      out.push({
        type: 'particle',
        x: p.x - p.size / 2,
        y: p.y - p.size / 2,
        width: p.size,
        height: p.size,
        color: p.color,
        opacity,
      });
    }

    // Score Popups
    for (const popup of entities.scorePopups) {
      if (!popup.active) continue;
      const lifeRatio = popup.life / popup.maxLife;
      // Fade out in second half of life
      const opacity = lifeRatio > 0.5 ? 1.0 : lifeRatio * 2;
      out.push({
        type: 'scorePopup',
        x: popup.x,
        y: popup.y,
        width: 0,
        height: 0,
        color: popup.color,
        opacity,
        text: popup.text,
        fontSize: 12,
      });
    }
```

Also add `text?: string` and `fontSize?: number` to the `RenderEntity` type in this file.

**Step 2: Apply shake offset to all entity positions**

At the start of the system function (after `const out`), read shake offset:

```typescript
    const shakeX = entities.shakeOffsetX;
    const shakeY = entities.shakeOffsetY;
```

Then apply offset to every entity pushed to `out` by adding `shakeX` / `shakeY` to `x` / `y`. The boost lane background and all entities should be offset.

**Implementation approach:** Rather than modifying every push, apply offset in a single pass at the end before assigning to renderData:

```typescript
    // Apply screen shake offset to all entities
    if (shakeX !== 0 || shakeY !== 0) {
      for (const e of out) {
        e.x += shakeX;
        e.y += shakeY;
      }
    }

    renderData.value = out;
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/engine/systems/SyncRenderSystem.ts
git commit -m "feat: Add particle/popup rendering and screen shake offset to SyncRenderSystem"
```

---

### Task 8: GameCanvas にテキスト描画スロット追加

**Files:**
- Modify: `src/rendering/GameCanvas.tsx`

**Step 1: Update RenderEntity type and add TextSlot**

Update `RenderEntity` in `GameCanvas.tsx` to include `text?: string` and `fontSize?: number`.

Add `Text` import from Skia:

```typescript
import {
  Canvas,
  Rect,
  RoundedRect,
  Shadow,
  Text,
  useFont,
} from '@shopify/react-native-skia';
```

Add a `TextSlot` component for score popups:

```typescript
function TextSlot({
  renderData,
  index,
  scale,
  font,
}: {
  renderData: GameCanvasProps['renderData'];
  index: number;
  scale: number;
  font: ReturnType<typeof useFont>;
}) {
  const x = useDerivedValue(() => (renderData.value[index]?.x ?? -200) * scale);
  const y = useDerivedValue(() => (renderData.value[index]?.y ?? -200) * scale);
  const color = useDerivedValue(() => renderData.value[index]?.color ?? 'transparent');
  const opacity = useDerivedValue(() => renderData.value[index]?.opacity ?? 0);
  const text = useDerivedValue(() => renderData.value[index]?.text ?? '');

  if (!font) return null;

  return (
    <Text
      x={x}
      y={y}
      text={text}
      font={font}
      color={color}
      opacity={opacity}
    />
  );
}
```

**Step 2: Update MAX_VISIBLE_ENTITIES and add text slots**

Increase `MAX_VISIBLE_ENTITIES` to 256 (from 128) to accommodate particles.

Add a separate range for text slots. In `GameCanvasInner`:

```typescript
  const textSlotStart = 200; // Score popups will be in slots 200+
  const textSlots = React.useMemo(
    () => Array.from({ length: 16 }, (_, i) => textSlotStart + i),
    []
  );
```

Note: We need to check if `type === 'scorePopup'` to decide which component renders which slot. However, since Skia reads from SharedValue and can't conditionally render, a simpler approach is:

- `EntitySlot` already renders everything as `RoundedRect`. For particles (small colored rects), this works perfectly.
- For `scorePopup`, `EntitySlot` will render a 0-size rect (invisible). We add `TextSlot` that renders text at the same position.
- In SyncRenderSystem, score popups have `width: 0, height: 0` so the RoundedRect is invisible.

The `TextSlot` reads from the same `renderData` array. It checks if the entry has `text` and renders accordingly (if no text, it renders empty string which is effectively invisible).

For `useFont`, use the system default (no custom font file needed):

```typescript
const font = useFont(null, 12);
```

If `useFont(null, ...)` is not supported, use Skia's `matchFont` instead. Check context7 for the correct API.

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/rendering/GameCanvas.tsx
git commit -m "feat: Add text rendering slots and increase entity capacity in GameCanvas"
```

---

### Task 9: エフェクト発火ポイントの接続

**Files:**
- Modify: `src/engine/systems/CollisionSystem.ts`
- Modify: `src/engine/systems/GateSystem.ts`
- Modify: `src/engine/systems/EXBurstSystem.ts`
- Modify: `src/engine/systems/enemyKillReward.ts`

**Step 1: Add effects to enemyKillReward**

Modify `src/engine/systems/enemyKillReward.ts`:

Import `onEnemyKill` from `@/engine/effects`.

Change `applyEnemyKillReward` signature to accept `entities: GameEntities`:

```typescript
import type { EnemyEntity, GameEntities } from '@/types/entities';
import { onEnemyKill } from '@/engine/effects';

export function applyEnemyKillReward(enemy: EnemyEntity, entities: GameEntities): void {
  const cx = enemy.x + enemy.width / 2;
  const cy = enemy.y + enemy.height / 2;
  deactivateEnemy(enemy);
  const store = useGameSessionStore.getState();
  const score = getEnemyScore(enemy.enemyType);
  store.addScore(score);
  store.addCredits(getEnemyCredits(enemy.enemyType));
  if (!store.isEXBurstActive) store.addExGauge(5);
  store.addTransformGauge(TRANSFORM_GAIN_ENEMY_KILL);
  store.incrementEnemiesKilled();

  onEnemyKill(entities, cx, cy, score);
}
```

**Step 2: Update all callers of applyEnemyKillReward to pass entities**

In `CollisionSystem.ts`, every `applyEnemyKillReward(enemy)` call becomes `applyEnemyKillReward(enemy, entities)`.

In `EXBurstSystem.ts`, every `applyEnemyKillReward(enemy)` call becomes `applyEnemyKillReward(enemy, entities)`.

**Step 3: Add onPlayerHit to CollisionSystem**

In `applyDamage` function in `CollisionSystem.ts`, add `entities` parameter and call `onPlayerHit`:

```typescript
import { onPlayerHit, onParry, onGraze, onDebrisDestroy } from '@/engine/effects';

function applyDamage(
  entities: GameEntities,
  player: GameEntities['player'],
  damage: number,
  store: ReturnType<typeof useGameSessionStore.getState>
) {
  store.takeDamage(damage);
  player.isInvincible = true;
  player.invincibleTimer = IFRAME_DURATION;
  store.resetCombo();
  onPlayerHit(entities, player.x + player.width / 2, player.y + player.height / 2);
}
```

Update all `applyDamage(player, ...)` calls to `applyDamage(entities, player, ...)`.

**Step 4: Add onParry to applyParryShockwave**

At the end of `applyParryShockwave`, add:

```typescript
  onParry(entities, pcx, pcy);
```

(Remove the existing `entities.shockwaveTimer = SHOCKWAVE_EFFECT_DURATION;` line — shockwave is now replaced by particles.)

**Step 5: Add onGraze to graze detection**

In the graze detection section, after `store.addTransformGauge(GRAZE_TF_GAIN);`, add:

```typescript
        onGraze(entities, bullet.x + bullet.width / 2, bullet.y + bullet.height / 2);
```

**Step 6: Add onDebrisDestroy**

In the debris destruction block in CollisionSystem, after `store.addScore(DEBRIS_DESTROY_SCORE);`, add:

```typescript
            onDebrisDestroy(entities, debris.x + debris.width / 2, debris.y + debris.height / 2);
```

**Step 7: Add onBossKill to boss death**

In CollisionSystem, in the `Player bullets → Boss` section where `entities.boss.hp <= 0`:

```typescript
        if (entities.boss.hp <= 0) {
          const bcx = entities.boss.x + entities.boss.width / 2;
          const bcy = entities.boss.y + entities.boss.height / 2;
          entities.boss.active = false;
          store.setFinalStageTime(entities.stageTime);
          store.setStageClear(true);
          onBossKill(entities, bcx, bcy);
        }
```

Same in `EXBurstSystem.ts` for boss death.

Import `onBossKill` from `@/engine/effects` in both files.

**Step 8: Add onGatePass to GateSystem**

In `GateSystem.ts`, after `deactivateGate(gate);`, add:

```typescript
    // Visual effect
    onGatePass(entities, gate.x + gate.width / 2, gate.y + gate.height / 2, gateColor);
```

Where `gateColor` is determined from the gate type (same mapping as SyncRenderSystem):

```typescript
    const gateColor = gate.gateType === 'enhance' ? '#00FF88' :
                      gate.gateType === 'refit' ? '#00D4FF' :
                      gate.gateType === 'tradeoff' ? '#FFD600' :
                      gate.gateType === 'growth' ? '#66FF66' :
                      gate.gateType === 'roulette' ? '#FF8800' : '#FF69B4';
```

Import `onGatePass` from `@/engine/effects`.

**Step 9: Add onEXBurst trigger**

In `EXBurstSystem.ts`, at the start where the burst activates (or in the game screen's `handleEXBurst`), add particle effect. The best place is in `EXBurstSystem.ts` — add a one-time spawn check. Since the system runs every frame during burst, we should only trigger particles once. Check if this is the first tick:

Actually, simpler: trigger in `app/game/[stageId]/index.tsx`'s `handleEXBurst`:

```typescript
  const handleEXBurst = useCallback(() => {
    useGameSessionStore.getState().activateEXBurst();
    const p = entitiesRef.current.player;
    onEXBurst(entitiesRef.current, p.x + p.width / 2, p.y);
  }, []);
```

Import `onEXBurst` from `@/engine/effects`.

**Step 10: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 11: Commit**

```bash
git add src/engine/systems/CollisionSystem.ts src/engine/systems/GateSystem.ts \
       src/engine/systems/EXBurstSystem.ts src/engine/systems/enemyKillReward.ts \
       app/game/\\[stageId\\]/index.tsx
git commit -m "feat: Connect visual effects to all game event triggers"
```

---

### Task 10: ゲーム画面にシステム登録

**Files:**
- Modify: `app/game/[stageId]/index.tsx`

**Step 1: Register new systems in game screen**

Import new systems:

```typescript
import { screenShakeSystem } from '@/engine/systems/ScreenShakeSystem';
import { particleSystem } from '@/engine/systems/ParticleSystem';
```

Add them to `systemsRef`. Insert `screenShakeSystem` before `createSyncRenderSystem` and `particleSystem` before `screenShakeSystem`:

```typescript
  const systemsRef = useRef<GameSystem<GameEntities>[]>([
    scrollSystem,
    boostLaneSystem,
    createMovementSystem(getForm),
    createShootingSystem(getForm),
    enemyAISystem,
    createSpawnSystem(stage),
    transformGaugeSystem,
    awakenedSystem,
    exBurstSystem,
    collisionSystem,
    gateSystem,
    iframeSystem,
    createBossSystem(),
    gameOverSystem,
    particleSystem,          // <- new
    screenShakeSystem,       // <- new
    createSyncRenderSystem(renderData),
  ]);
```

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/game/\\[stageId\\]/index.tsx
git commit -m "feat: Register ParticleSystem and ScreenShakeSystem in game loop"
```

---

### Task 11: shockwave レンダリングの置換

**Files:**
- Modify: `src/engine/systems/SyncRenderSystem.ts`

**Step 1: Remove old shockwave rendering**

The old shockwave effect (placeholder white square, lines 145-159) is now replaced by the parry particle effect. Remove the shockwave rendering block:

```typescript
    // Remove this entire block:
    // Shockwave effect (placeholder: semi-transparent square)
    // if (entities.shockwaveTimer > 0) { ... }
```

Also remove the `JUST_TF_SHOCKWAVE_RADIUS` and `SHOCKWAVE_EFFECT_DURATION` imports if they are no longer used elsewhere in this file.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/engine/systems/SyncRenderSystem.ts
git commit -m "refactor: Replace placeholder shockwave rendering with particle effects"
```

---

### Task 12: テスト

**Files:**
- Create: `src/engine/__tests__/effects.test.ts`

**Step 1: Write effect helper tests**

```typescript
import type { GameEntities, ParticleEntity, ScorePopupEntity } from '@/types/entities';
import { onEnemyKill, onPlayerHit, onParry, onGatePass, onBossKill, onGraze, onDebrisDestroy } from '../effects';

function createMockEntities(): Pick<GameEntities, 'hitStopTimer' | 'shakeTimer' | 'shakeIntensity' | 'shakeOffsetX' | 'shakeOffsetY' | 'particles' | 'scorePopups'> {
  return {
    hitStopTimer: 0,
    shakeTimer: 0,
    shakeIntensity: 0,
    shakeOffsetX: 0,
    shakeOffsetY: 0,
    particles: Array.from({ length: 64 }, (): ParticleEntity => ({
      x: -100, y: -100, vx: 0, vy: 0,
      life: 0, maxLife: 0, color: '#FFF', size: 4, active: false,
    })),
    scorePopups: Array.from({ length: 16 }, (): ScorePopupEntity => ({
      x: -100, y: -100, vy: 0,
      text: '', life: 0, maxLife: 0, color: '#FFF', active: false,
    })),
  };
}

describe('effects', () => {
  test('onEnemyKill triggers hit stop, shake, particles, and popup', () => {
    const e = createMockEntities() as GameEntities;
    onEnemyKill(e, 100, 200, 100);

    expect(e.hitStopTimer).toBeGreaterThan(0);
    expect(e.shakeTimer).toBeGreaterThan(0);
    expect(e.shakeIntensity).toBeGreaterThan(0);

    const activeParticles = e.particles.filter(p => p.active);
    expect(activeParticles.length).toBeGreaterThanOrEqual(5);

    const activePopups = e.scorePopups.filter(p => p.active);
    expect(activePopups.length).toBe(1);
    expect(activePopups[0].text).toBe('+100');
  });

  test('onPlayerHit triggers hit stop and shake but no popup', () => {
    const e = createMockEntities() as GameEntities;
    onPlayerHit(e, 50, 100);

    expect(e.hitStopTimer).toBeGreaterThan(0);
    expect(e.shakeIntensity).toBe(4);
    expect(e.scorePopups.filter(p => p.active).length).toBe(0);
  });

  test('onBossKill triggers large shake and many particles', () => {
    const e = createMockEntities() as GameEntities;
    onBossKill(e, 160, 60);

    expect(e.hitStopTimer).toBe(150);
    expect(e.shakeIntensity).toBe(8);
    expect(e.particles.filter(p => p.active).length).toBeGreaterThanOrEqual(16);
  });

  test('onGraze spawns score popup only', () => {
    const e = createMockEntities() as GameEntities;
    onGraze(e, 100, 200);

    expect(e.hitStopTimer).toBe(0);
    expect(e.shakeTimer).toBe(0);
    const popups = e.scorePopups.filter(p => p.active);
    expect(popups.length).toBe(1);
    expect(popups[0].text).toBe('+20');
  });

  test('onGatePass spawns horizontal particles', () => {
    const e = createMockEntities() as GameEntities;
    onGatePass(e, 160, 300, '#00FF88');

    const activeParticles = e.particles.filter(p => p.active);
    expect(activeParticles.length).toBe(4);
    expect(activeParticles[0].color).toBe('#00FF88');
  });

  test('particle pool reuses inactive slots', () => {
    const e = createMockEntities() as GameEntities;
    // Fill half the pool
    onBossKill(e, 100, 100);
    const firstCount = e.particles.filter(p => p.active).length;

    // Deactivate all
    for (const p of e.particles) p.active = false;

    // Spawn again — should reuse same slots
    onEnemyKill(e, 100, 100, 200);
    const secondCount = e.particles.filter(p => p.active).length;
    expect(secondCount).toBeGreaterThan(0);
    expect(secondCount).toBeLessThan(firstCount);
  });

  test('stronger shake overrides weaker one', () => {
    const e = createMockEntities() as GameEntities;
    onEnemyKill(e, 100, 100, 100); // intensity 2
    expect(e.shakeIntensity).toBe(2);

    onPlayerHit(e, 100, 100); // intensity 4
    expect(e.shakeIntensity).toBe(4);
  });
});
```

**Step 2: Run tests**

Run: `npx jest src/engine/__tests__/effects.test.ts --passWithNoTests`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/engine/__tests__/effects.test.ts
git commit -m "test: Add visual effects helper tests"
```

---

### Task 13: 最終品質チェック

**Step 1: Run full quality check**

```bash
npx expo lint && npx tsc --noEmit && npx jest --passWithNoTests
```

Expected: All pass

**Step 2: Verify visual effects integration**

Checklist:
- [ ] 敵撃破 → パーティクル飛散 + スコアポップアップ + ヒットストップ + 軽い画面揺れ
- [ ] プレイヤー被弾 → 青パーティクル + ヒットストップ + 画面揺れ
- [ ] ゲート通過 → ゲート色パーティクルが左右に広がる
- [ ] グレイズ → スコアポップアップ "+20" がシアンで浮き上がる
- [ ] パリィ成功 → 白パーティクル放射 + スコアポップアップ + 画面揺れ
- [ ] EX Burst 発動 → シアンパーティクルが上方に飛散
- [ ] ボス撃破 → 大量パーティクル + 特大ヒットストップ + 大画面揺れ
- [ ] デブリ破壊 → 茶色パーティクル + スコアポップアップ
- [ ] 60fps 維持（パーティクル大量発生時も）
