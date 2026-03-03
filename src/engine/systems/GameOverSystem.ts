import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { useGameSessionStore } from '@/stores/gameSessionStore';

export const gameOverSystem: GameSystem<GameEntities> = (entities) => {
  const store = useGameSessionStore.getState();
  if (store.hp <= 0 && !store.isGameOver) {
    store.setGameOver(true);
    entities.player.active = false;
  }
};
