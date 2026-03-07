export interface BonusResult {
  key: string;
  points: number;
  creditMultiplier: number;
}

export interface BonusInput {
  damageTaken: number;
  awakenedCount: number;
  enemiesSpawned: number;
  enemiesKilled: number;
  isBossStage: boolean;
  remainingTime: number;
}

export function calculateBonuses(input: BonusInput): BonusResult[] {
  const bonuses: BonusResult[] = [];

  if (input.damageTaken === 0) {
    bonuses.push({ key: 'noDamage', points: 0, creditMultiplier: 2.0 });
  }

  if (input.awakenedCount > 0) {
    bonuses.push({ key: 'combo', points: input.awakenedCount * 500, creditMultiplier: 1.0 });
  }

  if (input.enemiesSpawned > 0 && input.enemiesKilled >= input.enemiesSpawned) {
    bonuses.push({ key: 'fullClear', points: 1000, creditMultiplier: 1.0 });
  }

  if (!input.isBossStage && input.remainingTime > 0) {
    bonuses.push({ key: 'speedClear', points: Math.floor(input.remainingTime) * 10, creditMultiplier: 1.0 });
  }

  return bonuses;
}

export function applyScoreBonus(baseScore: number, bonuses: BonusResult[]): number {
  let total = baseScore;
  for (const b of bonuses) total += b.points;
  if (bonuses.some((b) => b.key === 'noDamage')) total = Math.floor(total * 1.5);
  return total;
}

export function applyCreditBonus(baseCredits: number, bonuses: BonusResult[]): number {
  let multiplier = 1.0;
  for (const b of bonuses) {
    if (b.creditMultiplier > multiplier) multiplier = b.creditMultiplier;
  }
  return Math.floor(baseCredits * multiplier);
}
