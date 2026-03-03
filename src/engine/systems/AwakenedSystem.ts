import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { useGameSessionStore } from '@/stores/gameSessionStore';

const AWAKENED_WARNING_THRESHOLD = 3000; // ms remaining before warning

export const awakenedSystem: GameSystem<GameEntities> = (_entities, { time }) => {
  const store = useGameSessionStore.getState();
  if (!store.isAwakened) return;

  const newTimer = store.awakenedTimer - time.delta;

  if (newTimer <= 0) {
    store.deactivateAwakened();
    return;
  }

  // Warning at 3s remaining
  if (newTimer <= AWAKENED_WARNING_THRESHOLD && !store.awakenedWarning) {
    store.setAwakenedWarning(true);
  }

  // Update timer directly
  useGameSessionStore.setState({ awakenedTimer: newTimer });
};
