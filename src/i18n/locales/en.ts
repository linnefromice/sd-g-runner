import { howToPlayEn } from '../content/how-to-play.en';
import type { HowToPlayContent } from '../content/how-to-play.types';

export const en = {
  title: {
    gameName: 'Project G-Runner',
    start: 'Start',
    settings: 'Settings',
    howToPlay: 'How to Play',
  },
  stageSelect: {
    title: 'Stage Select',
    stage: 'Stage',
    locked: 'LOCKED',
    unknown: '???',
    boss: 'BOSS',
    lock: 'LOCK',
    upgrade: 'Upgrade',
    back: 'Back',
  },
  selectForm: {
    title: 'Select Form',
    stage: 'Stage',
    primary: 'PRIMARY',
    secondary: 'SECONDARY',
    selected: 'Selected',
    select: 'Select',
    unlock: 'Unlock',
    unlockCondition: (stage: number, cost: number) => `Stage ${stage} Clear + ${cost} Cr`,
    awakenedComboOnly: 'Activated via Combo (3 consecutive enhance gates)',
    startStage: 'Start Stage',
    backToStages: 'Back to Stages',
  },
  upgrade: {
    title: 'Upgrade',
    max: 'MAX',
    backToStages: 'Back to Stages',
  },
  settings: {
    title: 'Settings',
    bgmVolume: 'BGM Volume',
    seVolume: 'SE Volume',
    language: 'Language',
    localeSystem: 'System',
    localeEn: 'English',
    localeJa: 'Japanese',
    backToTitle: 'Back to Title',
  },
  result: {
    stageClear: 'STAGE CLEAR!',
    gameOver: 'GAME OVER',
    score: 'Score',
    creditsEarned: 'Credits Earned',
    clearBonus: (amount: number) => `(+${amount} clear bonus)`,
    replay: 'Replay',
    stageSelect: 'Stage Select',
    nextStage: 'Next Stage',
    bonusTitle: 'BONUS',
    bonusNoDamage: 'No Damage',
    bonusCombo: 'Combo',
    bonusFullClear: 'Full Clear',
    bonusSpeedClear: 'Speed Clear',
    bonusScoreMultiplier: 'Score x1.5',
    bonusCreditMultiplier: 'Credits x2',
  },
  hud: {
    awakened: 'AWAKENED',
    fading: 'FADING!',
    paused: 'PAUSED',
    resume: 'Resume',
    gateHelp: 'Gate Help',
    exitStage: 'Exit Stage',
    boss: 'BOSS',
  },
  gateHelp: {
    title: 'GATE TYPES',
    tip: 'TIP',
    tipText: '3 consecutive Enhance gates triggers Awakened form (10s) — 2x ATK, homing shots, invincible!',
    close: 'Close',
    enhance: {
      name: 'Enhance',
      effect: 'Boosts a stat permanently for the stage.',
      examples: 'ATK +5, SPD +10%, Fire Rate +20%',
      combo: 'Combo +1 — build toward Awakening',
    },
    recovery: {
      name: 'Recovery',
      effect: 'Restores HP by a flat amount or percentage.',
      examples: 'HP +20, HP +30, HP +50%',
      combo: 'No effect on combo',
    },
    tradeoff: {
      name: 'Tradeoff',
      effect: 'Raises one stat but lowers another.',
      examples: 'ATK↑ SPD↓, SPD↑ ATK↓, FR↑ ATK↓',
      combo: 'Resets combo to 0',
    },
    refit: {
      name: 'Refit',
      effect: 'Switches your mecha to a different form.',
      examples: '→ Heavy Artillery, → High Speed',
      combo: 'Resets combo to 0',
    },
  },
  forms: {
    SD_Standard: 'Standard',
    SD_HeavyArtillery: 'Heavy Artillery',
    SD_HighSpeed: 'High Speed',
    SD_Sniper: 'Sniper',
    SD_Scatter: 'Scatter',
    SD_Guardian: 'Guardian',
    SD_Awakened: 'Awakened',
  },
  abilities: {
    none: '-',
    explosion_radius: 'Explosion',
    pierce: 'Pierce',
    homing_invincible: 'Homing + Invincible',
    damage_reduce: 'Damage Reduce',
  },
  howToPlay: howToPlayEn,
} as const;

// Auto-derive Translations from en: string literals → string, functions preserved
type Widen<T> =
  T extends (...args: infer A) => unknown ? (...args: A) => string
  : T extends string ? string
  : T extends object ? { [K in keyof T]: Widen<T[K]> }
  : T;

type EnType = Omit<typeof en, 'howToPlay'>;

export type Translations = Widen<EnType> & { howToPlay: HowToPlayContent };
