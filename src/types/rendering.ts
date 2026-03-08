export type RenderEntity = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  label?: string;
  /** Pre-computed SVG path string (built on JS thread by SyncRenderSystem) */
  path?: string;
  /** HP ratio 0–1 for entities with health bars (enemies, debris, boss) */
  hpRatio?: number;
};
