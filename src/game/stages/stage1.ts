import type { StageDefinition } from '@/types/stages';

/** Stage 1: Training Ground (§18) */
export const STAGE_1: StageDefinition = {
  id: 1,
  name: 'Training Ground',
  isBossStage: false,
  duration: 90,
  difficulty: {
    scrollSpeedMultiplier: 1.0,
    enemySpawnInterval: 3.0,
    enemyHpMultiplier: 1.0,
    enemyAtkMultiplier: 1.0,
    maxConcurrentEnemies: 2,
  },
  timeline: [
    { time: 5, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    { time: 10, type: 'enemy_spawn', enemyType: 'stationary', x: 80 },
    { time: 10, type: 'enemy_spawn', enemyType: 'stationary', x: 240 },
    {
      time: 20,
      type: 'gate_spawn',
      gateConfig: {
        layout: 'forced',
        left: {
          type: 'enhance',
          displayLabel: 'ATK +5',
          effects: [{ kind: 'stat_add', stat: 'atk', value: 5 }],
        },
        right: {
          type: 'enhance',
          displayLabel: 'SPD +10%',
          effects: [{ kind: 'stat_multiply', stat: 'speed', value: 1.1 }],
        },
      },
    },
    { time: 30, type: 'enemy_spawn', enemyType: 'stationary', x: 100 },
    { time: 30, type: 'enemy_spawn', enemyType: 'stationary', x: 220 },
    { time: 40, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    {
      time: 50,
      type: 'gate_spawn',
      gateConfig: {
        layout: 'forced',
        left: {
          type: 'refit',
          displayLabel: '→ Heavy',
          effects: [{ kind: 'refit', targetForm: 'SD_HeavyArtillery' }],
        },
        right: {
          type: 'refit',
          displayLabel: '→ Speed',
          effects: [{ kind: 'refit', targetForm: 'SD_HighSpeed' }],
        },
      },
    },
    { time: 55, type: 'enemy_spawn', enemyType: 'stationary', x: 60 },
    { time: 55, type: 'enemy_spawn', enemyType: 'stationary', x: 260 },
    { time: 65, type: 'enemy_spawn', enemyType: 'stationary', x: 160 },
    {
      time: 75,
      type: 'gate_spawn',
      gateConfig: {
        layout: 'forced',
        left: {
          type: 'enhance',
          displayLabel: 'ATK +5',
          effects: [{ kind: 'stat_add', stat: 'atk', value: 5 }],
        },
        right: {
          type: 'enhance',
          displayLabel: 'FR +20%',
          effects: [{ kind: 'stat_multiply', stat: 'fireRate', value: 1.2 }],
        },
      },
    },
    { time: 80, type: 'enemy_spawn', enemyType: 'stationary', x: 100 },
    { time: 80, type: 'enemy_spawn', enemyType: 'stationary', x: 200 },
  ],
};
