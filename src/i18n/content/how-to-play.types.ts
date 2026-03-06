export type HowToPlayItem = { label: string; desc: string; extra?: string };

type ItemSet<K extends string> = Record<K, HowToPlayItem>;

export interface HowToPlayContent {
  title: string;
  backToTitle: string;
  sections: {
    basicControls: { title: string; items: ItemSet<'move' | 'tapToMove' | 'shooting' | 'pause'> };
    gates: {
      title: string; description: string;
      items: ItemSet<'enhance' | 'recovery' | 'tradeoff' | 'refit'>;
    };
    gateLayouts: { title: string; items: ItemSet<'forced' | 'optional'> };
    comboAwakening: { title: string; items: ItemSet<'comboGauge' | 'awakenedForm' | 'comboReset'> };
    transform: { title: string; items: ItemSet<'transformGauge' | 'howToTransform' | 'formSelection' | 'refitGates'> };
    mechaForms: { title: string; items: ItemSet<'standard' | 'heavyArtillery' | 'highSpeed' | 'awakened'> };
    combat: { title: string; items: ItemSet<'enemies' | 'damageIFrame' | 'bossStages' | 'exGauge'> };
    scoringProgression: { title: string; items: ItemSet<'score' | 'credits' | 'upgrades' | 'stageClear'> };
  };
}
