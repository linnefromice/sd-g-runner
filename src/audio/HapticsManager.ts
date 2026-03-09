import * as Haptics from 'expo-haptics';
import { useSaveDataStore } from '@/stores/saveDataStore';

class HapticsManagerClass {
  private get enabled(): boolean {
    return useSaveDataStore.getState().settings.hapticsEnabled;
  }

  damage() {
    if (!this.enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  enemyDestroy() {
    if (!this.enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  gatePass() {
    if (!this.enabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  exBurst() {
    if (!this.enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  awaken() {
    if (!this.enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  bossKill() {
    if (!this.enabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export const HapticsManager = new HapticsManagerClass();
