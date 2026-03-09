import { useSaveDataStore } from '../saveDataStore';

// Reset store before each test
beforeEach(() => {
  useSaveDataStore.setState({
    highScores: {},
    unlockedForms: ['SD_Standard'],
    unlockedStages: [1],
    credits: 0,
    upgrades: { baseAtk: 0, baseHp: 0, baseSpeed: 0, baseDef: 0, baseCreditBoost: 0 },
    achievements: [],
    endlessBestTime: 0,
    endlessBestScore: 0,
    settings: { bgmVolume: 0.7, seVolume: 1.0, locale: 'system' as const, hapticsEnabled: true },
    isLoaded: false,
  });
});

describe('saveDataStore', () => {
  describe('credits', () => {
    test('addCredits increases balance', () => {
      useSaveDataStore.getState().addCredits(100);
      expect(useSaveDataStore.getState().credits).toBe(100);
    });

    test('spendCredits deducts and returns true', () => {
      useSaveDataStore.getState().addCredits(200);
      const result = useSaveDataStore.getState().spendCredits(150);
      expect(result).toBe(true);
      expect(useSaveDataStore.getState().credits).toBe(50);
    });

    test('spendCredits returns false if insufficient', () => {
      useSaveDataStore.getState().addCredits(50);
      const result = useSaveDataStore.getState().spendCredits(100);
      expect(result).toBe(false);
      expect(useSaveDataStore.getState().credits).toBe(50);
    });
  });

  describe('upgradeAtk', () => {
    test('increments level and deducts credits', () => {
      useSaveDataStore.getState().addCredits(100);
      const result = useSaveDataStore.getState().upgradeAtk();
      expect(result).toBe(true);
      expect(useSaveDataStore.getState().upgrades.baseAtk).toBe(1);
      expect(useSaveDataStore.getState().credits).toBe(0);
    });

    test('returns false at max level', () => {
      useSaveDataStore.setState({
        credits: 100000,
        upgrades: { baseAtk: 10, baseHp: 0, baseSpeed: 0, baseDef: 0, baseCreditBoost: 0 },
      });
      const result = useSaveDataStore.getState().upgradeAtk();
      expect(result).toBe(false);
    });

    test('returns false if insufficient credits', () => {
      useSaveDataStore.getState().addCredits(50);
      const result = useSaveDataStore.getState().upgradeAtk();
      expect(result).toBe(false);
      expect(useSaveDataStore.getState().upgrades.baseAtk).toBe(0);
    });
  });

  describe('upgradeHp', () => {
    test('increments level and deducts credits', () => {
      useSaveDataStore.getState().addCredits(100);
      const result = useSaveDataStore.getState().upgradeHp();
      expect(result).toBe(true);
      expect(useSaveDataStore.getState().upgrades.baseHp).toBe(1);
    });
  });

  describe('upgradeSpeed', () => {
    test('has max level 5', () => {
      useSaveDataStore.setState({
        credits: 100000,
        upgrades: { baseAtk: 0, baseHp: 0, baseSpeed: 5, baseDef: 0, baseCreditBoost: 0 },
      });
      const result = useSaveDataStore.getState().upgradeSpeed();
      expect(result).toBe(false);
    });

    test('increments level when credits available', () => {
      useSaveDataStore.getState().addCredits(100);
      const result = useSaveDataStore.getState().upgradeSpeed();
      expect(result).toBe(true);
      expect(useSaveDataStore.getState().upgrades.baseSpeed).toBe(1);
    });
  });

  describe('unlockForm', () => {
    test('adds form to unlockedForms', () => {
      useSaveDataStore.getState().unlockForm('SD_HeavyArtillery');
      expect(useSaveDataStore.getState().unlockedForms).toContain('SD_HeavyArtillery');
    });

    test('does not duplicate', () => {
      useSaveDataStore.getState().unlockForm('SD_Standard');
      expect(
        useSaveDataStore.getState().unlockedForms.filter((f) => f === 'SD_Standard').length,
      ).toBe(1);
    });
  });

  describe('unlockStage', () => {
    test('adds stage to unlockedStages', () => {
      useSaveDataStore.getState().unlockStage(2);
      expect(useSaveDataStore.getState().unlockedStages).toContain(2);
    });

    test('does not duplicate', () => {
      useSaveDataStore.getState().unlockStage(1);
      expect(
        useSaveDataStore.getState().unlockedStages.filter((s) => s === 1).length,
      ).toBe(1);
    });
  });

  describe('highScores', () => {
    test('updates high score', () => {
      useSaveDataStore.getState().updateHighScore(1, 5000);
      expect(useSaveDataStore.getState().highScores[1]).toBe(5000);
    });

    test('does not downgrade high score', () => {
      useSaveDataStore.getState().updateHighScore(1, 5000);
      useSaveDataStore.getState().updateHighScore(1, 3000);
      expect(useSaveDataStore.getState().highScores[1]).toBe(5000);
    });
  });

  describe('settings', () => {
    test('setVolume updates BGM volume', () => {
      useSaveDataStore.getState().setVolume('bgm', 0.5);
      expect(useSaveDataStore.getState().settings.bgmVolume).toBe(0.5);
    });

    test('setVolume clamps to 0-1', () => {
      useSaveDataStore.getState().setVolume('se', 1.5);
      expect(useSaveDataStore.getState().settings.seVolume).toBe(1);
      useSaveDataStore.getState().setVolume('se', -0.5);
      expect(useSaveDataStore.getState().settings.seVolume).toBe(0);
    });
  });
});
