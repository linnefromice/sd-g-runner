export type HowToPlayItem = { label: string; desc: string; extra?: string };

type ItemSet<K extends string> = Record<K, HowToPlayItem>;

export interface HowToPlayContent {
  title: string;
  backToTitle: string;
  sections: {
    basicControls: { title: string; items: ItemSet<'move' | 'tapToMove' | 'shooting' | 'pause'> };
    gates: {
      title: string; description: string;
      items: ItemSet<'enhance' | 'recovery' | 'tradeoff' | 'refit' | 'growth' | 'roulette'>;
    };
    gateLayouts: { title: string; items: ItemSet<'forced' | 'optional'> };
    comboAwakening: { title: string; items: ItemSet<'comboGauge' | 'awakenedForm' | 'comboReset'> };
    transform: { title: string; items: ItemSet<'transformGauge' | 'howToTransform' | 'formSelection' | 'refitGates'> };
    mechaForms: { title: string; items: ItemSet<'standard' | 'heavyArtillery' | 'highSpeed' | 'sniper' | 'scatter' | 'guardian' | 'awakened'> };
    combat: { title: string; items: ItemSet<'enemies' | 'advancedEnemies' | 'graze' | 'debris' | 'damageIFrame' | 'bossStages' | 'exGauge'> };
    scoringProgression: { title: string; items: ItemSet<'score' | 'graze' | 'credits' | 'upgrades' | 'formUnlocks' | 'formXP' | 'stageClear'> };
  };
}
