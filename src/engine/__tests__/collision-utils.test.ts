import { getCenter, getDistance } from '../collision';

describe('getCenter', () => {
  it('returns center coordinates of a box', () => {
    const c = getCenter({ x: 10, y: 20, width: 30, height: 40 });
    expect(c.x).toBe(25);
    expect(c.y).toBe(40);
  });

  it('handles zero-size box', () => {
    const c = getCenter({ x: 5, y: 5, width: 0, height: 0 });
    expect(c.x).toBe(5);
    expect(c.y).toBe(5);
  });
});

describe('getDistance', () => {
  it('calculates distance between two points', () => {
    expect(getDistance(0, 0, 3, 4)).toBe(5);
  });

  it('returns 0 for same point', () => {
    expect(getDistance(10, 20, 10, 20)).toBe(0);
  });

  it('is symmetric', () => {
    const d1 = getDistance(1, 2, 4, 6);
    const d2 = getDistance(4, 6, 1, 2);
    expect(d1).toBe(d2);
  });
});
