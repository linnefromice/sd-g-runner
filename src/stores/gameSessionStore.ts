import { create } from 'zustand';
import type { MechaFormId } from '@/types/forms';
import type { StatKey } from '@/types/gates';
import type { FormXPState } from '@/types/formSkills';
import {
  PLAYER_INITIAL_HP,
  PLAYER_INITIAL_ATK,
  PLAYER_INITIAL_SPEED,
  PLAYER_INITIAL_FIRE_RATE,
  COMBO_THRESHOLD,
  EX_GAUGE_MAX,
  TRANSFORM_GAUGE_MAX,
  FORM_XP_THRESHOLDS,
} from '@/constants/balance';
import { useSaveDataStore } from '@/stores/saveDataStore';
import { AudioManager } from '@/audio/AudioManager';
import { HapticsManager } from '@/audio/HapticsManager';
import { getUpgradeEffect } from '@/game/upgrades';

interface GameSessionState {
  // Player stats
  currentForm: MechaFormId;
  previousForm: MechaFormId;
  hp: number;
  maxHp: number;
  atk: number;
  speed: number;
  fireRate: number;

  // Combo
  comboCount: number;
  isAwakened: boolean;
  awakenedWarning: boolean;

  // EX
  exGauge: number;
  isEXBurstActive: boolean;

  // Transform
  primaryForm: MechaFormId;
  secondaryForm: MechaFormId;
  transformGauge: number;

  // Score / Credits
  score: number;
  scoreMultiplier: number;
  credits: number;

  // Bonus tracking
  damageTaken: number;
  awakenedCount: number;
  enemiesSpawned: number;
  enemiesKilled: number;
  finalStageTime: number;

  // Stage
  currentStageId: number;
  isPaused: boolean;
  isGameOver: boolean;
  isStageClear: boolean;

  // Boss entrance & slow motion
  bossEntrance: boolean;
  slowMotionFactor: number;

  // Form XP
  formXP: Partial<Record<MechaFormId, FormXPState>>;
  pendingSkillChoice: { formId: MechaFormId; level: number } | null;

  // Actions
  setHp: (hp: number) => void;
  takeDamage: (damage: number) => void;
  heal: (amount: number) => void;
  healPercent: (percent: number) => void;
  addScore: (points: number) => void;
  setScoreMultiplier: (v: number) => void;
  addCredits: (amount: number) => void;
  addExGauge: (amount: number) => void;
  activateEXBurst: () => void;
  deactivateEXBurst: () => void;
  addTransformGauge: (amount: number) => void;
  activateTransform: () => boolean;
  setForm: (formId: MechaFormId) => void;
  addStat: (stat: StatKey, value: number) => void;
  multiplyStat: (stat: StatKey, value: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  activateAwakened: () => void;
  deactivateAwakened: () => void;
  setAwakenedWarning: (value: boolean) => void;
  incrementEnemiesSpawned: (count?: number) => void;
  incrementEnemiesKilled: () => void;
  setFinalStageTime: (time: number) => void;
  setGameOver: (value: boolean) => void;
  setStageClear: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  setBossEntrance: (value: boolean) => void;
  setSlowMotionFactor: (factor: number) => void;
  addFormXP: (formId: MechaFormId, amount: number) => void;
  selectFormSkill: (formId: MechaFormId, level: number, choice: 'A' | 'B') => void;
  resetSession: (stageId: number, formId?: MechaFormId, secondaryFormId?: MechaFormId) => void;
}

const INITIAL_STATE = {
  currentForm: 'SD_Standard' as MechaFormId,
  previousForm: 'SD_Standard' as MechaFormId,
  hp: PLAYER_INITIAL_HP,
  maxHp: PLAYER_INITIAL_HP,
  atk: PLAYER_INITIAL_ATK,
  speed: PLAYER_INITIAL_SPEED,
  fireRate: PLAYER_INITIAL_FIRE_RATE,
  comboCount: 0,
  isAwakened: false,
  awakenedWarning: false,
  exGauge: 0,
  isEXBurstActive: false,
  primaryForm: 'SD_Standard' as MechaFormId,
  secondaryForm: 'SD_HeavyArtillery' as MechaFormId,
  transformGauge: 0,
  score: 0,
  scoreMultiplier: 1,
  credits: 0,
  damageTaken: 0,
  awakenedCount: 0,
  enemiesSpawned: 0,
  enemiesKilled: 0,
  finalStageTime: 0,
  currentStageId: 1,
  isPaused: false,
  isGameOver: false,
  isStageClear: false,
  bossEntrance: false,
  slowMotionFactor: 1.0,
  formXP: {
    SD_Standard: { xp: 0, level: 0, skills: [] },
    SD_HeavyArtillery: { xp: 0, level: 0, skills: [] },
    SD_HighSpeed: { xp: 0, level: 0, skills: [] },
    SD_Sniper: { xp: 0, level: 0, skills: [] },
    SD_Scatter: { xp: 0, level: 0, skills: [] },
  },
  pendingSkillChoice: null,
};

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  ...INITIAL_STATE,

  setHp: (hp) => set({ hp: Math.max(0, Math.min(hp, get().maxHp)) }),

  takeDamage: (damage) => {
    const newHp = Math.max(0, get().hp - damage);
    set((s) => ({ hp: newHp, damageTaken: s.damageTaken + damage }));
  },

  heal: (amount) => set((s) => ({ hp: Math.max(0, Math.min(s.maxHp, s.hp + amount)) })),

  healPercent: (percent) =>
    set((s) => ({ hp: Math.min(s.maxHp, s.hp + Math.round(s.maxHp * percent / 100)) })),

