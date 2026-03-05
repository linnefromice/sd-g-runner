import type { Translations } from './en';

export const ja: Translations = {
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
    awakenedComboOnly: 'Combo\u3067\u767A\u52D5\uFF08Enhance\u30B2\u30FC\u30C83\u9023\u7D9A\u901A\u904E\uFF09',
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
    localeSystem: '\u30C7\u30D0\u30A4\u30B9\u6E96\u62E0',
    localeEn: 'English',
    localeJa: '\u65E5\u672C\u8A9E',
    backToTitle: 'Back to Title',
  },
  result: {
    stageClear: 'STAGE CLEAR!',
    gameOver: 'GAME OVER',
    score: 'Score',
    creditsEarned: '\u7372\u5F97\u30AF\u30EC\u30B8\u30C3\u30C8',
    clearBonus: (amount: number) => `(+${amount} \u30AF\u30EA\u30A2\u30DC\u30FC\u30CA\u30B9)`,
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
    tipText: 'Enhance\u30B2\u30FC\u30C83\u9023\u7D9A\u3067Awakened\u5F62\u614B\u767A\u52D5\uFF0810\u79D2\uFF09\u2014 ATK 2\u500D\u3001\u30DB\u30FC\u30DF\u30F3\u30B0\u5F3E\u3001\u7121\u6575\uFF01',
    close: 'Close',
    enhance: {
      name: 'Enhance',
      effect: '\u30B9\u30C6\u30FC\u30B8\u4E2D\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u6C38\u7D9A\u5F37\u5316\u3002',
      examples: 'ATK +5, SPD +10%, Fire Rate +20%',
      combo: 'Combo +1 \u2014 Awakening\u306B\u5411\u3051\u3066\u84C4\u7A4D',
    },
    recovery: {
      name: 'Recovery',
      effect: 'HP\u3092\u56DE\u5FA9\u3002\u56FA\u5B9A\u5024\u307E\u305F\u306F\u5272\u5408\u3002',
      examples: 'HP +20, HP +30, HP +50%',
      combo: 'Combo\u306B\u5F71\u97FF\u306A\u3057',
    },
    tradeoff: {
      name: 'Tradeoff',
      effect: '\u4E00\u3064\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u304C\u4E0A\u304C\u308A\u3001\u5225\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u304C\u4E0B\u304C\u308B\u3002',
      examples: 'ATK\u2191 SPD\u2193, SPD\u2191 ATK\u2193, FR\u2191 ATK\u2193',
      combo: 'Combo\u30EA\u30BB\u30C3\u30C8',
    },
    refit: {
      name: 'Refit',
      effect: '\u30E1\u30AB\u3092\u5225\u306E\u5F62\u614B\u306B\u5207\u308A\u66FF\u3048\u3002',
      examples: '\u2192 Heavy Artillery, \u2192 High Speed',
      combo: 'Combo\u30EA\u30BB\u30C3\u30C8',
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
    explosion_radius: '\u7206\u767A',
    pierce: '\u8CAB\u901A',
    homing_invincible: '\u30DB\u30FC\u30DF\u30F3\u30B0 + \u7121\u6575',
  },
  howToPlay: {
    title: 'How to Play',
    backToTitle: 'Back to Title',
    sections: {
      basicControls: {
        title: 'BASIC CONTROLS',
        items: {
          move: { label: '\u79FB\u52D5', desc: '\u753B\u9762\u3092\u30C9\u30E9\u30C3\u30B0\u3057\u3066\u30E1\u30AB\u3092\u79FB\u52D5\u3002\u6307\u306B\u8FFD\u5F93\u3057\u307E\u3059\u3002' },
          tapToMove: { label: '\u30BF\u30C3\u30D7\u79FB\u52D5', desc: '\u753B\u9762\u3092\u30BF\u30C3\u30D7\u3059\u308B\u3068\u3001\u30E1\u30AB\u304C\u81EA\u52D5\u3067\u305D\u306E\u5730\u70B9\u3078\u6ED1\u3089\u304B\u306B\u79FB\u52D5\u3057\u307E\u3059\u3002' },
          shooting: { label: '\u5C04\u6483', desc: '\u30E1\u30AB\u306F\u81EA\u52D5\u3067\u5C04\u6483\u3057\u307E\u3059\u3002\u30DC\u30BF\u30F3\u64CD\u4F5C\u306F\u4E0D\u8981\u3067\u3059\u3002' },
          pause: { label: '\u30DD\u30FC\u30BA', desc: '\u30DD\u30FC\u30BA\u30DC\u30BF\u30F3\uFF08\u53F3\u4E0A\uFF09\u3092\u30BF\u30C3\u30D7\u3057\u3066\u30B2\u30FC\u30E0\u3092\u4E00\u6642\u505C\u6B62\u3002' },
        },
      },
      gates: {
        title: 'GATES',
        description: '\u30B2\u30FC\u30C8\u306F\u5BFE\u306B\u306A\u3063\u305F\u67F1\u3068\u3057\u3066\u30B9\u30AF\u30ED\u30FC\u30EB\u3057\u3066\u304D\u307E\u3059\u3002\u7247\u5074\u3092\u901A\u904E\u3059\u308B\u3068\u52B9\u679C\u304C\u767A\u52D5\u3002\u30BF\u30A4\u30D7\u3054\u3068\u306B\u8272\u5206\u3051\u3055\u308C\u3066\u3044\u307E\u3059\u3002',
        items: {
          enhance: {
            label: 'Enhance',
            desc: '\u30B9\u30C6\u30FC\u30B8\u4E2D\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u6C38\u7D9A\u5F37\u5316\u3002\u4F8B: ATK +5, SPD +10%, Fire Rate +20%\u3002',
            extra: 'Combo +1 \u2014 \u9023\u7D9AEnhance\u30B2\u30FC\u30C8\u3067Combo\u30B2\u30FC\u30B8\u304C\u84C4\u7A4D\u3002',
          },
          recovery: {
            label: 'Recovery',
            desc: 'HP\u3092\u56DE\u5FA9\u3002\u56FA\u5B9A\u5024\uFF08HP +20, +30\uFF09\u307E\u305F\u306F\u5272\u5408\uFF08HP +50%\uFF09\u3002',
            extra: 'Combo\u30B2\u30FC\u30B8\u306B\u5F71\u97FF\u306A\u3057\u3002',
          },
          tradeoff: {
            label: 'Tradeoff',
            desc: '\u4E00\u3064\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u304C\u4E0A\u304C\u308A\u3001\u5225\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u304C\u4E0B\u304C\u308B\u3002\u4F8B: ATK\u2191 SPD\u2193, SPD\u2191 ATK\u2193, Fire Rate\u2191 ATK\u2193\u3002',
            extra: 'Combo\u30B2\u30FC\u30B8\u304C0\u306B\u30EA\u30BB\u30C3\u30C8\u3002\u614E\u91CD\u306B\u9078\u3073\u307E\u3057\u3087\u3046\u3002',
          },
          refit: {
            label: 'Refit',
            desc: '\u30E1\u30AB\u3092\u5225\u306E\u5F62\u614B\u306B\u5207\u308A\u66FF\u3048\uFF08Heavy Artillery\u307E\u305F\u306FHigh Speed\uFF09\u3002\u30B9\u30C6\u30FC\u30BF\u30B9\u304C\u5168\u5909\u3002',
            extra: 'Combo\u30B2\u30FC\u30B8\u304C0\u306B\u30EA\u30BB\u30C3\u30C8\u3002',
          },
        },
      },
      gateLayouts: {
        title: 'GATE LAYOUTS',
        items: {
          forced: { label: '\u5F37\u5236', desc: '\u30B2\u30FC\u30C8\u304C\u5168\u5E45\u3092\u8986\u3046\u305F\u3081\u3001\u5FC5\u305A\u7247\u5074\u3092\u901A\u904E\u3057\u306A\u3051\u308C\u3070\u306A\u308A\u307E\u305B\u3093\u3002\u614E\u91CD\u306B\u9078\u3073\u307E\u3057\u3087\u3046\u3002' },
          optional: { label: '\u4EFB\u610F', desc: '\u30B2\u30FC\u30C8\u306B\u9699\u9593\u304C\u3042\u308A\u3001\u5B8C\u5168\u306B\u56DE\u907F\u3059\u308B\u304B\u7247\u5074\u3092\u901A\u904E\u3067\u304D\u307E\u3059\u3002' },
        },
      },
      comboAwakening: {
        title: 'COMBO & AWAKENING',
        items: {
          comboGauge: { label: 'Combo\u30B2\u30FC\u30B8', desc: 'Enhance\u30B2\u30FC\u30C83\u9023\u7D9A\u901A\u904E\u3067Combo\u30B2\u30FC\u30B8\u304C\u6E80\u30BF\u30F3\uFF08HUD\u4E0A\u306E3\u30BB\u30B0\u30E1\u30F3\u30C8\uFF09\u3002' },
          awakenedForm: { label: 'Awakened\u5F62\u614B', desc: 'Combo\u30B2\u30FC\u30B8\u304C\u6E80\u30BF\u30F3\u306B\u306A\u308B\u3068\u3001\u30E1\u30AB\u304CAwakened\u5F62\u614B\u306B\u5909\u5F62\uFF0810\u79D2\u9593\uFF09\u2014 ATK 2\u500D\u3001\u30DB\u30FC\u30DF\u30F3\u30B0\u5F3E\u3001\u7121\u6575\u3002' },
          comboReset: { label: 'Combo\u30EA\u30BB\u30C3\u30C8', desc: '\u30C0\u30E1\u30FC\u30B8\u3001Tradeoff\u30B2\u30FC\u30C8\u901A\u904E\u3001Refit\u30B2\u30FC\u30C8\u901A\u904E\u3067Combo\u304C0\u306B\u30EA\u30BB\u30C3\u30C8\u3055\u308C\u307E\u3059\u3002' },
        },
      },
      transform: {
        title: 'TRANSFORM',
        items: {
          transformGauge: { label: 'Transform\u30B2\u30FC\u30B8', desc: '\u6642\u9593\u7D4C\u904E\u3001\u6575\u6483\u7834\uFF08+8\uFF09\u3001\u30B2\u30FC\u30C8\u901A\u904E\uFF08+12\uFF09\u3067\u84C4\u7A4D\u3002\u6E80\u30BF\u30F3\u3067\u5909\u5F62\u53EF\u80FD\u3002' },
          howToTransform: { label: '\u5909\u5F62\u65B9\u6CD5', desc: '\u30B2\u30FC\u30B8\u6E80\u30BF\u30F3\u6642\u306BTF\u30DC\u30BF\u30F3\uFF08\u53F3\u4E0B\uFF09\u3092\u30BF\u30C3\u30D7\u3002Primary\u3068Secondary\u5F62\u614B\u3092\u5207\u308A\u66FF\u3048\u3002' },
          formSelection: { label: '\u5F62\u614B\u9078\u629E', desc: '\u30B9\u30C6\u30FC\u30B8\u958B\u59CB\u524D\u306B2\u3064\u306E\u5F62\u614B\u3092\u9078\u629E\u3002Primary\u304C\u521D\u671F\u5F62\u614B\u3001Secondary\u304C\u5909\u5F62\u5148\u3002' },
          refitGates: { label: 'Refit\u30B2\u30FC\u30C8', desc: 'Refit\u30B2\u30FC\u30C8\u306FTransform\u30B2\u30FC\u30B8\u306B\u95A2\u4FC2\u306A\u304F\u5F62\u614B\u3092\u5F37\u5236\u5909\u66F4\u3002\u9078\u629E\u30DA\u30A2\u5916\u306E\u5F62\u614B\u306B\u306A\u308B\u3053\u3068\u3082\u3002' },
        },
      },
      mechaForms: {
        title: 'MECHA FORMS',
        items: {
          standard: { label: 'Standard', desc: '\u30D0\u30E9\u30F3\u30B9\u578B\u3002\u7279\u6B8A\u80FD\u529B\u306A\u3057\u3002\u521D\u5FC3\u8005\u5411\u3051\u3002' },
          heavyArtillery: { label: 'Heavy Artillery', desc: '\u9AD8ATK\uFF081.8\u500D\uFF09\u3001\u4F4E\u79FB\u52D5\u901F\u5EA6\uFF080.8\u500D\uFF09\u30FB\u4F4E\u767A\u5C04\u7387\uFF080.6\u500D\uFF09\u3002\u5F3E\u304C\u7206\u767A\u3002' },
          highSpeed: { label: 'High Speed', desc: '\u9AD8\u79FB\u52D5\u901F\u5EA6\uFF081.4\u500D\uFF09\u30FB\u9AD8\u767A\u5C04\u7387\uFF081.5\u500D\uFF09\u3001\u4F4EATK\uFF080.7\u500D\uFF09\u3002\u5F3E\u304C\u8CAB\u901A\u3002' },
          awakened: { label: 'Awakened', desc: 'Combo\u3067\u306E\u307F\u767A\u52D5\uFF08\u9078\u629E\u4E0D\u53EF\uFF09\u3002ATK 2\u500D\u3001\u767A\u5C04\u73871.3\u500D\u30013\u9023\u30DB\u30FC\u30DF\u30F3\u30B0\u5F3E\u3001\u7121\u6575\u300210\u79D2\u9593\u3002' },
        },
      },
      combat: {
        title: 'COMBAT',
        items: {
          enemies: { label: '\u6575', desc: '\u56FA\u5B9A\u6575\u306F\u305D\u306E\u5834\u306B\u6EDE\u7A7A\u3002\u5DE1\u56DE\u6575\u306F\u5DE6\u53F3\u306B\u79FB\u52D5\u3002\u7A81\u9032\u6575\u306F\u30D7\u30EC\u30A4\u30E4\u30FC\u306B\u5411\u304B\u3063\u3066\u7A81\u9032\u3002' },
          damageIFrame: { label: '\u30C0\u30E1\u30FC\u30B8 & \u7121\u6575\u6642\u9593', desc: '\u88AB\u5F3E\u6642\u306B\u30C0\u30E1\u30FC\u30B8\u3092\u53D7\u3051\u30011.5\u79D2\u9593\u7121\u6575\u306B\uFF08\u30E1\u30AB\u304C\u70B9\u6EC5\uFF09\u3002' },
          bossStages: { label: 'Boss\u30B9\u30C6\u30FC\u30B8', desc: 'Boss\u304C\u3044\u308B\u30B9\u30C6\u30FC\u30B8\u3067\u306F\u80CC\u666F\u304C\u6E1B\u901F\u3001\u6575\u306E\u51FA\u73FE\u304C\u505C\u6B62\u3002Boss\u3092\u5012\u3059\u3068\u30AF\u30EA\u30A2\u3002' },
          exGauge: { label: 'EX\u30B2\u30FC\u30B8', desc: '\u6575\u6483\u7834\u3084\u30B2\u30FC\u30C8\u901A\u904E\u3067\u84C4\u7A4D\u3002\uFF08EX Burst\u306F\u4ECA\u5F8C\u5B9F\u88C5\u4E88\u5B9A\uFF09' },
        },
      },
      scoringProgression: {
        title: 'SCORING & PROGRESSION',
        items: {
          score: { label: 'Score', desc: '\u6575\u6483\u7834\uFF08100-200 pts\uFF09\u3001\u30B2\u30FC\u30C8\u901A\u904E\uFF08150 pts\uFF09\u3001\u30B9\u30C6\u30FC\u30B8\u30AF\u30EA\u30A2\uFF081000-3000 pts\uFF09\u3067\u30DD\u30A4\u30F3\u30C8\u7372\u5F97\u3002' },
          credits: { label: 'Credits', desc: '\u6575\u6483\u7834\u3084\u30B9\u30C6\u30FC\u30B8\u30AF\u30EA\u30A2\u3067\u7372\u5F97\u3059\u308B\u901A\u8CA8\u3002\u30A2\u30C3\u30D7\u30B0\u30EC\u30FC\u30C9\u3084\u5F62\u614B\u30A2\u30F3\u30ED\u30C3\u30AF\u306B\u4F7F\u7528\u3002' },
          upgrades: { label: 'Upgrades', desc: 'Upgrade\u753B\u9762\u304B\u3089\u57FA\u672CATK\u3001HP\u3001Speed\u3092\u6C38\u7D9A\u5F37\u5316\u3002\u5168\u3066\u306E\u4ECA\u5F8C\u306E\u30E9\u30F3\u306B\u9069\u7528\u3002' },
          stageClear: { label: 'Stage Clear', desc: '\u901A\u5E38\u30B9\u30C6\u30FC\u30B8\u306F\u6642\u9593\u7D4C\u904E\u3067\u30AF\u30EA\u30A2\u3002Boss\u30B9\u30C6\u30FC\u30B8\u306FBoss\u6483\u7834\u3067\u30AF\u30EA\u30A2\u3002' },
        },
      },
    },
  },
} as const;
