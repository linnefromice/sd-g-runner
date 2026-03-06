# Phase 2-A: Foundation Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete 5 unfinished features from v0.1.0 — HighSpeed unlock fix, pierce bullets, explosion bullets, boss laser attack, and EX Burst system.

**Architecture:** All changes follow the existing three-layer separation (engine → store → UI). Pierce and explosion modify CollisionSystem branching. Boss laser extends BossSystem state machine. EX Burst is a new standalone system with store integration.

**Tech Stack:** TypeScript, Zustand, custom ECS game loop

---

### Task 1: HighSpeed Unlock Fix

**Files:**
- Modify: `src/game/upgrades.ts:26`

**Step 1: Change requiredStage from 7 to 5**

```typescript
// src/game/upgrades.ts line 26
// Before:
SD_HighSpeed:      { type: 'unlock', requiredStage: 7, cost: 500 },
// After:
SD_HighSpeed:      { type: 'unlock', requiredStage: 5, cost: 500 },
```

**Step 2: Run quality checks**

```bash
npx tsc --noEmit
npx expo lint
npx jest --passWithNoTests
```

Expected: All pass

**Step 3: Commit**

```bash
git add src/game/upgrades.ts
git commit -m "fix: Change HighSpeed unlock requirement from stage 7 to stage 5"
```

---

### Task 2: Add specialAbility and piercedEnemyIds to BulletEntity

**Files:**
- Modify: `src/types/entities.ts:40-45`
- Modify: `src/engine/entities/Bullet.ts:7-25`
- Modify: `src/types/forms.ts` (import only)

**Step 1: Add fields to BulletEntity interface**

```typescript
// src/types/entities.ts — replace lines 40-45
export interface BulletEntity extends BaseEntity {
  type: 'playerBullet' | 'enemyBullet';
  damage: number;
  speed: number;
  homing: boolean;
  specialAbility?: import('./forms').SpecialAbilityType;
  piercedEnemyIds?: Set<string>;
}
```

**Step 2: Update createPlayerBullet to accept specialAbility**

```typescript
// src/engine/entities/Bullet.ts — update function signature and return (lines 7-25)
import type { SpecialAbilityType } from '@/types/forms';

export function createPlayerBullet(
  x: number,
  y: number,
  damage: number,
  config?: {
    width?: number;
    height?: number;
    speed?: number;
    homing?: boolean;
    specialAbility?: SpecialAbilityType;
  }
): BulletEntity {
  const ability = config?.specialAbility ?? 'none';
  return {
    id: `pb_${nextId++}`,
    type: 'playerBullet',
    x: x - (config?.width ?? HITBOX.playerBullet.width) / 2,
    y,
    width: config?.width ?? HITBOX.playerBullet.width,
    height: config?.height ?? HITBOX.playerBullet.height,
    active: true,
    damage,
    speed: config?.speed ?? PLAYER_BULLET_SPEED,
    homing: config?.homing ?? false,
    specialAbility: ability,
    ...(ability === 'pierce' ? { piercedEnemyIds: new Set<string>() } : {}),
  };
}
```

**Step 3: Run quality checks**

```bash
npx tsc --noEmit
npx expo lint
npx jest --passWithNoTests
```

**Step 4: Commit**

```bash
git add src/types/entities.ts src/engine/entities/Bullet.ts
git commit -m "feat: Add specialAbility and piercedEnemyIds to BulletEntity"
```

---

### Task 3: Transfer specialAbility from form to bullet in ShootingSystem

**Files:**
- Modify: `src/engine/systems/ShootingSystem.ts:23-56`

**Step 1: Pass specialAbility when creating bullets**

In `createShootingSystem`, after line 25 (`const isHoming = ...`), add:

```typescript
const specialAbility = form.specialAbility;
```

Then update both `createPlayerBullet` calls (line 33 for single bullet, line 49 for spread) to include `specialAbility`:

```typescript
// Single bullet (line 33):
const bullet = createPlayerBullet(centerX, p.y, damage, {
  width: bulletConfig.width,
  height: bulletConfig.height,
  speed: bulletConfig.speed,
  homing: isHoming,
  specialAbility,
});

// Spread bullets (line 49):
const bullet = createPlayerBullet(centerX + offsetX, p.y, damage, {
  width: bulletConfig.width,
  height: bulletConfig.height,
  speed: bulletConfig.speed,
  homing: isHoming,
  specialAbility,
});
```

