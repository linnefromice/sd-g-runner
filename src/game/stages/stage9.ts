import type { StageDefinition } from '@/types/stages';
import { getDifficultyForStage } from '@/game/difficulty';
import {
  GATE_ATK_UP,
  GATE_SPD_UP,
  GATE_ATK_UP_10,
  GATE_ATK_UP_15,
  GATE_FR_UP_30,
  GATE_HEAL_30,
  GATE_HEAL_50P,
  GATE_HEAL_FULL,
  GATE_REFIT_HEAVY,
  GATE_REFIT_SPEED,
  PAIR_ENHANCE_STRONG,
  PAIR_TRADEOFF_EXTREME,
} from '@/game/gates';

/** Stage 9: Final Approach — All enemy types, high density */
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
    // Wave 2: phalanx wall + juggernaut
    { time: 18, type: 'enemy_spawn', enemyType: 'phalanx', x: 100 },
    { time: 18, type: 'enemy_spawn', enemyType: 'phalanx', x: 220 },
    { time: 22, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    // Recovery
    {
      time: 28,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_50P, right: GATE_HEAL_30 },
    },
    // Wave 3: swarm + patrol escort
    { time: 34, type: 'enemy_spawn', enemyType: 'swarm', x: 80, count: 8 },
    { time: 36, type: 'enemy_spawn', enemyType: 'patrol', x: 200 },
    { time: 36, type: 'enemy_spawn', enemyType: 'patrol', x: 120 },
    { time: 38, type: 'enemy_spawn', enemyType: 'stationary', x: 260 },
    // Refit gate
    {
      time: 44,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_REFIT_HEAVY, right: GATE_REFIT_SPEED },
    },
    // Wave 4: double juggernaut
    { time: 50, type: 'enemy_spawn', enemyType: 'juggernaut', x: 100 },
    { time: 52, type: 'enemy_spawn', enemyType: 'juggernaut', x: 220 },
    { time: 54, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 5 },
    // Tradeoff gate (extreme)
    { time: 60, type: 'gate_spawn', gateConfig: PAIR_TRADEOFF_EXTREME },
    // Wave 5: phalanx wall + swarm escorts
    { time: 66, type: 'enemy_spawn', enemyType: 'phalanx', x: 80 },
    { time: 66, type: 'enemy_spawn', enemyType: 'phalanx', x: 160 },
    { time: 66, type: 'enemy_spawn', enemyType: 'phalanx', x: 240 },
    { time: 70, type: 'enemy_spawn', enemyType: 'swarm', x: 120, count: 6 },
    // Enhance gate (combo buildup)
    {
      time: 76,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP_10, right: GATE_FR_UP_30 },
    },
    // Wave 6: juggernaut + patrol dense
    { time: 82, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 84, type: 'enemy_spawn', enemyType: 'patrol', x: 60 },
    { time: 84, type: 'enemy_spawn', enemyType: 'patrol', x: 260 },
    { time: 86, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 8 },
    // Full recovery
    {
      time: 92,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_FULL, right: GATE_ATK_UP_15 },
    },
    // Wave 7: everything at once
    { time: 98, type: 'enemy_spawn', enemyType: 'juggernaut', x: 100 },
    { time: 98, type: 'enemy_spawn', enemyType: 'phalanx', x: 220 },
    { time: 100, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 8 },
    { time: 102, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    { time: 102, type: 'enemy_spawn', enemyType: 'patrol', x: 240 },
    // Enhance gate (combo 3)
    {
      time: 108,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
    // Final wave: massive
    { time: 114, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 114, type: 'enemy_spawn', enemyType: 'phalanx', x: 80 },
    { time: 114, type: 'enemy_spawn', enemyType: 'phalanx', x: 240 },
    { time: 116, type: 'enemy_spawn', enemyType: 'swarm', x: 120, count: 6 },
    { time: 118, type: 'enemy_spawn', enemyType: 'patrol', x: 200 },
  ],
};
