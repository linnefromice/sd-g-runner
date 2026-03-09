import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { StageDefinition } from '@/types/stages';
import { createEnemy } from '@/engine/entities/Enemy';
import { createGatePair } from '@/engine/entities/Gate';
import { createBoss } from '@/engine/entities/Boss';
import { createDebris } from '@/engine/entities/Debris';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { acquireFromPool } from '@/engine/pool';

export function createSpawnSystem(stage: StageDefinition): GameSystem<GameEntities> {
  return (entities) => {
    if (entities.isBossPhase) return; // No spawning during boss phase (§13.2)

    const { timeline } = stage;
    while (
      entities.timelineIndex < timeline.length &&
      timeline[entities.timelineIndex].time <= entities.stageTime
    ) {
      const event = timeline[entities.timelineIndex];
      entities.timelineIndex++;

      switch (event.type) {
        case 'enemy_spawn': {
          const count = event.count ?? 1;
          let spawned = 0;
          for (let i = 0; i < count; i++) {
            const enemy = createEnemy(
              event.enemyType,
              event.x + i * 40, // offset for multiple spawns
              -30, // spawn above screen
              stage.difficulty.enemyHpMultiplier
            );
            enemy.spawnTime = entities.stageTime;
            if (!acquireFromPool(entities.enemies, enemy)) break;
            spawned++;
          }
          if (spawned > 0) {
            useGameSessionStore.getState().incrementEnemiesSpawned(spawned);
          }
          break;
        }
        case 'gate_spawn': {
          const [left, right] = createGatePair(event.gateConfig, -30);
          const slots = entities.gates.filter((g) => !g.active);
          if (slots.length >= 2) {
            Object.assign(slots[0], left);
            slots[0].active = true;
            Object.assign(slots[1], right);
            slots[1].active = true;
          }
          break;
        }
        case 'debris_spawn': {
          const debrisCount = event.count ?? 1;
          for (let i = 0; i < debrisCount; i++) {
            const debris = createDebris(
              event.x + i * 50, // offset for multiple spawns
              -30 // spawn above screen
            );
            debris.spawnTime = entities.stageTime;
            if (!acquireFromPool(entities.debris, debris)) break;
          }
          break;
        }
        case 'boost_lane_start':
          entities.boostLane = { x: event.x, width: event.width, active: true };
          break;
        case 'boost_lane_end':
          if (entities.boostLane) {
            entities.boostLane.active = false;
          }
          break;
        case 'boss_spawn': {
          const bossIndex = Math.ceil(stage.id / 5);
          entities.boss = createBoss(bossIndex);
          entities.isBossPhase = true;
          break;
        }
      }
    }
  };
}