**Step 2: Run quality checks**

```bash
npx tsc --noEmit
npx expo lint
npx jest --passWithNoTests
```

**Step 3: Commit**

```bash
git add src/engine/systems/ShootingSystem.ts
git commit -m "feat: Transfer form specialAbility to bullets in ShootingSystem"
```

---

### Task 4: Pierce Bullet — CollisionSystem Branching

**Files:**
- Modify: `src/engine/systems/CollisionSystem.ts:17-35`

**Step 1: Update player bullets → enemies loop to handle pierce**

Replace lines 17-35 with:

```typescript
  // Player bullets → Enemies
  for (const bullet of entities.playerBullets) {
    if (!bullet.active) continue;
    for (const enemy of entities.enemies) {
      if (!enemy.active) continue;
      // Skip if pierce bullet already hit this enemy
      if (bullet.specialAbility === 'pierce' && bullet.piercedEnemyIds?.has(enemy.id)) continue;
      if (checkAABBOverlap(bullet, enemy)) {
        enemy.hp -= bullet.damage;
        if (bullet.specialAbility === 'pierce') {
          // Pierce: record hit, don't deactivate bullet
          bullet.piercedEnemyIds?.add(enemy.id);
        } else {
          deactivateBullet(bullet);
        }
        if (enemy.hp <= 0) {
          deactivateEnemy(enemy);
          store.addScore(getEnemyScore(enemy.enemyType));
          store.addCredits(getEnemyCredits());
          store.addExGauge(5);
          store.addTransformGauge(TRANSFORM_GAIN_ENEMY_KILL);
        }
        if (bullet.specialAbility !== 'pierce') break;
      }
    }
  }
```

Key changes:
- Skip enemy if `piercedEnemyIds` already contains that enemy
- Pierce bullets: add to `piercedEnemyIds`, don't `deactivateBullet`
- Pierce bullets: don't `break` after hit (continue checking other enemies)
- Non-pierce: existing behavior (deactivate + break)

**Step 2: Run quality checks**

```bash
npx tsc --noEmit
npx expo lint
npx jest --passWithNoTests
```

**Step 3: Commit**

```bash
git add src/engine/systems/CollisionSystem.ts
git commit -m "feat: Add pierce bullet logic to CollisionSystem"
```

---

### Task 5: Explosion Bullet — CollisionSystem + Balance Constants

**Files:**
- Modify: `src/constants/balance.ts` (add constant)
- Modify: `src/engine/systems/CollisionSystem.ts:17-35`

**Step 1: Add EXPLOSION_RADIUS constant**

```typescript
// src/constants/balance.ts — add after line 68 (TRANSFORM_GAIN_PER_SECOND)
/** Explosion bullet */
export const EXPLOSION_RADIUS = 40;
```

**Step 2: Add explosion branching to CollisionSystem**

Update the player bullets → enemies loop (already modified in Task 4). Add explosion handling alongside pierce:

```typescript
import { IFRAME_DURATION, TRANSFORM_GAIN_ENEMY_KILL, EXPLOSION_RADIUS } from '@/constants/balance';

  // Player bullets → Enemies
  for (const bullet of entities.playerBullets) {
    if (!bullet.active) continue;
    for (const enemy of entities.enemies) {
      if (!enemy.active) continue;
      if (bullet.specialAbility === 'pierce' && bullet.piercedEnemyIds?.has(enemy.id)) continue;
      if (checkAABBOverlap(bullet, enemy)) {
        enemy.hp -= bullet.damage;
        if (bullet.specialAbility === 'pierce') {
          bullet.piercedEnemyIds?.add(enemy.id);
        } else if (bullet.specialAbility === 'explosion_radius') {
          deactivateBullet(bullet);
          // Area damage: hit all active enemies within EXPLOSION_RADIUS of impact point
          const impactX = bullet.x + bullet.width / 2;
          const impactY = bullet.y + bullet.height / 2;
          for (const other of entities.enemies) {
            if (!other.active || other.id === enemy.id) continue;
            const otherCX = other.x + other.width / 2;
            const otherCY = other.y + other.height / 2;
            const dist = Math.sqrt((impactX - otherCX) ** 2 + (impactY - otherCY) ** 2);
            if (dist <= EXPLOSION_RADIUS) {
              other.hp -= bullet.damage;
              if (other.hp <= 0) {
                deactivateEnemy(other);
                store.addScore(getEnemyScore(other.enemyType));
                store.addCredits(getEnemyCredits());
                store.addExGauge(5);
                store.addTransformGauge(TRANSFORM_GAIN_ENEMY_KILL);
              }
            }
          }
        } else {
          deactivateBullet(bullet);
        }
        if (enemy.hp <= 0) {
          deactivateEnemy(enemy);
          store.addScore(getEnemyScore(enemy.enemyType));
          store.addCredits(getEnemyCredits());
          store.addExGauge(5);
          store.addTransformGauge(TRANSFORM_GAIN_ENEMY_KILL);
        }
        if (bullet.specialAbility !== 'pierce') break;
      }
    }
  }
```

