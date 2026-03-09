import type { StageDefinition } from '@/types/stages';
import {
  GATE_ATK_UP,
  GATE_SPD_UP,
  GATE_FR_UP,
  GATE_ATK_UP_15,
  GATE_FR_UP_30,
  GATE_HEAL_20,
  GATE_HEAL_15,
  GATE_GLASS_CANNON,
  GATE_SPEED_DEMON,
  GATE_REFIT_HEAVY,
  GATE_REFIT_SPEED,
} from '@/game/gates';

/** Stage 11: Phantom Zone — Dodger introduction, evasive enemies that sidestep bullets */
export const STAGE_11: StageDefinition = {
  id: 11,
  name: 'Phantom Zone',
  isBossStage: false,
  duration: 110,
  difficulty: {
    scrollSpeedMultiplier: 1.1,
    enemySpawnInterval: 2.2,
    enemyHpMultiplier: 1.3,
    enemyAtkMultiplier: 1.2,
    maxConcurrentEnemies: 10,
    bulletSpeedMultiplier: 1.1,
    attackIntervalMultiplier: 0.9,
  },
  timeline: [
    // Wave 1: familiar enemies to ease in
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 5, type: 'enemy_spawn', enemyType: 'stationary', x: 220 },
    { time: 8, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    // Enhance gate
    {
      time: 14,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP_15, right: GATE_FR_UP_30 },
    },
    // Wave 2: first dodger introduction
    { time: 19, type: 'enemy_spawn', enemyType: 'dodger', x: 160 },
    { time: 22, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    { time: 24, type: 'enemy_spawn', enemyType: 'dodger', x: 240 },
    // Recovery gate
    {
      time: 30,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_20, right: GATE_ATK_UP },
    },
    // Wave 3: dodgers + stationary in boost lane
    { time: 35, type: 'boost_lane_start', x: 60, width: 200 },
    { time: 36, type: 'enemy_spawn', enemyType: 'dodger', x: 120 },
    { time: 37, type: 'enemy_spawn', enemyType: 'stationary', x: 200 },
    { time: 39, type: 'enemy_spawn', enemyType: 'dodger', x: 160 },
    { time: 42, type: 'boost_lane_end' },
    // Tradeoff gate
    {
      time: 47,
      type: 'gate_spawn',
      gateConfig: { layout: 'optional', left: GATE_GLASS_CANNON, right: GATE_SPEED_DEMON },
    },
    // Wave 4: multi-dodger + patrol pressure
    { time: 52, type: 'debris_spawn', x: 140, count: 2 },
    { time: 54, type: 'enemy_spawn', enemyType: 'dodger', x: 80 },
    { time: 54, type: 'enemy_spawn', enemyType: 'dodger', x: 240 },
    { time: 57, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    { time: 59, type: 'enemy_spawn', enemyType: 'swarm', x: 120, count: 4 },
    // Refit gate
    {
      time: 65,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_REFIT_HEAVY, right: GATE_REFIT_SPEED },
    },
    // Wave 5: dodger swarm with debris
    { time: 70, type: 'debris_spawn', x: 200, count: 2 },
    { time: 72, type: 'enemy_spawn', enemyType: 'dodger', x: 100 },
    { time: 72, type: 'enemy_spawn', enemyType: 'dodger', x: 220 },
    { time: 75, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    { time: 77, type: 'enemy_spawn', enemyType: 'stationary', x: 60 },
    // Minimal recovery
    {
      time: 83,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_15, right: GATE_SPD_UP },
    },
    // Wave 6: finale — dodgers everywhere
    { time: 88, type: 'enemy_spawn', enemyType: 'dodger', x: 80 },
    { time: 88, type: 'enemy_spawn', enemyType: 'dodger', x: 160 },
    { time: 88, type: 'enemy_spawn', enemyType: 'dodger', x: 240 },
    { time: 92, type: 'enemy_spawn', enemyType: 'patrol', x: 120 },
    { time: 94, type: 'enemy_spawn', enemyType: 'swarm', x: 200, count: 5 },
    // Enhance gate for combo
    {
      time: 100,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_FR_UP },
    },
  ],
};
