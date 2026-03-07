import type { StageDefinition } from '@/types/stages';
import { getDifficultyForStage } from '@/game/difficulty';
import {
  GATE_ATK_UP,
  GATE_SPD_UP,
  GATE_FR_UP,
  GATE_ATK_UP_15,
  GATE_HEAL_30,
  GATE_HEAL_50P,
  GATE_RAPID_GLASS,
  GATE_TANK,
  GATE_REFIT_HEAVY,
  GATE_REFIT_SPEED,
  PAIR_ATK_FR,
  PAIR_RECOVERY_FULL,
} from '@/game/gates';

/** Stage 8: War Front — Juggernaut introduction */
export const STAGE_8: StageDefinition = {
  id: 8,
  name: 'War Front',
  isBossStage: false,
  duration: 120,
  difficulty: getDifficultyForStage(8),
  timeline: [
    // Wave 1: aggressive opening
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 220 },
    { time: 6, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 5 },
    // Enhance gate
    { time: 12, type: 'gate_spawn', gateConfig: PAIR_ATK_FR },
    // Wave 2: first juggernaut
    { time: 18, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 20, type: 'enemy_spawn', enemyType: 'patrol', x: 80 },
    { time: 20, type: 'enemy_spawn', enemyType: 'patrol', x: 240 },
    // Recovery (full heal option)
    { time: 27, type: 'gate_spawn', gateConfig: PAIR_RECOVERY_FULL },
    // Wave 3: phalanx + swarm support
    { time: 34, type: 'enemy_spawn', enemyType: 'phalanx', x: 120 },
    { time: 36, type: 'enemy_spawn', enemyType: 'swarm', x: 220, count: 6 },
    { time: 38, type: 'enemy_spawn', enemyType: 'stationary', x: 60 },
    { time: 38, type: 'enemy_spawn', enemyType: 'stationary', x: 260 },
    // Refit gate
    {
      time: 44,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_REFIT_HEAVY, right: GATE_REFIT_SPEED },
    },
    // Wave 4: juggernaut + phalanx combo
    { time: 50, type: 'enemy_spawn', enemyType: 'juggernaut', x: 100 },
    { time: 52, type: 'enemy_spawn', enemyType: 'phalanx', x: 220 },
    { time: 54, type: 'enemy_spawn', enemyType: 'patrol', x: 160 },
    // Tradeoff gate (extreme)
    {
      time: 60,
      type: 'gate_spawn',
      gateConfig: { layout: 'optional', left: GATE_RAPID_GLASS, right: GATE_TANK },
    },
    // Wave 5: swarm escort with juggernaut
    { time: 66, type: 'enemy_spawn', enemyType: 'swarm', x: 80, count: 8 },
    { time: 68, type: 'enemy_spawn', enemyType: 'juggernaut', x: 200 },
    { time: 70, type: 'enemy_spawn', enemyType: 'patrol', x: 140 },
    // Enhance gate (strong)
    {
      time: 76,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP_15, right: GATE_FR_UP },
    },
    // Wave 6: all types mix
    { time: 82, type: 'enemy_spawn', enemyType: 'phalanx', x: 80 },
    { time: 82, type: 'enemy_spawn', enemyType: 'phalanx', x: 240 },
    { time: 85, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 5 },
    { time: 88, type: 'enemy_spawn', enemyType: 'patrol', x: 120 },
    // Recovery before finale
    {
      time: 94,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_50P, right: GATE_HEAL_30 },
    },
    // Wave 7: dense finale
    { time: 100, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 102, type: 'enemy_spawn', enemyType: 'swarm', x: 80, count: 6 },
    { time: 104, type: 'enemy_spawn', enemyType: 'patrol', x: 200 },
    { time: 106, type: 'enemy_spawn', enemyType: 'phalanx', x: 120 },
    // Enhance gate for combo
    {
      time: 110,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
  ],
};
