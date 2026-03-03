import { getEnemyScore, getStageClearScore, getStageClearCredits } from '../scoring';

describe('getEnemyScore', () => {
  it('returns 100 for stationary enemies', () => {
    expect(getEnemyScore('stationary')).toBe(100);
  });

  it('returns 200 for patrol enemies', () => {
    expect(getEnemyScore('patrol')).toBe(200);
  });
});

describe('getStageClearScore', () => {
  it('returns 1000 for normal stage', () => {
    expect(getStageClearScore(false)).toBe(1000);
  });

  it('returns 3000 for boss stage', () => {
    expect(getStageClearScore(true)).toBe(3000);
  });
});

describe('getStageClearCredits', () => {
  it('returns 50 for normal stage', () => {
    expect(getStageClearCredits(false)).toBe(50);
  });

  it('returns 150 for boss stage', () => {
    expect(getStageClearCredits(true)).toBe(150);
  });
});
