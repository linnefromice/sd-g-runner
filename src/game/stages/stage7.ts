import type { StageDefinition } from '@/types/stages';
import { getDifficultyForStage } from '@/game/difficulty';
import {
  GATE_ATK_UP,
  GATE_FR_UP,
  GATE_ATK_UP_10,
  GATE_HEAL_30,
  GATE_HEAL_50P,
  GATE_GLASS_CANNON,
  GATE_RAPID_FIRE,
  GATE_REFIT_HEAVY,
  GATE_REFIT_SPEED,
  PAIR_ENHANCE_STRONG,
} from '@/game/gates';

/** Stage 7: Fortress Gate — Phalanx introduction */
export const STAGE_7: StageDefinition = {
  id: 7,
  name: 'Fortress Gate',
  isBossStage: false,
  duration: 110,
  difficulty: getDifficultyForStage(7),
  timeline: [
    // Wave 1: patrol opening
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 5, type: 'enemy_spawn', enemyType: 'patrol', x: 220 },
    // Swarm flank
    { time: 10, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 5 },
    // Enhance gate
    { time: 16, type: 'gate_spawn', gateConfig: PAIR_ENHANCE_STRONG },
    // Wave 2: first phalanx
    { time: 22, type: 'enemy_spawn', enemyType: 'phalanx', x: 160 },
    { time: 24, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    { time: 24, type: 'enemy_spawn', enemyType: 'patrol', x: 240 },
    // Recovery
    {
      time: 32,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_50P, right: GATE_HEAL_30 },
    },
    // Wave 3: phalanx + swarm
    { time: 38, type: 'enemy_spawn', enemyType: 'phalanx', x: 120 },
    { time: 40, type: 'enemy_spawn', enemyType: 'swarm', x: 220, count: 6 },
    { time: 42, type: 'enemy_spawn', enemyType: 'stationary', x: 60 },
    // Refit gate
    {
      time: 48,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_REFIT_HEAVY, right: GATE_REFIT_SPEED },
    },
    // Wave 4: double phalanx wall
    { time: 54, type: 'enemy_spawn', enemyType: 'phalanx', x: 100 },
    { time: 54, type: 'enemy_spawn', enemyType: 'phalanx', x: 220 },
    { time: 58, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    // Tradeoff gate (optional)
    {
      time: 64,
      type: 'gate_spawn',
      gateConfig: { layout: 'optional', left: GATE_GLASS_CANNON, right: GATE_RAPID_FIRE },
    },
    // Wave 5: swarm wave with phalanx
    { time: 70, type: 'enemy_spawn', enemyType: 'swarm', x: 80, count: 6 },
    { time: 72, type: 'enemy_spawn', enemyType: 'phalanx', x: 200 },
    { time: 74, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    // Enhance gate (combo)
    {
      time: 80,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP_10, right: GATE_FR_UP },
    },
    // Wave 6: dense
    { time: 86, type: 'enemy_spawn', enemyType: 'phalanx', x: 160 },
    { time: 88, type: 'enemy_spawn', enemyType: 'swarm', x: 100, count: 5 },
    { time: 90, type: 'enemy_spawn', enemyType: 'patrol', x: 240 },
    // Recovery before end
    {
      time: 95,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_30, right: GATE_ATK_UP },
    },
    // Final wave
    { time: 100, type: 'enemy_spawn', enemyType: 'phalanx', x: 80 },
    { time: 100, type: 'enemy_spawn', enemyType: 'phalanx', x: 240 },
    { time: 102, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
  ],
};
