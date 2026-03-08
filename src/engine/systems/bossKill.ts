import type { GameEntities } from '@/types/entities';
import { useGameSessionStore } from '@/stores/gameSessionStore';
import { onBossKill } from '@/engine/effects';

/** Deactivate boss, set stage clear, and trigger kill effects. */
export function applyBossKill(entities: GameEntities): void {
  const boss = entities.boss;
  if (!boss || !boss.active) return;

  const bcx = boss.x + boss.width / 2;
  const bcy = boss.y + boss.height / 2;
  boss.active = false;

  const store = useGameSessionStore.getState();
  store.setFinalStageTime(entities.stageTime);
  store.setStageClear(true);

  onBossKill(entities, bcx, bcy);
}
