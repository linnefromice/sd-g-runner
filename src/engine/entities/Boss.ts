import type { BossEntity } from '@/types/entities';
import { HITBOX, LOGICAL_WIDTH } from '@/constants/dimensions';
import { BOSS_BASE_HP } from '@/constants/balance';

let nextId = 0;

export function createBoss(bossIndex: number): BossEntity {
  const hp = BOSS_BASE_HP * (1 + (bossIndex - 1) * 0.5);
  return {
    id: `boss_${nextId++}`,
    type: 'boss',
    bossIndex,
    x: (LOGICAL_WIDTH - HITBOX.boss.width) / 2,
    y: -HITBOX.boss.height, // starts off-screen, slides in
    width: HITBOX.boss.width,
    height: HITBOX.boss.height,
    active: true,
    hp,
    maxHp: hp,
    phase: 'spread',
    attackTimer: 0,
    hoverTimer: 0,
    hoverDirection: 1,
    drones: [],
    laserState: 'idle',
    laserTimer: 0,
    laserX: 0,
    laserTickTimer: 0,
  };
}