**Step 3: Run quality checks**

```bash
npx tsc --noEmit
npx expo lint
npx jest --passWithNoTests
```

**Step 4: Commit**

```bash
git add src/constants/balance.ts src/engine/systems/CollisionSystem.ts
git commit -m "feat: Add explosion bullet area damage to CollisionSystem"
```

---

### Task 6: Boss Laser Attack — Balance Constants

**Files:**
- Modify: `src/constants/balance.ts`

**Step 1: Add boss laser constants**

```typescript
// src/constants/balance.ts — add after BOSS_DRONE_COUNT (line 56)
export const BOSS_LASER_WARNING_DURATION = 1000;
export const BOSS_LASER_FIRE_DURATION = 1500;
export const BOSS_LASER_WIDTH = 30;
export const BOSS_LASER_DAMAGE = 20;
export const BOSS_LASER_TICK_INTERVAL = 300;
export const BOSS_LASER_COOLDOWN = 4000;
```

**Step 2: Commit**

```bash
git add src/constants/balance.ts
git commit -m "feat: Add boss laser balance constants"
```

---

### Task 7: Boss Laser Attack — BossEntity + BossSystem

**Files:**
- Modify: `src/types/entities.ts:55-64`
- Modify: `src/engine/systems/BossSystem.ts`

**Step 1: Add laser state fields to BossEntity**

```typescript
// src/types/entities.ts — replace lines 55-64
export interface BossEntity extends BaseEntity {
  type: 'boss';
  hp: number;
  maxHp: number;
  phase: 'spread' | 'laser' | 'all';
  attackTimer: number;
  hoverTimer: number;
  hoverDirection: number;
  drones: string[];
  // Laser state
  laserState: 'idle' | 'warning' | 'firing';
  laserTimer: number;
  laserX: number;
  laserTickTimer: number;
}
```

**Step 2: Update boss creation to include laser fields**

Find where `BossEntity` is created (likely `createGameEntities` or `SpawnSystem`). Add default values:

```typescript
laserState: 'idle',
laserTimer: 0,
laserX: 0,
laserTickTimer: 0,
```

**Step 3: Rewrite BossSystem with laser attack pattern**

