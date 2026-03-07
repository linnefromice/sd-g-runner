import type { GameSystem } from '@/engine/GameLoop';
import type { GameEntities } from '@/types/entities';
import { ENEMY_STATS, BASE_SCROLL_SPEED } from '@/constants/balance';
import { createEnemyBullet } from '@/engine/entities/Bullet';

export const enemyAISystem: GameSystem<GameEntities> = (entities, { time }) => {
  const dt = time.delta / 1000;

  for (const enemy of entities.enemies) {
    if (!enemy.active) continue;

    const stats = ENEMY_STATS[enemy.enemyType];

    // Movement
    switch (enemy.enemyType) {
      case 'patrol': {
        const speed = 60;
        enemy.x += enemy.moveDirection * speed * dt;

        // Reverse at bounds
        if (enemy.x < 16 || enemy.x + enemy.width > 304) {
          enemy.moveDirection *= -1;
        }
        break;
      }
      case 'swarm': {
        enemy.y += BASE_SCROLL_SPEED * dt;
        enemy.x += Math.cos(enemy.moveTimer * 3) * 40 * dt;
        enemy.moveTimer += dt;
        break;
      }
      case 'phalanx': {
        const speed = 40;
        enemy.x += enemy.moveDirection * speed * dt;

        // Reverse at bounds
        if (enemy.x < 16 || enemy.x + enemy.width > 304) {
          enemy.moveDirection *= -1;
        }
        break;
      }
      case 'juggernaut': {
        enemy.y += BASE_SCROLL_SPEED * 0.3 * dt;
        enemy.x += Math.sin(enemy.moveTimer * 1.5) * 20 * dt;
        enemy.moveTimer += dt;
        break;
      }
      // stationary and rush: no movement code needed
      default:
        break;
    }

    // Shooting
    if (stats.attackInterval <= 0) continue; // swarm/rush don't shoot

    enemy.shootTimer += dt;
    if (enemy.shootTimer >= stats.attackInterval) {
      enemy.shootTimer = 0;

      // Determine fire X position
      let fireX: number;
      if (enemy.enemyType === 'juggernaut') {
        // 3-turret sequential firing
        const offsets = [0.2, 0.5, 0.8];
        const turretPhase = Math.floor(enemy.moveTimer / stats.attackInterval) % 3;
        fireX = enemy.x + enemy.width * offsets[turretPhase];
      } else {
        fireX = enemy.x + enemy.width / 2;
      }

      // Fire a bullet downward
      const slot = entities.enemyBullets.find((b) => !b.active);
      if (slot) {
        const bullet = createEnemyBullet(
          fireX,
          enemy.y + enemy.height,
          stats.attackDamage
        );
        Object.assign(slot, bullet);
        slot.active = true;
      }
    }
  }
};
