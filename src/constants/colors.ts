import type { GateType } from '@/types/gates';

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
