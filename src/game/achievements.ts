import type { AchievementId, AchievementDefinition } from '@/types/achievements';

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first_clear', reward: 100 },
  { id: 'boss_slayer', reward: 300 },
  { id: 'all_forms', reward: 500 },
  { id: 'all_stages', reward: 1000 },
  { id: 'no_damage_clear', reward: 500 },
  { id: 'combo_master', reward: 200 },
  { id: 'credit_hoarder', reward: 300 },
  { id: 'speed_demon', reward: 200 },
  { id: 'guardian_angel', reward: 200 },
  { id: 'endless_survivor', reward: 500 },
];

export function getAchievement(id: AchievementId): AchievementDefinition {
  return ACHIEVEMENTS.find((a) => a.id === id)!;
}
