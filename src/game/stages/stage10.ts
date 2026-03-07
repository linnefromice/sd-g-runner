import type { StageDefinition } from '@/types/stages';
import { getDifficultyForStage } from '@/game/difficulty';
import {
  GATE_ATK_UP,
  GATE_SPD_UP,
  GATE_FR_UP,
  GATE_ATK_UP_15,
  GATE_FR_UP_30,
  GATE_HEAL_50P,
  GATE_HEAL_FULL,
} from '@/game/gates';

/** Stage 10: Omega Core — Boss 2 stage */
export const STAGE_10: StageDefinition = {
  id: 10,
  name: 'Omega Core',
  isBossStage: true,
  duration: 180,
  difficulty: getDifficultyForStage(10),
  timeline: [
    // Pre-boss wave 1: mixed opener
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 5, type: 'enemy_spawn', enemyType: 'patrol', x: 220 },
    { time: 8, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 5 },
    // Enhance gate (combo start)
    {
      time: 14,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP_15, right: GATE_FR_UP_30 },
    },
    // Pre-boss wave 2: phalanx + juggernaut
    { time: 20, type: 'enemy_spawn', enemyType: 'phalanx', x: 120 },
    { time: 22, type: 'enemy_spawn', enemyType: 'juggernaut', x: 200 },
    { time: 24, type: 'enemy_spawn', enemyType: 'swarm', x: 80, count: 6 },
    // Enhance gate (combo 2)
    {
      time: 30,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_FR_UP },
    },
    // Pre-boss wave 3: dense all-type
    { time: 36, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 38, type: 'enemy_spawn', enemyType: 'phalanx', x: 80 },
    { time: 38, type: 'enemy_spawn', enemyType: 'phalanx', x: 240 },
    // Recovery before boss
    {
      time: 46,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_FULL, right: GATE_HEAL_50P },
    },
    // Enhance gate (combo 3 → awakening chance)
    {
      time: 54,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
    // Boss spawn
    { time: 65, type: 'boss_spawn', bossId: 'boss_2' },
  ],
};