  addScore: (points) => set((s) => ({ score: s.score + Math.round(points * s.scoreMultiplier) })),

  setScoreMultiplier: (v) => set({ scoreMultiplier: v }),

  addCredits: (amount) => set((s) => ({ credits: s.credits + amount })),

  addExGauge: (amount) =>
    set((s) => ({ exGauge: Math.min(EX_GAUGE_MAX, s.exGauge + amount) })),

  activateEXBurst: () => {
    const s = get();
    if (s.exGauge < EX_GAUGE_MAX || s.isEXBurstActive) return;
    set({ exGauge: 0, isEXBurstActive: true });
  },

  deactivateEXBurst: () => set({ isEXBurstActive: false }),

  addTransformGauge: (amount) =>
    set((s) => ({ transformGauge: Math.min(TRANSFORM_GAUGE_MAX, s.transformGauge + amount) })),

  activateTransform: () => {
    const s = get();
    if (s.transformGauge < TRANSFORM_GAUGE_MAX) return false;
    if (s.isAwakened) return false;
    const nextForm = s.currentForm === s.secondaryForm
      ? s.primaryForm
      : s.secondaryForm;
    set({
      currentForm: nextForm,
      previousForm: s.currentForm,
      transformGauge: 0,
    });
    return true;
  },

  setForm: (formId) =>
    set((s) => ({
      currentForm: formId,
      previousForm: s.currentForm,
    })),

  addStat: (stat, value) => {
    switch (stat) {
      case 'atk': set((s) => ({ atk: s.atk + value })); break;
      case 'speed': set((s) => ({ speed: s.speed + value })); break;
      case 'fireRate': set((s) => ({ fireRate: s.fireRate + value })); break;
      case 'hp': set((s) => ({ hp: Math.min(s.maxHp, s.hp + value) })); break;
      case 'maxHp': set((s) => ({ maxHp: s.maxHp + value, hp: s.hp + value })); break;
    }
  },

  multiplyStat: (stat, value) => {
    switch (stat) {
      case 'atk': set((s) => ({ atk: s.atk * value })); break;
      case 'speed': set((s) => ({ speed: s.speed * value })); break;
      case 'fireRate': set((s) => ({ fireRate: s.fireRate * value })); break;
    }
  },

  incrementCombo: () => {
    const newCount = get().comboCount + 1;
    if (newCount >= COMBO_THRESHOLD && !get().isAwakened) {
      get().activateAwakened();
    } else {
      set({ comboCount: newCount });
    }
  },

  resetCombo: () => set({ comboCount: 0 }),

  activateAwakened: () => {
    AudioManager.playSe('awaken');
    HapticsManager.awaken();
    set((s) => ({
      isAwakened: true,
      previousForm: s.currentForm,
      currentForm: 'SD_Awakened',
      comboCount: 0,
      awakenedCount: s.awakenedCount + 1,
    }));
  },

  deactivateAwakened: () =>
    set((s) => ({
      isAwakened: false,
      awakenedWarning: false,
      currentForm: s.previousForm,
    })),

  setAwakenedWarning: (value) => set({ awakenedWarning: value }),

  incrementEnemiesSpawned: (count = 1) => set((s) => ({ enemiesSpawned: s.enemiesSpawned + count })),
  incrementEnemiesKilled: () => set((s) => ({ enemiesKilled: s.enemiesKilled + 1 })),
  setFinalStageTime: (time) => set({ finalStageTime: time }),

  setGameOver: (value) => set({ isGameOver: value }),
  setStageClear: (value) => set({ isStageClear: value }),
  setPaused: (value) => set({ isPaused: value }),
  setBossEntrance: (value) => set({ bossEntrance: value }),
  setSlowMotionFactor: (factor) => set({ slowMotionFactor: factor }),

  addFormXP: (formId, amount) => set(s => {
    const state = s.formXP[formId];
    if (!state || state.level >= 3) return {};
    const newXP = state.xp + amount;
    const threshold = FORM_XP_THRESHOLDS[state.level];
    if (newXP >= threshold && !s.pendingSkillChoice) {
      return {
        formXP: { ...s.formXP, [formId]: { ...state, xp: newXP } },
        pendingSkillChoice: { formId, level: state.level + 1 },
      };
    }
    return {
      formXP: { ...s.formXP, [formId]: { ...state, xp: newXP } },
    };
  }),

  selectFormSkill: (formId, level, choice) => set(s => {
    const state = s.formXP[formId];
    if (!state) return {};
    return {
      formXP: {
        ...s.formXP,
        [formId]: { ...state, level, skills: [...state.skills, { level, choice }] },
      },
      pendingSkillChoice: null,
    };
  }),

  resetSession: (stageId, formId, secondaryFormId) => {
    const { upgrades } = useSaveDataStore.getState();
    const initialForm = formId ?? 'SD_Standard';
    const secondary = secondaryFormId ?? 'SD_HeavyArtillery';
    const bonusHp = getUpgradeEffect('hp', upgrades.baseHp);
    const bonusAtk = getUpgradeEffect('atk', upgrades.baseAtk);
    const bonusSpeed = getUpgradeEffect('speed', upgrades.baseSpeed);
    set({
      ...INITIAL_STATE,
      currentStageId: stageId,
      currentForm: initialForm,
      previousForm: initialForm,
      primaryForm: initialForm,
      secondaryForm: secondary,
      hp: PLAYER_INITIAL_HP + bonusHp,
      maxHp: PLAYER_INITIAL_HP + bonusHp,
      atk: PLAYER_INITIAL_ATK + bonusAtk,
      speed: PLAYER_INITIAL_SPEED + bonusSpeed,
    });
  },
}));
