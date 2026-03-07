import type { MechaFormDefinition } from '@/types/forms';

export const FORM_DEFINITIONS: Record<string, MechaFormDefinition> = {
  SD_Standard: {
    id: 'SD_Standard',
    displayName: 'Standard',
    moveSpeedMultiplier: 1.0,
    attackMultiplier: 1.0,
    fireRateMultiplier: 1.0,
    specialAbility: 'none',
    isTimeLimited: false,
    spriteConfig: { bodyColor: '#4488FF', accentColor: '#FFFFFF', glowColor: '#00D4FF' },
    bulletConfig: { width: 4, height: 12, speed: 400, color: '#00D4FF', count: 1 },
  },
  SD_HeavyArtillery: {
    id: 'SD_HeavyArtillery',
    displayName: 'Heavy Artillery',
    moveSpeedMultiplier: 0.8,
    attackMultiplier: 1.8,
    fireRateMultiplier: 0.6,
    specialAbility: 'explosion_radius',
    isTimeLimited: false,
    spriteConfig: { bodyColor: '#FF4444', accentColor: '#FFD600', glowColor: '#FF6600' },
    bulletConfig: { width: 8, height: 8, speed: 300, color: '#FF6600', count: 1 },
  },
  SD_HighSpeed: {
    id: 'SD_HighSpeed',
    displayName: 'High Speed',
    moveSpeedMultiplier: 1.4,
    attackMultiplier: 0.7,
    fireRateMultiplier: 1.5,
    specialAbility: 'pierce',
    isTimeLimited: false,
    spriteConfig: { bodyColor: '#00FF88', accentColor: '#FFFFFF', glowColor: '#00FF88' },
    bulletConfig: { width: 3, height: 16, speed: 500, color: '#00FF88', count: 1 },
  },
  SD_Sniper: {
    id: 'SD_Sniper',
    displayName: 'Sniper',
    moveSpeedMultiplier: 0.6,
    attackMultiplier: 2.5,
    fireRateMultiplier: 0.3,
    specialAbility: 'shield_pierce',
    isTimeLimited: false,
    spriteConfig: { bodyColor: '#8844FF', accentColor: '#FFFFFF', glowColor: '#AA66FF' },
    bulletConfig: { width: 3, height: 20, speed: 600, color: '#AA66FF', count: 1 },
  },
  SD_Scatter: {
    id: 'SD_Scatter',
    displayName: 'Scatter',
    moveSpeedMultiplier: 1.0,
    attackMultiplier: 0.6,
    fireRateMultiplier: 1.0,
    specialAbility: 'none',
    isTimeLimited: false,
    spriteConfig: { bodyColor: '#FF8844', accentColor: '#FFFFFF', glowColor: '#FFAA44' },
    bulletConfig: { width: 4, height: 10, speed: 380, color: '#FFAA44', count: 5 },
  },
  SD_Awakened: {
    id: 'SD_Awakened',
    displayName: 'Awakened',
    moveSpeedMultiplier: 1.2,
    attackMultiplier: 2.0,
    fireRateMultiplier: 1.3,
    specialAbility: 'homing_invincible',
    isTimeLimited: true,
    spriteConfig: { bodyColor: '#FFD700', accentColor: '#FFFFFF', glowColor: '#FFEA00' },
    bulletConfig: { width: 5, height: 14, speed: 450, color: '#FFEA00', count: 3 },
  },
};

export function getFormDefinition(id: string): MechaFormDefinition {
  const form = FORM_DEFINITIONS[id];
  if (!form) throw new Error(`Unknown form: ${id}`);
  return form;
}
