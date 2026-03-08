import type { GameEntities, DebrisEntity } from '@/types/entities';
import { DEBRIS_DESTROY_SCORE } from '@/constants/balance';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { deactivateDebris } from '@/engine/entities/Debris';
import { getCenter } from '@/engine/collision';
import { onDebrisDestroy } from '@/engine/effects';

export function applyDebrisDestroyReward(debris: DebrisEntity, entities: GameEntities): void {
  const dc = getCenter(debris);
  deactivateDebris(debris);
  useGameSessionStore.getState().addScore(DEBRIS_DESTROY_SCORE);
  onDebrisDestroy(entities, dc.x, dc.y);
}
