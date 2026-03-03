import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { ENEMY_STATS } from '@/constants/balance';
import { createEnemyBullet } from '@/engine/entities/Bullet';

export const enemyAISystem: GameSystem<GameEntities> = (entities, { time }) => {
  const dt = time.delta / 1000;

  for (const enemy of entities.enemies) {
    if (!enemy.active) continue;

    const stats = ENEMY_STATS[enemy.enemyType];
    if (stats.attackInterval <= 0) continue; // rush type doesn't shoot

    // Patrol movement
    if (enemy.enemyType === 'patrol') {
      enemy.moveTimer += dt;
      const speed = 60;
      enemy.x += enemy.moveDirection * speed * dt;

      // Reverse at bounds
      if (enemy.x < 16 || enemy.x + enemy.width > 304) {
        enemy.moveDirection *= -1;
      }
    }

    // Shooting
    enemy.shootTimer += dt;
    if (enemy.shootTimer >= stats.attackInterval) {
      enemy.shootTimer = 0;

      // Fire a bullet downward from enemy center
      const slot = entities.enemyBullets.find((b) => !b.active);
      if (slot) {
        const bullet = createEnemyBullet(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height,
          stats.attackDamage
        );
        Object.assign(slot, bullet);
        slot.active = true;
      }
    }
  }
};
