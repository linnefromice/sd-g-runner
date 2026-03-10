import type { StageDefinition } from '@/types/stages';
import { getDifficultyForStage } from '@/game/difficulty';
import {
  GATE_ATK_UP,
  GATE_SPD_UP,
  GATE_ATK_UP_20,
  GATE_FR_UP_30,
  GATE_HEAL_20,
  GATE_RAPID_GLASS,
  GATE_TANK,
  GATE_REFIT_HEAVY,
  GATE_REFIT_SPEED,
  PAIR_ENHANCE_ACT3,
} from '@/game/gates';

/** Stage 15: Terminus Core — Boss 3 stage, short pre-boss gauntlet then final boss */
export const STAGE_15: StageDefinition = {
  id: 15,
  name: 'Terminus Core',
  isBossStage: true,
  duration: 180,
  difficulty: { ...getDifficultyForStage(15), maxConcurrentEnemies: 8 },
  timeline: [
    // Pre-boss wave 1: mixed opener
    { time: 3, type: 'enemy_spawn', enemyType: 'patrol', x: 100 },
    { time: 5, type: 'enemy_spawn', enemyType: 'dodger', x: 220 },
    { time: 8, type: 'enemy_spawn', enemyType: 'swarm', x: 160, count: 5 },
    // Enhance gate (combo start)
    { time: 14, type: 'gate_spawn', gateConfig: PAIR_ENHANCE_ACT3 },
    // Pre-boss wave 2: summoner + phalanx + debris
    { time: 19, type: 'debris_spawn', x: 120, count: 2 },
    { time: 20, type: 'enemy_spawn', enemyType: 'phalanx', x: 120 },
    { time: 22, type: 'enemy_spawn', enemyType: 'summoner', x: 200 },
    { time: 24, type: 'enemy_spawn', enemyType: 'splitter', x: 80 },
    // Enhance gate (combo 2)
    {
      time: 30,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP_20, right: GATE_FR_UP_30 },
    },
    // Pre-boss wave 3: dense all-type in boost lane
    { time: 35, type: 'boost_lane_start', x: 60, width: 200 },
    { time: 36, type: 'enemy_spawn', enemyType: 'juggernaut', x: 160 },
    { time: 38, type: 'enemy_spawn', enemyType: 'dodger', x: 80 },
    { time: 38, type: 'enemy_spawn', enemyType: 'dodger', x: 240 },
    { time: 41, type: 'boost_lane_end' },
    // Tradeoff before boss
    {
      time: 46,
      type: 'gate_spawn',
      gateConfig: { layout: 'optional', left: GATE_RAPID_GLASS, right: GATE_TANK },
    },
    // Refit gate
    {
      time: 50,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_REFIT_HEAVY, right: GATE_REFIT_SPEED },
    },
    // Enhance gate (combo 3 → awakening chance) + recovery
    {
      time: 54,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_HEAL_20, right: GATE_ATK_UP },
    },
    {
      time: 58,
      type: 'gate_spawn',
      gateConfig: { layout: 'forced', left: GATE_ATK_UP, right: GATE_SPD_UP },
    },
    // Boss spawn
    { time: 65, type: 'boss_spawn', bossId: 'boss_3' },
  ],
};
