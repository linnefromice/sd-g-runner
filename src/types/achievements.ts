export type AchievementId =
  | 'first_clear' | 'boss_slayer' | 'all_forms' | 'all_stages'
  | 'no_damage_clear' | 'combo_master' | 'credit_hoarder'
  | 'speed_demon' | 'guardian_angel' | 'endless_survivor';

export interface AchievementDefinition {
  id: AchievementId;
  reward: number;
}
