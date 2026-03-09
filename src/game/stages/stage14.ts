import type { StageDefinition } from '@/types/stages';
import {
  GATE_ATK_UP,
  GATE_SPD_UP,
  GATE_ATK_UP_20,
  GATE_FR_UP_30,
  GATE_HEAL_15,
  GATE_HEAL_20,
  GATE_TRADEOFF_BERSERK,
  GATE_SHIELD,
  GATE_REFIT_HEAVY,
  GATE_REFIT_SPEED,
  PAIR_ENHANCE_ACT3,
  PAIR_ROULETTE_ATK,
} from '@/game/gates';

/** Stage 14: Chaos Corridor — All 9 enemy types, dense high-intensity combat */
export const STAGE_14: StageDefinition = {
  id: 14,
  name: 'Chaos Corridor',
  isBossStage: false,
  duration: 130,
  difficulty: {
    scrollSpeedMultiplier: 1.3,
    enemySpawnInterval: 1.6,
    enemyHpMultiplier: 1.6,
    enemyAtkMultiplier: 1.4,
    maxConcurrentEnemies: 16,
    bulletSpeedMultiplier: 1.3,
    attackIntervalMultiplier: 0.8,
  },
  timeline: [
    // Wave 1: aggressive multi-type opener
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 240 },
    { time: 5, type: 'enemy_spawn', enemyType: 'dodger', x: 160 },
    { time: 7, type: 'enemy_spawn', enemyType: 'swarm', x: 120, count: 5 },
    // Enhance gate (Act 3)
    { time: 13, type: 'gate_spawn', gateConfig: PAIR_ENHANCE_ACT3 },
    // Wave 2: splitter + summoner intro
    { time: 18, type: 'enemy_spawn', enemyType: 'splitter', x: 100 },
    { time: 18, type: 'enemy_spawn', enemyType: 'summoner', x: 220 },
    { time: 21, type: 'debris_spawn', x: 160, count: 2 },
    { time: 23, type: 'enemy_spawn', enemyType: 'stationary', x: 60 },
    { time: 23, type: 'enemy_spawn', enemyType: 'stationary', x: 260 },
    // Roulette gate
    { time: 29, type: 'gate_spawn', gateConfig: PAIR_ROULETTE_ATK },
    // Wave 3: phalanx wall + juggernaut in boost lane
    { time: 34, type: 'boost_lane_start', x: 40, width: 240 },
    { time: 35, type: 'enemy_spawn', enemyType: 'phalanx', x: 80 },
    { time: 35, type: 'enemy_spawn', enemyType: 'phalanx', x: 160 },
    { time: 35, type: 'enemy_spawn', enemyType: 'phalanx', x: 240 },
    { time: 37, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 39, type: 'enemy_spawn', enemyType: 'dodger', x: 80 },
    { time: 41, type: 'boost_lane_end' },
    // Recovery gate
    {
      time: 46,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_20, right: GATE_ATK_UP },
    },
    // Wave 4: summoner + splitter chain
    { time: 51, type: 'enemy_spawn', enemyType: 'summoner', x: 80 },
    { time: 51, type: 'enemy_spawn', enemyType: 'splitter', x: 240 },
    { time: 53, type: 'enemy_spawn', enemyType: 'dodger', x: 160 },
    { time: 55, type: 'enemy_spawn', enemyType: 'swarm', x: 120, count: 6 },
    { time: 57, type: 'debris_spawn', x: 200, count: 3 },
    // Tradeoff berserk gate
    {
      time: 62,
      type: 'gate_spawn',
      gateConfig: { layout: 'optional', left: GATE_TRADEOFF_BERSERK, right: GATE_SHIELD },
    },
    // Wave 5: double juggernaut + dodger flanks
    { time: 67, type: 'enemy_spawn', enemyType: 'juggernaut', x: 100 },
    { time: 67, type: 'enemy_spawn', enemyType: 'juggernaut', x: 220 },
    { time: 70, type: 'enemy_spawn', enemyType: 'dodger', x: 60 },
    { time: 70, type: 'enemy_spawn', enemyType: 'dodger', x: 260 },
    { time: 72, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    // Refit gate
    {
      time: 77,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_REFIT_HEAVY, right: GATE_REFIT_SPEED },
    },
    // Wave 6: all-type assault in boost lane
    { time: 82, type: 'boost_lane_start', x: 60, width: 200 },
    { time: 83, type: 'enemy_spawn', enemyType: 'summoner', x: 160 },
    { time: 83, type: 'enemy_spawn', enemyType: 'splitter', x: 80 },
    { time: 85, type: 'enemy_spawn', enemyType: 'phalanx', x: 200 },
    { time: 87, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 8 },
    { time: 89, type: 'boost_lane_end' },
    // Minimal recovery
    {
      time: 93,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_15, right: GATE_ATK_UP_20 },
    },
    // Wave 7: dense multi-type + debris
    { time: 98, type: 'debris_spawn', x: 120, count: 3 },
    { time: 99, type: 'enemy_spawn', enemyType: 'summoner', x: 100 },
    { time: 99, type: 'enemy_spawn', enemyType: 'summoner', x: 220 },
    { time: 101, type: 'enemy_spawn', enemyType: 'splitter', x: 160 },
    { time: 103, type: 'enemy_spawn', enemyType: 'dodger', x: 80 },
    { time: 103, type: 'enemy_spawn', enemyType: 'dodger', x: 240 },
    // Enhance gate for combo buildup
    {
      time: 108,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP_20, right: GATE_FR_UP_30 },
    },
    // Wave 8: finale — everything at once
    { time: 113, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 113, type: 'enemy_spawn', enemyType: 'splitter', x: 80 },
    { time: 113, type: 'enemy_spawn', enemyType: 'splitter', x: 240 },
    { time: 115, type: 'enemy_spawn', enemyType: 'summoner', x: 160 },
    { time: 117, type: 'enemy_spawn', enemyType: 'swarm', x: 120, count: 6 },
    { time: 119, type: 'enemy_spawn', enemyType: 'dodger', x: 200 },
    // Final enhance
    {
      time: 124,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
  ],
};
