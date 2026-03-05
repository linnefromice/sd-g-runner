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
  },
  hud: {
    awakened: 'AWAKENED',
    fading: 'FADING!',
    paused: 'PAUSED',
    resume: 'Resume',
    gateHelp: 'Gate Help',
    exitStage: 'Exit Stage',
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
      examples: 'ATK\u2191 SPD\u2193, SPD\u2191 ATK\u2193, FR\u2191 ATK\u2193',
      combo: 'Resets combo to 0',
    },
    refit: {
      name: 'Refit',
      effect: 'Switches your mecha to a different form.',
      examples: '\u2192 Heavy Artillery, \u2192 High Speed',
      combo: 'Resets combo to 0',
    },
  },
  forms: {
    standard: 'Standard',
    heavyArtillery: 'Heavy Artillery',
    highSpeed: 'High Speed',
    awakened: 'Awakened',
  },
  abilities: {
    none: '-',
    explosion_radius: 'Explosion',
    pierce: 'Pierce',
    homing_invincible: 'Homing + Invincible',
  },
  howToPlay: {
    title: 'How to Play',
    backToTitle: 'Back to Title',
    sections: {
      basicControls: {
        title: 'BASIC CONTROLS',
        items: {
          move: { label: 'Move', desc: 'Drag anywhere to move your mecha. It follows your finger directly.' },
          tapToMove: { label: 'Tap to Move', desc: 'Tap a spot on screen and your mecha will glide there automatically.' },
          shooting: { label: 'Shooting', desc: 'Your mecha fires automatically. No button needed.' },
          pause: { label: 'Pause', desc: 'Tap the pause button (top-right) to pause during gameplay.' },
        },
      },
      gates: {
        title: 'GATES',
        description: 'Gates appear as pairs of columns scrolling toward you. Pass through one side to activate its effect. Each gate type is color-coded.',
        items: {
          enhance: {
            label: 'Enhance',
            desc: 'Boosts a stat permanently for the stage. Examples: ATK +5, SPD +10%, Fire Rate +20%.',
            extra: 'Combo +1 — consecutive enhance gates build your combo gauge.',
          },
          recovery: {
            label: 'Recovery',
            desc: 'Restores HP. Can be a flat amount (HP +20, +30) or percentage-based (HP +50%).',
            extra: 'No effect on combo gauge.',
          },
          tradeoff: {
            label: 'Tradeoff',
            desc: 'Raises one stat but lowers another. Examples: ATK\u2191 SPD\u2193, SPD\u2191 ATK\u2193, Fire Rate\u2191 ATK\u2193.',
            extra: 'Resets combo gauge to 0. Choose carefully.',
          },
          refit: {
            label: 'Refit',
            desc: 'Switches your mecha to a different form (Heavy Artillery or High Speed). Stats change completely.',
            extra: 'Resets combo gauge to 0.',
          },
        },
      },
      gateLayouts: {
        title: 'GATE LAYOUTS',
        items: {
          forced: { label: 'Forced', desc: 'You must pass through one side — the gates span the full width. Choose wisely.' },
          optional: { label: 'Optional', desc: 'Gates leave a gap. You can dodge them entirely or pass through one side.' },
        },
      },
      comboAwakening: {
        title: 'COMBO & AWAKENING',
        items: {
          comboGauge: { label: 'Combo Gauge', desc: 'Pass through 3 consecutive Enhance gates to fill the combo gauge (shown as 3 segments on HUD).' },
          awakenedForm: { label: 'Awakened Form', desc: 'When the combo gauge fills, your mecha transforms into the Awakened form for 10 seconds — 2x ATK, homing shots, and invincibility.' },
          comboReset: { label: 'Combo Reset', desc: 'Taking damage, passing through a Tradeoff gate, or passing through a Refit gate resets your combo to 0.' },
        },
      },
      transform: {
        title: 'TRANSFORM',
        items: {
          transformGauge: { label: 'Transform Gauge', desc: 'Builds up over time, and by defeating enemies (+8) and passing through gates (+12). When full, you can transform.' },
          howToTransform: { label: 'How to Transform', desc: 'Tap the TF button (bottom-right) when the gauge is full. Switches between your Primary and Secondary form.' },
          formSelection: { label: 'Form Selection', desc: 'Choose two forms before starting a stage. Primary is your starting form, Secondary is your transform target.' },
          refitGates: { label: 'Refit Gates', desc: 'Refit gates still force-switch your form regardless of the transform gauge. This can put you in a form outside your selected pair.' },
        },
      },
      mechaForms: {
        title: 'MECHA FORMS',
        items: {
          standard: { label: 'Standard', desc: 'Balanced stats. No special ability. Good for beginners.' },
          heavyArtillery: { label: 'Heavy Artillery', desc: 'High ATK (1.8x), slow movement (0.8x) and fire rate (0.6x). Shots cause explosions.' },
          highSpeed: { label: 'High Speed', desc: 'Fast movement (1.4x) and fire rate (1.5x), low ATK (0.7x). Shots pierce through enemies.' },
          awakened: { label: 'Awakened', desc: 'Activated by combo only (not selectable). 2x ATK, 1.3x fire rate, triple homing shots, invincible. Lasts 10 seconds.' },
        },
      },
      combat: {
        title: 'COMBAT',
        items: {
          enemies: { label: 'Enemies', desc: 'Stationary enemies hover in place. Patrol enemies move side-to-side. Rush enemies charge toward you.' },
          damageIFrame: { label: 'Damage & i-Frame', desc: 'When hit, you take damage and become invincible for 1.5 seconds (mecha blinks during this time).' },
          bossStages: { label: 'Boss Stages', desc: 'Some stages have a boss. The background slows, enemy spawning stops, and you must defeat the boss to clear the stage.' },
          exGauge: { label: 'EX Gauge', desc: 'Builds up by defeating enemies and passing through gates. (EX Burst coming soon)' },
        },
      },
      scoringProgression: {
        title: 'SCORING & PROGRESSION',
        items: {
          score: { label: 'Score', desc: 'Earn points by defeating enemies (100-200 pts), passing gates (150 pts), and clearing stages (1000-3000 pts).' },
          credits: { label: 'Credits', desc: 'Currency earned from enemy kills and stage clears. Spend on upgrades and form unlocks.' },
          upgrades: { label: 'Upgrades', desc: 'Permanently boost base ATK, HP, and Speed from the Upgrade screen. Effects carry over to all future runs.' },
          stageClear: { label: 'Stage Clear', desc: 'Normal stages clear when time runs out. Boss stages clear when the boss is defeated.' },
        },
      },
    },
  },
} as const;

