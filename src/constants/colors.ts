import type { GateType } from '@/types/gates';
import type { EnemyType } from '@/types/enemies';

/** Color palette from §17.1 */
export const COLORS = {
  bgBase: '#1A1A2E',
  bgNavy: '#16213E',
  bgDark: '#0a0a14',

  neonBlue: '#00D4FF',
  neonGreen: '#00FF88',
  neonPink: '#FF006E',
  neonRed: '#FF3366',

  white: '#FFFFFF',
  lightGray: '#B0B0B0',

  gateEnhance: '#00FF88',
  gateRefit: '#00D4FF',
  gateTradeoff: '#FFD600',
  gateRecovery: '#FF69B4',
  gateGrowth: '#66FF66',
  gateRoulette: '#FF8800',

  entityPlayer: '#00D4FF',
  entityEnemy: '#FF3366',
  entityBoss: '#FF0044',
  entityPlayerBullet: '#00FFCC',
  entityEnemyBullet: '#FF006E',
  entityDebris: '#886644',

  scoreYellow: '#FFEA00',
  hpHealthy: '#00E5FF',
  hpCritical: '#FF4081',
} as const;

export const GATE_COLORS: Record<GateType, string> = {
  enhance: COLORS.gateEnhance,
  refit: COLORS.gateRefit,
  tradeoff: COLORS.gateTradeoff,
  recovery: COLORS.gateRecovery,
  growth: COLORS.gateGrowth,
  roulette: COLORS.gateRoulette,
};

/** Per-enemy-type colors for glow differentiation (D2) */
export const ENEMY_TYPE_COLORS: Record<EnemyType, string> = {
  stationary: '#FF3366',  // pink (same as base)
  patrol: '#FF8844',      // orange — stands out as aimed-shot threat
  rush: '#FF4466',        // red-pink — aggressive
  swarm: '#FF3366',       // pink (same as base)
  phalanx: '#4488FF',     // blue — shield/formation type
  juggernaut: '#AA44FF',  // purple — heavy/elite
};
