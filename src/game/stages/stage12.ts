import type { StageDefinition } from '@/types/stages';
import {
  GATE_ATK_UP,
  GATE_ATK_UP_15,
  GATE_FR_UP_30,
  GATE_HEAL_20,
  GATE_HEAL_15,
  GATE_RAPID_GLASS,
  GATE_TANK,
  GATE_REFIT_HEAVY,
  GATE_REFIT_SPEED,
  GATE_GROWTH_ATK,
  GATE_GROWTH_SPD,
  PAIR_ENHANCE_STRONG,
} from '@/game/gates';

/** Stage 12: Hive Cluster — Splitter introduction, chain-splitting enemies create swarm explosions */
export const STAGE_12: StageDefinition = {
  id: 12,
  name: 'Hive Cluster',
  isBossStage: false,
  duration: 120,
  difficulty: {
    scrollSpeedMultiplier: 1.1,
    enemySpawnInterval: 2.0,
    enemyHpMultiplier: 1.4,
    enemyAtkMultiplier: 1.3,
    maxConcurrentEnemies: 14,
    bulletSpeedMultiplier: 1.2,
    attackIntervalMultiplier: 0.85,
  },
  timeline: [
    // Wave 1: patrol opener with debris
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 4, type: 'debris_spawn', x: 220, count: 2 },
    { time: 6, type: 'enemy_spawn', enemyType: 'patrol', x: 240 },
    // First splitter introduction
    { time: 10, type: 'enemy_spawn', enemyType: 'splitter', x: 160 },
    // Enhance gate
    { time: 16, type: 'gate_spawn', gateConfig: PAIR_ENHANCE_STRONG },
    // Wave 2: splitter + swarm combo
    { time: 21, type: 'enemy_spawn', enemyType: 'splitter', x: 100 },
    { time: 23, type: 'enemy_spawn', enemyType: 'swarm', x: 200, count: 4 },
    { time: 26, type: 'enemy_spawn', enemyType: 'splitter', x: 240 },
    // Growth gate
    {
      time: 32,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_GROWTH_ATK, right: GATE_GROWTH_SPD },
    },
    // Wave 3: splitter chain + debris in boost lane
    { time: 37, type: 'boost_lane_start', x: 40, width: 240 },
    { time: 38, type: 'enemy_spawn', enemyType: 'splitter', x: 80 },
    { time: 38, type: 'enemy_spawn', enemyType: 'splitter', x: 240 },
    { time: 40, type: 'debris_spawn', x: 160, count: 3 },
    { time: 42, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    { time: 44, type: 'boost_lane_end' },
    // Recovery gate
    {
      time: 49,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_20, right: GATE_ATK_UP },
    },
    // Wave 4: dense splitter wave
    { time: 54, type: 'enemy_spawn', enemyType: 'splitter', x: 80 },
    { time: 55, type: 'enemy_spawn', enemyType: 'splitter', x: 160 },
    { time: 56, type: 'enemy_spawn', enemyType: 'splitter', x: 240 },
    { time: 59, type: 'enemy_spawn', enemyType: 'swarm', x: 120, count: 6 },
    // Tradeoff gate
    {
      time: 65,
      type: 'gate_spawn',
      gateConfig: { layout: 'optional', left: GATE_RAPID_GLASS, right: GATE_TANK },
    },
    // Wave 5: splitter + phalanx wall
    { time: 70, type: 'enemy_spawn', enemyType: 'phalanx', x: 100 },
    { time: 70, type: 'enemy_spawn', enemyType: 'phalanx', x: 220 },
    { time: 73, type: 'enemy_spawn', enemyType: 'splitter', x: 160 },
    { time: 76, type: 'debris_spawn', x: 80, count: 2 },
    // Refit gate
    {
      time: 81,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_REFIT_HEAVY, right: GATE_REFIT_SPEED },
    },
    // Wave 6: splitter + juggernaut combo
    { time: 86, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 88, type: 'enemy_spawn', enemyType: 'splitter', x: 80 },
    { time: 88, type: 'enemy_spawn', enemyType: 'splitter', x: 240 },
    { time: 91, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 5 },
    // Minimal recovery
    {
      time: 97,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_15, right: GATE_ATK_UP_15 },
    },
    // Wave 7: finale — splitter swarm
    { time: 102, type: 'debris_spawn', x: 160, count: 2 },
    { time: 103, type: 'enemy_spawn', enemyType: 'splitter', x: 60 },
    { time: 103, type: 'enemy_spawn', enemyType: 'splitter', x: 160 },
    { time: 103, type: 'enemy_spawn', enemyType: 'splitter', x: 260 },
    { time: 106, type: 'enemy_spawn', enemyType: 'patrol', x: 120 },
    { time: 108, type: 'enemy_spawn', enemyType: 'patrol', x: 200 },
    // Enhance gate for combo
    {
      time: 113,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_FR_UP_30 },
    },
  ],
};
