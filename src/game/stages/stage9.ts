import type { StageDefinition } from '@/types/stages';
import { getDifficultyForStage } from '@/game/difficulty';
import {
  GATE_ATK_UP,
  GATE_SPD_UP,
  GATE_ATK_UP_10,
  GATE_ATK_UP_15,
  GATE_FR_UP_30,
  GATE_HEAL_15,
  GATE_RAPID_GLASS,
  GATE_TANK,
  GATE_GLASS_CANNON,
  GATE_RAPID_FIRE,
  GATE_REFIT_HEAVY,
  GATE_REFIT_SPEED,
  PAIR_ENHANCE_STRONG,
  PAIR_TRADEOFF_EXTREME,
} from '@/game/gates';

/** Stage 9: Final Approach — All enemy types, high density, minimal recovery */
export const STAGE_9: StageDefinition = {
  id: 9,
  name: 'Final Approach',
  isBossStage: false,
  duration: 130,
  difficulty: getDifficultyForStage(9),
  timeline: [
    // Wave 1: aggressive multi-type opening
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 240 },
    { time: 5, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 6 },
    // Enhance gate (strong)
    { time: 12, type: 'gate_spawn', gateConfig: PAIR_ENHANCE_STRONG },
    // Wave 2: phalanx wall + juggernaut + debris
    { time: 17, type: 'debris_spawn', x: 160, count: 2 },
    { time: 18, type: 'enemy_spawn', enemyType: 'phalanx', x: 100 },
    { time: 18, type: 'enemy_spawn', enemyType: 'phalanx', x: 220 },
    { time: 22, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    // Tradeoff gate — replaced recovery
    {
      time: 28,
      type: 'gate_spawn',
      gateConfig: { layout: 'optional', left: GATE_GLASS_CANNON, right: GATE_RAPID_FIRE },
    },
    // Wave 3: swarm + patrol in boost lane
    { time: 33, type: 'boost_lane_start', x: 60, width: 200 },
    { time: 34, type: 'enemy_spawn', enemyType: 'swarm', x: 80, count: 8 },
    { time: 36, type: 'enemy_spawn', enemyType: 'patrol', x: 200 },
    { time: 36, type: 'enemy_spawn', enemyType: 'patrol', x: 120 },
    { time: 38, type: 'enemy_spawn', enemyType: 'stationary', x: 260 },
    { time: 41, type: 'boost_lane_end' },
    // Refit gate
    {
      time: 44,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_REFIT_HEAVY, right: GATE_REFIT_SPEED },
    },
    // Mini-boss: carrier
    { time: 45, type: 'enemy_spawn', enemyType: 'carrier', x: 140 },
    // Wave 4: double juggernaut + debris
    { time: 49, type: 'debris_spawn', x: 80, count: 3 },
    { time: 50, type: 'enemy_spawn', enemyType: 'juggernaut', x: 100 },
    { time: 52, type: 'enemy_spawn', enemyType: 'juggernaut', x: 220 },
    { time: 54, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 5 },
    // Tradeoff gate (extreme)
    { time: 60, type: 'gate_spawn', gateConfig: PAIR_TRADEOFF_EXTREME },
    // Wave 5: phalanx wall + swarm in boost lane
    { time: 65, type: 'boost_lane_start', x: 40, width: 240 },
    { time: 66, type: 'enemy_spawn', enemyType: 'phalanx', x: 80 },
    { time: 66, type: 'enemy_spawn', enemyType: 'phalanx', x: 160 },
    { time: 66, type: 'enemy_spawn', enemyType: 'phalanx', x: 240 },
    { time: 70, type: 'enemy_spawn', enemyType: 'swarm', x: 120, count: 6 },
    { time: 73, type: 'boost_lane_end' },
    // Enhance gate (combo buildup)
    {
      time: 76,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP_10, right: GATE_FR_UP_30 },
    },
    // Wave 6: juggernaut + patrol dense + debris
    { time: 81, type: 'debris_spawn', x: 200, count: 2 },
    { time: 82, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 84, type: 'enemy_spawn', enemyType: 'patrol', x: 60 },
    { time: 84, type: 'enemy_spawn', enemyType: 'patrol', x: 260 },
    { time: 86, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 8 },
    // Minimal recovery (HP+15 only — no full/50% heal available)
    {
      time: 92,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_15, right: GATE_ATK_UP_15 },
    },
    // Wave 7: everything at once
    { time: 98, type: 'enemy_spawn', enemyType: 'juggernaut', x: 100 },
    { time: 98, type: 'enemy_spawn', enemyType: 'phalanx', x: 220 },
    { time: 100, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 8 },
    { time: 102, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    { time: 102, type: 'enemy_spawn', enemyType: 'patrol', x: 240 },
    // Tradeoff before finale — no more recovery
    {
      time: 108,
      type: 'gate_spawn',
      gateConfig: { layout: 'optional', left: GATE_RAPID_GLASS, right: GATE_TANK },
    },
    // Final wave: massive + debris
    { time: 112, type: 'debris_spawn', x: 140, count: 3 },
    { time: 114, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 114, type: 'enemy_spawn', enemyType: 'phalanx', x: 80 },
    { time: 114, type: 'enemy_spawn', enemyType: 'phalanx', x: 240 },
    { time: 116, type: 'enemy_spawn', enemyType: 'swarm', x: 120, count: 6 },
    { time: 118, type: 'enemy_spawn', enemyType: 'patrol', x: 200 },
    // Enhance gate for combo
    {
      time: 122,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
  ],
};
