import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MechaFormId } from '@/types/forms';
import type { LocaleSetting } from '@/i18n';
import type { AchievementId } from '@/types/achievements';
import { getAchievement } from '@/game/achievements';

interface SaveData {
  highScores: Record<number, number>;
  unlockedForms: MechaFormId[];
  unlockedStages: number[];
  credits: number;
  achievements: AchievementId[];
  endlessBestTime: number;
  endlessBestScore: number;
  upgrades: {
    baseAtk: number;
    baseHp: number;
    baseSpeed: number;
    baseDef: number;
    baseCreditBoost: number;
  };
  settings: {
    bgmVolume: number;
    seVolume: number;
    locale: LocaleSetting;
    hapticsEnabled: boolean;
  };
}

interface SaveDataState extends SaveData {
  isLoaded: boolean;
  load: () => Promise<void>;
  save: () => Promise<void>;
  updateHighScore: (stageId: number, score: number) => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  unlockForm: (formId: MechaFormId) => void;
  unlockStage: (stageId: number) => void;
  upgradeAtk: () => boolean;
  upgradeHp: () => boolean;
  upgradeSpeed: () => boolean;
  upgradeDef: () => boolean;
  upgradeCreditBoost: () => boolean;
  setVolume: (type: 'bgm' | 'se', value: number) => void;
  setLocale: (locale: LocaleSetting) => void;
  unlockAchievement: (id: AchievementId) => boolean;
  updateEndlessRecord: (time: number, score: number) => void;
  setHapticsEnabled: (enabled: boolean) => void;
}

const STORAGE_KEY = 'g_runner_save';

const INITIAL_SAVE: SaveData = {
  highScores: {},
  unlockedForms: ['SD_Standard'],
  unlockedStages: [1],
  credits: 0,
  achievements: [],
  endlessBestTime: 0,
  endlessBestScore: 0,
  upgrades: { baseAtk: 0, baseHp: 0, baseSpeed: 0, baseDef: 0, baseCreditBoost: 0 },
  settings: { bgmVolume: 0.7, seVolume: 1.0, locale: 'system' as LocaleSetting, hapticsEnabled: true },
};

export const useSaveDataStore = create<SaveDataState>((set, get) => ({
  ...INITIAL_SAVE,
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as SaveData;
        set({
          ...data,
          upgrades: { ...INITIAL_SAVE.upgrades, ...data.upgrades },
          settings: { ...INITIAL_SAVE.settings, ...data.settings },
          achievements: data.achievements ?? [],
          endlessBestTime: data.endlessBestTime ?? 0,
          endlessBestScore: data.endlessBestScore ?? 0,
          isLoaded: true,
        });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  save: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        highScores: get().highScores,
        unlockedForms: get().unlockedForms,
        unlockedStages: get().unlockedStages,
        credits: get().credits,
        achievements: get().achievements,
        endlessBestTime: get().endlessBestTime,
        endlessBestScore: get().endlessBestScore,
        upgrades: get().upgrades,
        settings: get().settings,
      }));
    } catch {
      // Silent fail for storage errors
    }
  },

  updateHighScore: (stageId, score) => {
    set((s) => {
      const current = s.highScores[stageId] ?? 0;
      if (score <= current) return s;
      return { highScores: { ...s.highScores, [stageId]: score } };
    });
    get().save();
  },

  addCredits: (amount) => {
    set((s) => ({ credits: s.credits + amount }));
    get().save();
  },

  spendCredits: (amount) => {
    if (get().credits < amount) return false;
    set((s) => ({ credits: s.credits - amount }));
    get().save();
    return true;
  },

  unlockForm: (formId) => {
    set((s) => {
      if (s.unlockedForms.includes(formId)) return s;
      return { unlockedForms: [...s.unlockedForms, formId] };
    });
    get().save();
  },

  unlockStage: (stageId) => {
    set((s) => {
      if (s.unlockedStages.includes(stageId)) return s;
      return { unlockedStages: [...s.unlockedStages, stageId] };
    });
    get().save();
  },

  upgradeAtk: () => {
    const { upgrades } = get();
    if (upgrades.baseAtk >= 10) return false;
    const cost = 100 * (upgrades.baseAtk + 1);
    if (!get().spendCredits(cost)) return false;
    set((s) => ({ upgrades: { ...s.upgrades, baseAtk: s.upgrades.baseAtk + 1 } }));
    get().save();
    return true;
  },

  upgradeHp: () => {
    const { upgrades } = get();
    if (upgrades.baseHp >= 10) return false;
    const cost = 100 * (upgrades.baseHp + 1);
    if (!get().spendCredits(cost)) return false;
    set((s) => ({ upgrades: { ...s.upgrades, baseHp: s.upgrades.baseHp + 1 } }));
    get().save();
    return true;
  },

  upgradeSpeed: () => {
    const { upgrades } = get();
    if (upgrades.baseSpeed >= 5) return false;
    const cost = 100 * (upgrades.baseSpeed + 1);
    if (!get().spendCredits(cost)) return false;
    set((s) => ({ upgrades: { ...s.upgrades, baseSpeed: s.upgrades.baseSpeed + 1 } }));
    get().save();
    return true;
  },

  upgradeDef: () => {
    const { upgrades } = get();
    if (upgrades.baseDef >= 5) return false;
    const cost = 150 * (upgrades.baseDef + 1);
    if (!get().spendCredits(cost)) return false;
    set((s) => ({ upgrades: { ...s.upgrades, baseDef: s.upgrades.baseDef + 1 } }));
    get().save();
    return true;
  },

  upgradeCreditBoost: () => {
    const { upgrades } = get();
    if (upgrades.baseCreditBoost >= 5) return false;
    const cost = 200 * (upgrades.baseCreditBoost + 1);
    if (!get().spendCredits(cost)) return false;
    set((s) => ({ upgrades: { ...s.upgrades, baseCreditBoost: s.upgrades.baseCreditBoost + 1 } }));
    get().save();
    return true;
  },

  setVolume: (type, value) => {
    set((s) => ({
      settings: {
        ...s.settings,
        [type === 'bgm' ? 'bgmVolume' : 'seVolume']: Math.max(0, Math.min(1, value)),
      },
    }));
    get().save();
  },

  setLocale: (locale) => {
    set((s) => ({ settings: { ...s.settings, locale } }));
    get().save();
  },

  unlockAchievement: (id) => {
    const { achievements } = get();
    if (achievements.includes(id)) return false;
    const def = getAchievement(id);
    set((s) => ({
      achievements: [...s.achievements, id],
      credits: s.credits + def.reward,
    }));
    get().save();
    return true;
  },

  updateEndlessRecord: (time, score) => {
    set((s) => ({
      endlessBestTime: Math.max(s.endlessBestTime, time),
      endlessBestScore: Math.max(s.endlessBestScore, score),
    }));
    get().save();
  },

  setHapticsEnabled: (enabled) => {
    set((s) => ({ settings: { ...s.settings, hapticsEnabled: enabled } }));
    get().save();
  },
}));