```typescript
// src/engine/systems/BossSystem.ts — full replacement
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities, BossEntity } from '@/types/entities';
import {
  BOSS_HOVER_AMPLITUDE,
  BOSS_HOVER_PERIOD,
  BOSS_Y_POSITION,
  BOSS_SPREAD_COUNT,
  BOSS_DRONE_COUNT,
  BOSS_LASER_WARNING_DURATION,
  BOSS_LASER_FIRE_DURATION,
  BOSS_LASER_WIDTH,
  BOSS_LASER_DAMAGE,
  BOSS_LASER_TICK_INTERVAL,
  BOSS_LASER_COOLDOWN,
} from '@/constants/balance';
import { LOGICAL_WIDTH } from '@/constants/dimensions';
import { createEnemyBullet } from '@/engine/entities/Bullet';
import { createEnemy } from '@/engine/entities/Enemy';
import { useGameSessionStore } from '@/stores/gameSessionStore';

let laserCooldown = 0;
let useSpread = true; // alternates between spread and laser in phase 'laser'

export const bossSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const boss = entities.boss;
  if (!boss || !boss.active) return;

  const dt = time.delta / 1000;
  const dtMs = time.delta;

  // Slide in from top
  if (boss.y < BOSS_Y_POSITION) {
    boss.y += 30 * dt;
    if (boss.y > BOSS_Y_POSITION) boss.y = BOSS_Y_POSITION;
    return;
  }

  // Hover left-right
  boss.hoverTimer += time.delta;
  const hoverPhase = (boss.hoverTimer / BOSS_HOVER_PERIOD) * Math.PI * 2;
  const centerX = (LOGICAL_WIDTH - boss.width) / 2;
  boss.x = centerX + Math.sin(hoverPhase) * BOSS_HOVER_AMPLITUDE;

  // Laser state machine (active in phase 'laser' or 'all')
  if (boss.phase !== 'spread') {
    updateLaser(entities, boss, dtMs);
  }

  // Spread attack timer (active in phase 'spread', or alternating in 'laser'/'all')
  if (boss.laserState === 'idle') {
    boss.attackTimer += dt;
    const shouldSpread =
      boss.phase === 'spread' ||
      (boss.phase !== 'spread' && useSpread);

    if (shouldSpread && boss.attackTimer >= 2.0) {
      fireSpreadShot(entities, boss);
      boss.attackTimer = 0;
      if (boss.phase !== 'spread') useSpread = false; // next time use laser
    }
  }

  // Drone summon (HP 25%~)
  if (boss.hp / boss.maxHp <= 0.25 && boss.drones.length === 0) {
    spawnDrones(entities, boss);
  }
};

function updateLaser(entities: GameEntities, boss: BossEntity, dtMs: number) {
  switch (boss.laserState) {
    case 'idle': {
      laserCooldown += dtMs;
      if (laserCooldown >= BOSS_LASER_COOLDOWN && !useSpread) {
        boss.laserState = 'warning';
        boss.laserTimer = BOSS_LASER_WARNING_DURATION;
        boss.laserX = boss.x + boss.width / 2;
        boss.laserTickTimer = 0;
        laserCooldown = 0;
        useSpread = true; // next attack will be spread
      }
      break;
    }
    case 'warning': {
      boss.laserTimer -= dtMs;
      if (boss.laserTimer <= 0) {
        boss.laserState = 'firing';
        boss.laserTimer = BOSS_LASER_FIRE_DURATION;
        boss.laserTickTimer = 0;
      }
      break;
    }
    case 'firing': {
      boss.laserTimer -= dtMs;
      boss.laserTickTimer += dtMs;

      // Damage tick
      if (boss.laserTickTimer >= BOSS_LASER_TICK_INTERVAL) {
        boss.laserTickTimer -= BOSS_LASER_TICK_INTERVAL;
        const player = entities.player;
        if (player.active && !player.isInvincible) {
          const playerCenterX = player.x + player.width / 2;
          if (Math.abs(playerCenterX - boss.laserX) <= BOSS_LASER_WIDTH / 2) {
            const store = useGameSessionStore.getState();
            store.takeDamage(BOSS_LASER_DAMAGE);
            player.isInvincible = true;
            player.invincibleTimer = 1500;
            store.resetCombo();
          }
        }
      }

      if (boss.laserTimer <= 0) {
        boss.laserState = 'idle';
      }
      break;
    }
  }
}

function fireSpreadShot(entities: GameEntities, boss: NonNullable<GameEntities['boss']>) {
  const bCenterX = boss.x + boss.width / 2;
  const startY = boss.y + boss.height;
  for (let i = 0; i < BOSS_SPREAD_COUNT; i++) {
    const slot = entities.enemyBullets.find((b) => !b.active);
    if (!slot) break;
    const angle = ((i - Math.floor(BOSS_SPREAD_COUNT / 2)) * 15 * Math.PI) / 180;
    const bullet = createEnemyBullet(bCenterX + Math.sin(angle) * 20, startY, 15);
    Object.assign(slot, bullet);
    slot.active = true;
  }
}

function spawnDrones(entities: GameEntities, boss: NonNullable<GameEntities['boss']>) {
  for (let i = 0; i < BOSS_DRONE_COUNT; i++) {
    const slot = entities.enemies.find((e) => !e.active);
    if (!slot) break;
    const x = boss.x + (i + 1) * (boss.width / (BOSS_DRONE_COUNT + 1));
    const drone = createEnemy('stationary', x, boss.y + boss.height + 20, 0.5);
    Object.assign(slot, drone);
    slot.active = true;
    boss.drones.push(drone.id);
  }
}
```

**Step 3: Run quality checks**

```bash
npx tsc --noEmit
npx expo lint
npx jest --passWithNoTests
```

**Step 4: Commit**

```bash
git add src/types/entities.ts src/engine/systems/BossSystem.ts
git commit -m "feat: Implement boss laser attack pattern"
```