type HowToPlayItem = { label: string; desc: string; extra?: string };
type HowToPlayItemSet<K extends string> = Record<K, HowToPlayItem>;

export interface Translations {
  title: { gameName: string; start: string; settings: string; howToPlay: string };
  stageSelect: {
    title: string; stage: string; locked: string; unknown: string;
    boss: string; lock: string; upgrade: string; back: string;
  };
  selectForm: {
    title: string; stage: string; primary: string; secondary: string;
    selected: string; select: string; unlock: string;
    unlockCondition: (stage: number, cost: number) => string;
    awakenedComboOnly: string; startStage: string; backToStages: string;
  };
  upgrade: { title: string; max: string; backToStages: string };
  settings: {
    title: string; bgmVolume: string; seVolume: string; language: string;
    localeSystem: string; localeEn: string; localeJa: string; backToTitle: string;
  };
  result: {
    stageClear: string; gameOver: string; score: string; creditsEarned: string;
    clearBonus: (amount: number) => string;
    replay: string; stageSelect: string; nextStage: string;
  };
  hud: {
    awakened: string; fading: string; paused: string;
    resume: string; gateHelp: string; exitStage: string;
  };
  gateHelp: {
    title: string; tip: string; tipText: string; close: string;
    enhance: { name: string; effect: string; examples: string; combo: string };
    recovery: { name: string; effect: string; examples: string; combo: string };
    tradeoff: { name: string; effect: string; examples: string; combo: string };
    refit: { name: string; effect: string; examples: string; combo: string };
  };
  forms: { standard: string; heavyArtillery: string; highSpeed: string; awakened: string };
  abilities: { none: string; explosion_radius: string; pierce: string; homing_invincible: string };
  howToPlay: {
    title: string;
    backToTitle: string;
    sections: {
      basicControls: { title: string; items: HowToPlayItemSet<'move' | 'tapToMove' | 'shooting' | 'pause'> };
      gates: {
        title: string; description: string;
        items: HowToPlayItemSet<'enhance' | 'recovery' | 'tradeoff' | 'refit'>;
      };
      gateLayouts: { title: string; items: HowToPlayItemSet<'forced' | 'optional'> };
      comboAwakening: { title: string; items: HowToPlayItemSet<'comboGauge' | 'awakenedForm' | 'comboReset'> };
      transform: { title: string; items: HowToPlayItemSet<'transformGauge' | 'howToTransform' | 'formSelection' | 'refitGates'> };
      mechaForms: { title: string; items: HowToPlayItemSet<'standard' | 'heavyArtillery' | 'highSpeed' | 'awakened'> };
      combat: { title: string; items: HowToPlayItemSet<'enemies' | 'damageIFrame' | 'bossStages' | 'exGauge'> };
      scoringProgression: { title: string; items: HowToPlayItemSet<'score' | 'credits' | 'upgrades' | 'stageClear'> };
    };
  };
}

// Verify en satisfies Translations at compile time
en satisfies Translations;
