import type { StageDefinition } from '@/types/stages';
import {
  GATE_ATK_UP,
  GATE_SPD_UP,
  GATE_ATK_UP_20,
  GATE_FR_UP_30,
  GATE_HEAL_20,
  GATE_HEAL_15,
  GATE_GLASS_CANNON,
  GATE_RAPID_FIRE,
  GATE_SHIELD,
  PAIR_REFIT_GUARDIAN,
  PAIR_ENHANCE_ACT3,
} from '@/game/gates';

/** Stage 13: Command Nexus — Summoner introduction, protected by phalanx; must prioritize targets */
export const STAGE_13: StageDefinition = {
  id: 13,
  name: 'Command Nexus',
  isBossStage: false,
  duration: 120,
  difficulty: {
    scrollSpeedMultiplier: 1.2,
    enemySpawnInterval: 2.0,
    enemyHpMultiplier: 1.5,
    enemyAtkMultiplier: 1.3,
    maxConcurrentEnemies: 12,
    bulletSpeedMultiplier: 1.2,
    attackIntervalMultiplier: 0.85,
  },
  timeline: [
    // Wave 1: phalanx escort opener
    { time: 3, type: 'enemy_spawn', enemyType: 'phalanx', x: 100 },
    { time: 3, type: 'enemy_spawn', enemyType: 'phalanx', x: 220 },
    { time: 6, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    // First summoner introduction — protected by phalanx
    { time: 12, type: 'enemy_spawn', enemyType: 'summoner', x: 160 },
    { time: 12, type: 'enemy_spawn', enemyType: 'phalanx', x: 100 },
    // Enhance gate (Act 3)
    { time: 18, type: 'gate_spawn', gateConfig: PAIR_ENHANCE_ACT3 },
    // Wave 2: summoner + dodger combo
    { time: 23, type: 'enemy_spawn', enemyType: 'summoner', x: 80 },
    { time: 25, type: 'enemy_spawn', enemyType: 'dodger', x: 220 },
    { time: 27, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    // Recovery gate
    {
      time: 33,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_20, right: GATE_ATK_UP },
    },
    // Wave 3: summoner behind phalanx wall in boost lane
    { time: 38, type: 'boost_lane_start', x: 50, width: 220 },
    { time: 39, type: 'enemy_spawn', enemyType: 'phalanx', x: 80 },
    { time: 39, type: 'enemy_spawn', enemyType: 'phalanx', x: 160 },
    { time: 39, type: 'enemy_spawn', enemyType: 'phalanx', x: 240 },
    { time: 41, type: 'enemy_spawn', enemyType: 'summoner', x: 160 },
    { time: 44, type: 'boost_lane_end' },
    // Refit Guardian gate
    { time: 49, type: 'gate_spawn', gateConfig: PAIR_REFIT_GUARDIAN },
    // Wave 4: double summoner + debris
    { time: 54, type: 'debris_spawn', x: 120, count: 2 },
    { time: 56, type: 'enemy_spawn', enemyType: 'summoner', x: 80 },
    { time: 56, type: 'enemy_spawn', enemyType: 'summoner', x: 240 },
    { time: 59, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 5 },
    // Tradeoff gate
    {
      time: 65,
      type: 'gate_spawn',
      gateConfig: { layout: 'optional', left: GATE_GLASS_CANNON, right: GATE_RAPID_FIRE },
    },
    // Wave 5: summoner + juggernaut combo
    { time: 70, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 72, type: 'enemy_spawn', enemyType: 'summoner', x: 80 },
    { time: 74, type: 'enemy_spawn', enemyType: 'dodger', x: 240 },
    { time: 76, type: 'debris_spawn', x: 200, count: 2 },
    // Minimal recovery
    {
      time: 82,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_15, right: GATE_SHIELD },
    },
    // Wave 6: triple summoner onslaught
    { time: 87, type: 'enemy_spawn', enemyType: 'summoner', x: 60 },
    { time: 87, type: 'enemy_spawn', enemyType: 'summoner', x: 160 },
    { time: 87, type: 'enemy_spawn', enemyType: 'summoner', x: 260 },
    { time: 90, type: 'enemy_spawn', enemyType: 'phalanx', x: 120 },
    { time: 90, type: 'enemy_spawn', enemyType: 'phalanx', x: 200 },
    // Enhance gate
    {
      time: 96,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP_20, right: GATE_FR_UP_30 },
    },
    // Wave 7: finale — summoner + dodger + patrol
    { time: 101, type: 'enemy_spawn', enemyType: 'summoner', x: 160 },
    { time: 103, type: 'enemy_spawn', enemyType: 'dodger', x: 80 },
    { time: 103, type: 'enemy_spawn', enemyType: 'dodger', x: 240 },
    { time: 106, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    // Final enhance for combo
    {
      time: 112,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
  ],
};
