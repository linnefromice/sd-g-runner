import { create } from "zustand";

type GameSessionState = {
  hp: number;
  maxHp: number;
  score: number;

  setHp: (hp: number) => void;
  addScore: (points: number) => void;
  resetSession: () => void;
};

const INITIAL_STATE = {
  hp: 100,
  maxHp: 100,
  score: 0,
};

export const useGameSessionStore = create<GameSessionState>((set) => ({
  ...INITIAL_STATE,

  setHp: (hp) => set({ hp: Math.max(0, hp) }),
  addScore: (points) => set((s) => ({ score: s.score + points })),
  resetSession: () => set(INITIAL_STATE),
}));
