import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import type { MechaFormDefinition } from '@/types/forms';
import { BASE_FIRE_INTERVAL } from '@/constants/balance';
import { createPlayerBullet } from '@/engine/entities/Bullet';

let fireTimer = 0;

export function createShootingSystem(getForm: () => MechaFormDefinition): GameSystem<GameEntities> {
  return (entities, { time }) => {
    const form = getForm();
    const interval = BASE_FIRE_INTERVAL / form.fireRateMultiplier;

    fireTimer += time.delta;
    if (fireTimer < interval) return;
    fireTimer -= interval;

    const p = entities.player;
    if (!p.active) return;

    const bulletConfig = form.bulletConfig;
    const damage = 10 * form.attackMultiplier; // base ATK from store would be injected

    // Find an inactive bullet slot
    const slot = entities.playerBullets.find((b) => !b.active);
    if (!slot) return; // pool exhausted

    const bullet = createPlayerBullet(
      p.x + p.width / 2,
      p.y,
      damage,
      { width: bulletConfig.width, height: bulletConfig.height, speed: bulletConfig.speed }
    );
    Object.assign(slot, bullet);
    slot.active = true;
  };
}
