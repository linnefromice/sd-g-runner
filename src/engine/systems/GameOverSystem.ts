import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { useGameSessionStore } from '@/stores/gameSessionStore';

export const gameOverSystem: GameSystem<GameEntities> = (entities) => {
  const store = useGameSessionStore.getState();

  // Player death
  if (store.hp <= 0 && !store.isGameOver) {
    store.setGameOver(true);
    entities.player.active = false;
    return;
  }

  // Non-boss stage completion: time-based
  if (
    !store.isStageClear &&
    !store.isGameOver &&
    !entities.isBossStage &&
    entities.stageDuration > 0 &&
    entities.stageTime >= entities.stageDuration
  ) {
    store.setStageClear(true);
  }
};
