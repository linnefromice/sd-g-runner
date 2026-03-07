import { create } from 'zustand';
import type { MechaFormId } from '@/types/forms';
import type { StatKey } from '@/types/gates';
import {
  PLAYER_INITIAL_HP,
  PLAYER_INITIAL_ATK,
  PLAYER_INITIAL_SPEED,
  PLAYER_INITIAL_FIRE_RATE,
  COMBO_THRESHOLD,
  AWAKENED_DURATION,
  EX_GAUGE_MAX,
  EX_BURST_DURATION,
  TRANSFORM_GAUGE_MAX,
} from '@/constants/balance';
import { useSaveDataStore } from '@/stores/saveDataStore';
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

  // Invincibility
  isInvincible: boolean;

  // Combo
  comboCount: number;
  isAwakened: boolean;
  awakenedTimer: number;
  awakenedWarning: boolean;

  // EX
  exGauge: number;
  isEXBurstActive: boolean;
  exBurstTimer: number;
  exBurstTickTimer: number;

  // Transform
  primaryForm: MechaFormId;
  secondaryForm: MechaFormId;
  transformGauge: number;

  // Score / Credits
  score: number;
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

  // Actions
  setHp: (hp: number) => void;
  takeDamage: (damage: number) => void;
  heal: (amount: number) => void;
  healPercent: (percent: number) => void;
  addScore: (points: number) => void;
  addCredits: (amount: number) => void;
  addExGauge: (amount: number) => void;
  activateEXBurst: () => void;
  deactivateEXBurst: () => void;
  addTransformGauge: (amount: number) => void;
  activateTransform: () => void;
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
  isInvincible: false,
  comboCount: 0,
  isAwakened: false,
  awakenedTimer: 0,
  awakenedWarning: false,
  exGauge: 0,
  isEXBurstActive: false,
  exBurstTimer: 0,
  exBurstTickTimer: 0,
  primaryForm: 'SD_Standard' as MechaFormId,
  secondaryForm: 'SD_HeavyArtillery' as MechaFormId,
  transformGauge: 0,
  score: 0,
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
};

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  ...INITIAL_STATE,

  setHp: (hp) => set({ hp: Math.max(0, Math.min(hp, get().maxHp)) }),

  takeDamage: (damage) => {
    const newHp = Math.max(0, get().hp - damage);
    set((s) => ({ hp: newHp, isInvincible: true, damageTaken: s.damageTaken + damage }));
  },

  heal: (amount) => set((s) => ({ hp: Math.max(0, Math.min(s.maxHp, s.hp + amount)) })),

  healPercent: (percent) =>
    set((s) => ({ hp: Math.min(s.maxHp, s.hp + Math.round(s.maxHp * percent / 100)) })),

  addScore: (points) => set((s) => ({ score: s.score + points })),

  addCredits: (amount) => set((s) => ({ credits: s.credits + amount })),

  addExGauge: (amount) =>
    set((s) => ({ exGauge: Math.min(EX_GAUGE_MAX, s.exGauge + amount) })),

  activateEXBurst: () => {
    const s = get();
    if (s.exGauge < EX_GAUGE_MAX || s.isEXBurstActive) return;
    set({
      exGauge: 0,
      isEXBurstActive: true,
      exBurstTimer: EX_BURST_DURATION,
      exBurstTickTimer: 0,
    });
  },

  deactivateEXBurst: () =>
    set({ isEXBurstActive: false, exBurstTimer: 0, exBurstTickTimer: 0 }),

  addTransformGauge: (amount) =>
    set((s) => ({ transformGauge: Math.min(TRANSFORM_GAUGE_MAX, s.transformGauge + amount) })),

  activateTransform: () => {
    const s = get();
    if (s.transformGauge < TRANSFORM_GAUGE_MAX) return;
    if (s.isAwakened) return;
    const nextForm = s.currentForm === s.secondaryForm
      ? s.primaryForm
      : s.secondaryForm;
    set({
      currentForm: nextForm,
      previousForm: s.currentForm,
      transformGauge: 0,
    });
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

  activateAwakened: () =>
    set((s) => ({
      isAwakened: true,
      awakenedTimer: AWAKENED_DURATION,
      previousForm: s.currentForm,
      currentForm: 'SD_Awakened',
      comboCount: 0,
      awakenedCount: s.awakenedCount + 1,
    })),

  deactivateAwakened: () =>
    set((s) => ({
      isAwakened: false,
      awakenedTimer: 0,
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