Note: Also update any file that creates a BossEntity to include the new laser fields. Check `src/engine/entities/Boss.ts` or `createGameEntities.ts` for the boss creation code.

---

### Task 8: EX Burst — Balance Constants + Store

**Files:**
- Modify: `src/constants/balance.ts`
- Modify: `src/stores/gameSessionStore.ts`

**Step 1: Add EX Burst constants**

```typescript
// src/constants/balance.ts — add after EX_GAIN block (line 44)
export const EX_BURST_DURATION = 2000;
export const EX_BURST_WIDTH = 80;
export const EX_BURST_DAMAGE = 50;
export const EX_BURST_TICK_INTERVAL = 100;
```

**Step 2: Add EX Burst state to gameSessionStore**

Add to `GameSessionState` interface (after `exGauge: number` at line 37):

```typescript
  isEXBurstActive: boolean;
  exBurstTimer: number;
  exBurstTickTimer: number;
```

Add to `INITIAL_STATE` (after `exGauge: 0` at line 91):

```typescript
  isEXBurstActive: false,
  exBurstTimer: 0,
  exBurstTickTimer: 0,
```

Add actions (after `addExGauge` at line 122-123):

```typescript
  activateEXBurst: () => {
    const s = get();
    if (s.exGauge < EX_GAUGE_MAX || s.isEXBurstActive) return;
    set({
      exGauge: 0,
      isEXBurstActive: true,
      exBurstTimer: EX_BURST_DURATION,
      exBurstTickTimer: 0,
    });
  },

  deactivateEXBurst: () =>
    set({ isEXBurstActive: false, exBurstTimer: 0, exBurstTickTimer: 0 }),
```

Add to interface:

```typescript
  activateEXBurst: () => void;
  deactivateEXBurst: () => void;
```

Also import `EX_BURST_DURATION` from balance.ts.

Update `resetSession` to include EX Burst reset:

```typescript
  // In resetSession, the spread of INITIAL_STATE already handles this
  // since INITIAL_STATE includes isEXBurstActive: false, etc.
```

**Step 3: Run quality checks**

```bash
npx tsc --noEmit
npx expo lint
npx jest --passWithNoTests
```

**Step 4: Commit**

```bash
git add src/constants/balance.ts src/stores/gameSessionStore.ts
git commit -m "feat: Add EX Burst state and actions to gameSessionStore"
```

---

### Task 9: EX Burst — EXBurstSystem

**Files:**
- Create: `src/engine/systems/EXBurstSystem.ts`

**Step 1: Create the EX Burst system**

