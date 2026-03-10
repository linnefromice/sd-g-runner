import type { HowToPlayContent } from './how-to-play.types';

export const howToPlayEn: HowToPlayContent = {
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
          desc: 'Raises one stat but lowers another. Examples: ATK↑ SPD↓, SPD↑ ATK↓, Fire Rate↑ ATK↓.',
          extra: 'Resets combo gauge to 0. Choose carefully.',
        },
        refit: {
          label: 'Refit',
          desc: 'Switches your mecha to a different form. Stats change completely.',
          extra: 'Resets combo gauge to 0.',
        },
        growth: {
          label: 'Growth',
          desc: 'Similar to Enhance but the bonus scales with enemy kills. Starts small and grows stronger the more you fight.',
          extra: 'Combo +1 — counts toward combo gauge like Enhance.',
        },
        roulette: {
          label: 'Roulette',
          desc: 'The effect alternates between a bonus and a penalty every 0.5 seconds. Time your pass carefully for the good outcome.',
          extra: 'Combo +1 — counts toward combo gauge like Enhance.',
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
        comboGauge: { label: 'Combo Gauge', desc: 'Pass through 3 consecutive Enhance, Growth, or Roulette gates to fill the combo gauge (shown as 3 segments on HUD).' },
        awakenedForm: { label: 'Awakened Form', desc: 'When the combo gauge fills, your mecha transforms into the Awakened form for 10 seconds — 2x ATK, 1.3x fire rate, triple homing shots, and invincibility.' },
        comboReset: { label: 'Combo Reset', desc: 'Taking damage, passing through a Tradeoff gate, or passing through a Refit gate resets your combo to 0.' },
      },
    },
    transform: {
      title: 'TRANSFORM',
      items: {
        transformGauge: { label: 'Transform Gauge', desc: 'Builds passively (+2/sec), and by defeating enemies (+8) and passing through gates (+12). When full, you can transform.' },
        howToTransform: { label: 'How to Transform', desc: 'Tap the TF button (bottom-right) when the gauge is full. Switches between your Primary and Secondary form.' },
        formSelection: { label: 'Form Selection', desc: 'Choose two forms before starting a stage. Primary is your starting form, Secondary is your transform target.' },
        refitGates: { label: 'Refit Gates', desc: 'Refit gates still force-switch your form regardless of the transform gauge. This can put you in a form outside your selected pair.' },
      },
    },
    mechaForms: {
      title: 'MECHA FORMS',
      items: {
        standard: { label: 'Standard', desc: 'Balanced stats. No special ability. Good for beginners. Available from the start.' },
        heavyArtillery: { label: 'Heavy Artillery', desc: 'High ATK (1.8x), slow movement (0.8x) and fire rate (0.6x). Shots cause explosions.' },
        highSpeed: { label: 'High Speed', desc: 'Fast movement (1.4x) and fire rate (1.5x), low ATK (0.7x). Shots pierce through enemies.' },
        sniper: { label: 'Sniper', desc: 'Highest ATK (2.5x), very slow movement (0.6x) and fire rate (0.3x). Shots pierce enemy shields.' },
        scatter: { label: 'Scatter', desc: 'Balanced speed (1.0x), low ATK (0.6x). Fires 5 bullets per shot in a spread pattern.' },
        guardian: { label: 'Guardian', desc: 'Slow movement (0.7x), moderate ATK (0.8x) and fire rate (0.8x). Reduces incoming damage.' },
        awakened: { label: 'Awakened', desc: 'Activated by combo only (not selectable). 2x ATK, 1.3x fire rate, triple homing shots, invincible. Lasts 10 seconds.' },
      },
    },
    combat: {
      title: 'COMBAT',
      items: {
        enemies: { label: 'Enemies', desc: 'Stationary enemies hover in place. Patrol enemies move side-to-side. Rush enemies charge toward you.' },
        advancedEnemies: { label: 'Advanced Enemies', desc: 'Swarm: weak but appear in groups. Phalanx: heavy armor. Dodger: evades your shots. Splitter: splits into smaller units. Summoner: spawns allies. Sentinel: shielded, takes reduced damage.' },
        graze: { label: 'Graze', desc: 'Narrowly dodging enemy bullets earns bonus points (20-150 pts), EX gauge, and Transform gauge. The closer the dodge, the bigger the reward.' },
        debris: { label: 'Debris', desc: 'Destructible objects that deal contact damage. Destroy them for 50 pts.' },
        damageIFrame: { label: 'Damage & i-Frame', desc: 'When hit, you take damage and become invincible for 1.2 seconds (mecha blinks during this time).' },
        bossStages: { label: 'Boss Stages', desc: 'Some stages have a boss. The background slows, enemy spawning stops, and you must defeat the boss to clear the stage.' },
        exGauge: { label: 'EX Gauge', desc: 'Builds up by defeating enemies (+5), passing through gates (+10), and hitting bosses (+2). Unleash EX Burst when full.' },
      },
    },
    scoringProgression: {
      title: 'SCORING & PROGRESSION',
      items: {
        score: { label: 'Score', desc: 'Earn points by defeating enemies (100-500 pts), passing gates (150 pts), boss damage (50 pts per 1%), and clearing stages (1000-3000 pts).' },
        graze: { label: 'Graze Bonus', desc: 'Near-miss dodges earn 20 pts (normal), 50 pts (close), or 150 pts (extreme). Also builds EX and Transform gauges.' },
        credits: { label: 'Credits', desc: 'Currency earned from enemy kills (1-7 Cr) and stage clears (50-150 Cr). Spend on upgrades and form unlocks.' },
        upgrades: { label: 'Upgrades', desc: 'Permanently boost ATK, HP, Speed, DEF, and Credit Boost from the Upgrade screen. Effects carry over to all future runs.' },
        formUnlocks: { label: 'Form Unlocks', desc: 'New forms unlock as you progress. Clear required stages and spend credits to unlock them on the Form Select screen.' },
        formXP: { label: 'Form XP', desc: 'Each form earns XP from kills, grazes, and gate passes. Level up forms (Lv1-3) for stat bonuses.' },
        stageClear: { label: 'Stage Clear', desc: 'Normal stages clear when time runs out. Boss stages clear when the boss is defeated.' },
      },
    },
  },
};
