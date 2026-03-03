import { checkAABBOverlap, getPlayerHitbox } from '../collision';

describe('checkAABBOverlap', () => {
  it('detects overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 5, y: 5, width: 10, height: 10 };
    expect(checkAABBOverlap(a, b)).toBe(true);
  });

  it('returns false for non-overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 20, y: 20, width: 10, height: 10 };
    expect(checkAABBOverlap(a, b)).toBe(false);
  });

  it('returns false for touching edges (not overlapping)', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    const b = { x: 10, y: 0, width: 10, height: 10 };
    expect(checkAABBOverlap(a, b)).toBe(false);
  });

  it('detects containment', () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 10, y: 10, width: 10, height: 10 };
    expect(checkAABBOverlap(a, b)).toBe(true);
  });
});

describe('getPlayerHitbox', () => {
  it('returns centered hitbox smaller than visual', () => {
    const player = { x: 100, y: 200, width: 32, height: 40 };
    const hb = getPlayerHitbox(player);
    expect(hb.width).toBe(16);
    expect(hb.height).toBe(16);
    expect(hb.x).toBe(108); // 100 + (32-16)/2
    expect(hb.y).toBe(212); // 200 + (40-16)/2
  });
});
