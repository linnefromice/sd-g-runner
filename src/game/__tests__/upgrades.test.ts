import {
  UPGRADE_CONFIG,
  FORM_UNLOCK_CONDITIONS,
  getUpgradeCost,
  getUpgradeEffect,
  canUnlockForm,
} from '../upgrades';

describe('upgrades', () => {
  describe('getUpgradeCost', () => {
    test('returns correct cost for first level', () => {
      expect(getUpgradeCost('atk', 0)).toBe(100);
      expect(getUpgradeCost('hp', 0)).toBe(100);
      expect(getUpgradeCost('speed', 0)).toBe(100);
    });

    test('cost scales with current level', () => {
      expect(getUpgradeCost('atk', 1)).toBe(200);
      expect(getUpgradeCost('atk', 5)).toBe(600);
      expect(getUpgradeCost('atk', 9)).toBe(1000);
    });

    test('returns Infinity for unknown stat', () => {
      expect(getUpgradeCost('unknown', 0)).toBe(Infinity);
    });
  });

  describe('getUpgradeEffect', () => {
    test('returns cumulative effect for ATK', () => {
      expect(getUpgradeEffect('atk', 0)).toBe(0);
      expect(getUpgradeEffect('atk', 1)).toBe(2);
      expect(getUpgradeEffect('atk', 10)).toBe(20);
    });

    test('returns cumulative effect for HP', () => {
      expect(getUpgradeEffect('hp', 5)).toBe(50);
    });

    test('returns cumulative effect for Speed', () => {
      expect(getUpgradeEffect('speed', 3)).toBeCloseTo(0.15);
    });

    test('returns 0 for unknown stat', () => {
      expect(getUpgradeEffect('unknown', 5)).toBe(0);
    });
  });

  describe('canUnlockForm', () => {
    test('returns false for initial form', () => {
      expect(canUnlockForm('SD_Standard', [1, 2, 3], 1000)).toBe(false);
    });

    test('returns false for combo_only form', () => {
      expect(canUnlockForm('SD_Awakened', [1, 2, 3], 1000)).toBe(false);
    });

    test('returns true when stage cleared and credits sufficient', () => {
      expect(canUnlockForm('SD_HeavyArtillery', [1, 2, 3], 500)).toBe(true);
    });

    test('returns false when stage not cleared', () => {
      expect(canUnlockForm('SD_HeavyArtillery', [1, 2], 500)).toBe(false);
    });

    test('returns false when credits insufficient', () => {
      expect(canUnlockForm('SD_HeavyArtillery', [1, 2, 3], 499)).toBe(false);
    });

    test('SD_HighSpeed requires stage 7', () => {
      expect(canUnlockForm('SD_HighSpeed', [1, 2, 3, 4, 5, 6, 7], 500)).toBe(true);
      expect(canUnlockForm('SD_HighSpeed', [1, 2, 3, 4, 5, 6], 500)).toBe(false);
    });
  });

  describe('UPGRADE_CONFIG', () => {
    test('ATK has max level 10', () => {
      expect(UPGRADE_CONFIG.atk.maxLevel).toBe(10);
    });

    test('HP has max level 10', () => {
      expect(UPGRADE_CONFIG.hp.maxLevel).toBe(10);
    });

    test('Speed has max level 5', () => {
      expect(UPGRADE_CONFIG.speed.maxLevel).toBe(5);
    });
  });

  describe('FORM_UNLOCK_CONDITIONS', () => {
    test('SD_Standard is initial', () => {
      expect(FORM_UNLOCK_CONDITIONS.SD_Standard.type).toBe('initial');
    });

    test('SD_Awakened is combo_only', () => {
      expect(FORM_UNLOCK_CONDITIONS.SD_Awakened.type).toBe('combo_only');
    });

    test('SD_HeavyArtillery requires stage 3 + 500 Cr', () => {
      const cond = FORM_UNLOCK_CONDITIONS.SD_HeavyArtillery;
      expect(cond.type).toBe('unlock');
      if (cond.type === 'unlock') {
        expect(cond.requiredStage).toBe(3);
        expect(cond.cost).toBe(500);
      }
    });
  });
});