```typescript
// src/engine/systems/EXBurstSystem.ts
import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { EX_BURST_WIDTH, EX_BURST_DAMAGE, EX_BURST_TICK_INTERVAL } from '@/constants/balance';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { deactivateEnemy } from '@/engine/entities/Enemy';
import { deactivateBullet } from '@/engine/entities/Bullet';
import { getEnemyScore, getEnemyCredits } from '@/game/scoring';
import { TRANSFORM_GAIN_ENEMY_KILL } from '@/constants/balance';

export const exBurstSystem: GameSystem<GameEntities> = (entities, { time }) => {
  const store = useGameSessionStore.getState();
  if (!store.isEXBurstActive) return;

  const dtMs = time.delta;

  // Decrement timer
  const newTimer = store.exBurstTimer - dtMs;
  const newTickTimer = store.exBurstTickTimer + dtMs;

  if (newTimer <= 0) {
    store.deactivateEXBurst();
    return;
  }

  // Update timers in store
  useGameSessionStore.setState({
    exBurstTimer: newTimer,
    exBurstTickTimer: newTickTimer >= EX_BURST_TICK_INTERVAL ? 0 : newTickTimer,
  });

  // Damage tick
  if (newTickTimer < EX_BURST_TICK_INTERVAL) return;

  const player = entities.player;
  const beamLeft = player.x + player.width / 2 - EX_BURST_WIDTH / 2;
  const beamRight = player.x + player.width / 2 + EX_BURST_WIDTH / 2;
  const beamTop = 0;
  const beamBottom = player.y;

  // Damage enemies in beam
  for (const enemy of entities.enemies) {
    if (!enemy.active) continue;
    const enemyCX = enemy.x + enemy.width / 2;
    const enemyCY = enemy.y + enemy.height / 2;
    if (enemyCX >= beamLeft && enemyCX <= beamRight && enemyCY >= beamTop && enemyCY <= beamBottom) {
      enemy.hp -= EX_BURST_DAMAGE;
      if (enemy.hp <= 0) {
        deactivateEnemy(enemy);
        store.addScore(getEnemyScore(enemy.enemyType));
        store.addCredits(getEnemyCredits());
        store.addExGauge(5);
        store.addTransformGauge(TRANSFORM_GAIN_ENEMY_KILL);
      }
    }
  }

  // Damage boss in beam
  if (entities.boss?.active) {
    const bossCX = entities.boss.x + entities.boss.width / 2;
    const bossCY = entities.boss.y + entities.boss.height / 2;
    if (bossCX >= beamLeft && bossCX <= beamRight && bossCY >= beamTop && bossCY <= beamBottom) {
      entities.boss.hp -= EX_BURST_DAMAGE;
      store.addExGauge(2);
      if (entities.boss.hp <= 0) {
        entities.boss.active = false;
        store.setStageClear(true);
      }
    }
  }

  // Destroy enemy bullets in beam
  for (const bullet of entities.enemyBullets) {
    if (!bullet.active) continue;
    const bx = bullet.x + bullet.width / 2;
    const by = bullet.y + bullet.height / 2;
    if (bx >= beamLeft && bx <= beamRight && by >= beamTop && by <= beamBottom) {
      deactivateBullet(bullet);
    }
  }

  // Destroy tradeoff gates in beam
  for (const gate of entities.gates) {
    if (!gate.active) continue;
    if (gate.gateType !== 'tradeoff') continue;
    const gateCX = gate.x + gate.width / 2;
    const gateCY = gate.y + gate.height / 2;
    if (gateCX >= beamLeft && gateCX <= beamRight && gateCY >= beamTop && gateCY <= beamBottom) {
      gate.active = false;
    }
  }
};
```

**Step 2: Run quality checks**

```bash
npx tsc --noEmit
npx expo lint
npx jest --passWithNoTests
```

**Step 3: Commit**

```bash
git add src/engine/systems/EXBurstSystem.ts
git commit -m "feat: Create EXBurstSystem for beam damage logic"
```

---

### Task 10: EX Burst — Wire into GameScreen

**Files:**
- Modify: `app/game/[stageId]/index.tsx:28-31,84-98,173-189`

**Step 1: Import EXBurstSystem**

```typescript
// app/game/[stageId]/index.tsx — add after line 30 (bossSystem import)
import { exBurstSystem } from '@/engine/systems/EXBurstSystem';
```

**Step 2: Register EXBurstSystem in systems array**

```typescript
// lines 84-98: add exBurstSystem before collisionSystem
const systemsRef = useRef<GameSystem<GameEntities>[]>([
  scrollSystem,
  createMovementSystem(getForm),
  createShootingSystem(getForm),
  enemyAISystem,
  createSpawnSystem(stage),
  transformGaugeSystem,
  awakenedSystem,
  exBurstSystem,        // ← Add here (before collision so beam kills happen first)
  collisionSystem,
  gateSystem,
  iframeSystem,
  bossSystem,
  gameOverSystem,
  createSyncRenderSystem(renderData),
]);
```

**Step 3: Update handleEXBurst callback**

```typescript
// Replace lines 173-189
const handleEXBurst = useCallback(() => {
  useGameSessionStore.getState().activateEXBurst();
}, []);
```

**Step 4: Run quality checks**

```bash
npx tsc --noEmit
npx expo lint
npx jest --passWithNoTests
```

**Step 5: Commit**

```bash
git add app/game/[stageId]/index.tsx
git commit -m "feat: Register EXBurstSystem and wire EX button to activateEXBurst"
```

---

## Post-Implementation Checklist

After all tasks:

1. `npx tsc --noEmit` — no type errors
2. `npx expo lint` — no lint errors
3. `npx jest --passWithNoTests` — all tests pass
4. Manual verification targets:
   - [ ] HighSpeed unlockable after stage 5 clear
   - [ ] High Speed bullets pass through enemies (pierce)
   - [ ] Heavy Artillery bullets deal area damage on impact (explosion)
   - [ ] Boss fires laser below 50% HP (warning line → beam → damage ticks)
   - [ ] EX button triggers beam that destroys enemies, enemy bullets, and tradeoff gates
