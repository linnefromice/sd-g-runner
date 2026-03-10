import * as Haptics from 'expo-haptics';
import { useSaveDataStore } from '@/stores/saveDataStore';

/** Fire-and-forget haptics — silently ignored if native module is unavailable */
function safeHaptic(fn: () => Promise<void>) {
  try {
    const result = fn();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  } catch {
    // native module unavailable
  }
}

class HapticsManagerClass {
  private get enabled(): boolean {
    return useSaveDataStore.getState().settings.hapticsEnabled;
  }

  damage() {
    if (!this.enabled) return;
    safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  }

  enemyDestroy() {
    if (!this.enabled) return;
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }

  gatePass() {
    if (!this.enabled) return;
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  }

  exBurst() {
    if (!this.enabled) return;
    safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }

  awaken() {
    if (!this.enabled) return;
    safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  }

  bossKill() {
    if (!this.enabled) return;
    safeHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }
}

export const HapticsManager = new HapticsManagerClass();
