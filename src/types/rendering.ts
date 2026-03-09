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
  /** Growth gate progress 0–1 (current value / max value) */
  gateProgress?: number;
  /** Pre-computed HP bar color (green/yellow/red based on hpRatio) */
  hpBarColor?: string;
  /** Enlarged SVG path for fake glow effect (drawn behind main shape at low opacity) */
  glowPath?: string;
  /** Pre-computed glow color with embedded alpha (e.g. '#00D4FF33') */
  glowColor?: string;
  /** Skia BlendMode name for additive blending (e.g. 'screen') */
  blendMode?: string;
  /** Y-based depth scale (0.75–1.0) for 2.5D perspective — visual only, no collision impact */
  depthScale?: number;
  /** Pre-computed SVG path for directional shadow (offset behind main shape) */
  shadowPath?: string;
};
