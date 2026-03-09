export type MechaFormId =
  | 'SD_Standard'
  | 'SD_HeavyArtillery'
  | 'SD_HighSpeed'
  | 'SD_Sniper'
  | 'SD_Scatter'
  | 'SD_Guardian'
  | 'SD_Awakened';

export type SpecialAbilityType =
  | 'explosion_radius'
  | 'pierce'
  | 'shield_pierce'
  | 'homing_invincible'
  | 'damage_reduce'
  | 'none';

export interface BulletConfig {
  width: number;
  height: number;
  speed: number;
  color: string;
  count: number; // bullets per shot (1 = single, 3 = spread, etc.)
}

export interface SpriteConfig {
  bodyColor: string;
  accentColor: string;
  glowColor: string;
}

export interface MechaFormDefinition {
  id: MechaFormId;
  displayName: string;
  moveSpeedMultiplier: number;
  attackMultiplier: number;
  fireRateMultiplier: number;
  specialAbility: SpecialAbilityType;
  isTimeLimited: boolean;
  spriteConfig: SpriteConfig;
  bulletConfig: BulletConfig;
}
