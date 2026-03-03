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

  // Score / Credits
  score: number;
  credits: number;

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
  setForm: (formId: MechaFormId) => void;
  addStat: (stat: StatKey, value: number) => void;
  multiplyStat: (stat: StatKey, value: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  activateAwakened: () => void;
  deactivateAwakened: () => void;
  setAwakenedWarning: (value: boolean) => void;
  setGameOver: (value: boolean) => void;
  setStageClear: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  resetSession: (stageId: number, formId?: MechaFormId) => void;
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
  score: 0,
  credits: 0,
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
    set({ hp: newHp, isInvincible: true });
  },

  heal: (amount) => set((s) => ({ hp: Math.min(s.maxHp, s.hp + amount) })),

  healPercent: (percent) =>
    set((s) => ({ hp: Math.min(s.maxHp, s.hp + Math.round(s.maxHp * percent / 100)) })),

  addScore: (points) => set((s) => ({ score: s.score + points })),

  addCredits: (amount) => set((s) => ({ credits: s.credits + amount })),

  addExGauge: (amount) =>
    set((s) => ({ exGauge: Math.min(EX_GAUGE_MAX, s.exGauge + amount) })),

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
    })),

  deactivateAwakened: () =>
    set((s) => ({
      isAwakened: false,
      awakenedTimer: 0,
      awakenedWarning: false,
      currentForm: s.previousForm,
    })),

  setAwakenedWarning: (value) => set({ awakenedWarning: value }),

  setGameOver: (value) => set({ isGameOver: value }),
  setStageClear: (value) => set({ isStageClear: value }),
  setPaused: (value) => set({ isPaused: value }),

  resetSession: (stageId, formId) => {
    const { upgrades } = useSaveDataStore.getState();
    const initialForm = formId ?? 'SD_Standard';
    const bonusHp = getUpgradeEffect('hp', upgrades.baseHp);
    const bonusAtk = getUpgradeEffect('atk', upgrades.baseAtk);
    const bonusSpeed = getUpgradeEffect('speed', upgrades.baseSpeed);
    set({
      ...INITIAL_STATE,
      currentStageId: stageId,
      currentForm: initialForm,
      previousForm: initialForm,
      hp: PLAYER_INITIAL_HP + bonusHp,
      maxHp: PLAYER_INITIAL_HP + bonusHp,
      atk: PLAYER_INITIAL_ATK + bonusAtk,
      speed: PLAYER_INITIAL_SPEED + bonusSpeed,
    });
  },
}));
