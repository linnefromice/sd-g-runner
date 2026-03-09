import type { EnemyType } from '@/types/enemies';
import type { StageEvent } from '@/types/stages';
import type { GatePairConfig } from '@/types/gates';
import {
  PAIR_ATK_SPD,
  PAIR_RECOVERY,
  PAIR_ATK_FR,
  PAIR_ENHANCE_STRONG,
  PAIR_TRADEOFF_OPTIONAL,
  PAIR_TRADEOFF_EXTREME,
  PAIR_REFIT,
  PAIR_GROWTH_ATK_SPD,
  PAIR_ROULETTE_ATK,
  PAIR_ENHANCE_ACT3,
  PAIR_RECOVERY_FULL,
  PAIR_REFIT_GUARDIAN,
} from '@/game/gates';

// Pool of enemy types, progressively unlocked
const ENEMY_POOL: EnemyType[] = [
  'stationary',
  'patrol',
  'rush',
  'swarm',
  'phalanx',
  'juggernaut',
  'dodger',
  'splitter',
  'summoner',
  'sentinel',
  'carrier',
];

// Gate pairs available for endless mode, ordered by intensity
const GATE_PAIRS_EARLY: GatePairConfig[] = [
  PAIR_ATK_SPD,
  PAIR_RECOVERY,
  PAIR_ATK_FR,
  PAIR_GROWTH_ATK_SPD,
];

const GATE_PAIRS_MID: GatePairConfig[] = [
  PAIR_ENHANCE_STRONG,
  PAIR_TRADEOFF_OPTIONAL,
  PAIR_REFIT,
  PAIR_ROULETTE_ATK,
];

const GATE_PAIRS_LATE: GatePairConfig[] = [
  PAIR_ENHANCE_ACT3,
  PAIR_TRADEOFF_EXTREME,
  PAIR_RECOVERY_FULL,
  PAIR_REFIT_GUARDIAN,
];

/**
 * Simple seeded random for reproducibility.
 * Returns a value in [0, 1).
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function getRandomGatePair(waveNumber: number): GatePairConfig {
  let pool: GatePairConfig[];
  if (waveNumber < 4) {
    pool = GATE_PAIRS_EARLY;
  } else if (waveNumber < 10) {
    pool = [...GATE_PAIRS_EARLY, ...GATE_PAIRS_MID];
  } else {
    pool = [...GATE_PAIRS_EARLY, ...GATE_PAIRS_MID, ...GATE_PAIRS_LATE];
  }
  const index = Math.floor(seededRandom(waveNumber * 777) * pool.length);
  return pool[index];
}

/**
 * Generate a wave of stage events for endless mode.
 * Each wave spans 30 seconds of game time.
 */
export function generateEndlessWave(waveNumber: number): StageEvent[] {
  const events: StageEvent[] = [];
  const baseTime = waveNumber * 30; // 30s per wave
  const enemyCount = Math.min(8, 3 + Math.floor(waveNumber / 2));
  // Progressively unlock more enemy types
  const availableTypes = Math.min(ENEMY_POOL.length, 3 + waveNumber);

  for (let i = 0; i < enemyCount; i++) {
    const typeIndex = Math.floor(
      seededRandom(waveNumber * 100 + i) * availableTypes
    );
    events.push({
      time: baseTime + i * 3,
      type: 'enemy_spawn',
      enemyType: ENEMY_POOL[typeIndex],
      x: 40 + seededRandom(waveNumber * 100 + i + 50) * 240,
    });
  }

  // Gate every 2 waves (at wave 1, 3, 5, ...)
  if (waveNumber % 2 === 1) {
    events.push({
      time: baseTime + 15,
      type: 'gate_spawn',
      gateConfig: getRandomGatePair(waveNumber),
    });
  }

  // Sort by time to ensure chronological order
  events.sort((a, b) => a.time - b.time);

  return events;
}

/**
 * Get difficulty parameters for endless mode based on elapsed time.
 * Difficulty scales gradually over minutes of play.
 */
export function getEndlessDifficulty(elapsedTime: number) {
  const minute = elapsedTime / 60;
  return {
    scrollSpeedMultiplier: 1.0 + minute * 0.1,
    enemySpawnInterval: Math.max(0.8, 2.5 - minute * 0.2),
    enemyHpMultiplier: 1.0 + minute * 0.3,
    enemyAtkMultiplier: 1.0 + minute * 0.15,
    maxConcurrentEnemies: Math.min(20, 6 + Math.floor(minute * 2)),
    bulletSpeedMultiplier: 1.0 + minute * 0.1,
    attackIntervalMultiplier: Math.max(0.5, 1.0 - minute * 0.08),
  };
}
