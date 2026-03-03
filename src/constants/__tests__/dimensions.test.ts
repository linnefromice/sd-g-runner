import { getScreenMetrics } from '../dimensions';

describe('getScreenMetrics', () => {
  it('calculates scale from screen width', () => {
    const { scale } = getScreenMetrics(640, 1136);
    expect(scale).toBe(2);
  });

  it('calculates visible height from screen dimensions', () => {
    const { visibleHeight } = getScreenMetrics(640, 1136);
    expect(visibleHeight).toBe(568);
  });

  it('works for iPhone SE dimensions', () => {
    const { scale, visibleHeight } = getScreenMetrics(375, 667);
    expect(scale).toBeCloseTo(1.171875);
    expect(visibleHeight).toBeCloseTo(569.17, 1);
  });
});
