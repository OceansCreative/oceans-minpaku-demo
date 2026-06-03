import { describe, expect, it } from 'vitest';

import { rateHeatLevel } from '@/lib/services/pricing';

describe('rateHeatLevel', () => {
  it('maps the minimum to the coldest bucket (0)', () => {
    expect(rateHeatLevel(10_000, 10_000, 30_000)).toBe(0);
  });

  it('maps the maximum to the hottest bucket (levels - 1)', () => {
    expect(rateHeatLevel(30_000, 10_000, 30_000)).toBe(4);
  });

  it('maps the midpoint to the middle bucket', () => {
    // (20_000 - 10_000) / (30_000 - 10_000) = 0.5 → floor(0.5 * 5) = 2
    expect(rateHeatLevel(20_000, 10_000, 30_000)).toBe(2);
  });

  it('spreads evenly spaced rates across distinct buckets', () => {
    const min = 0;
    const max = 100;
    const buckets = [0, 25, 50, 75, 100].map((r) => rateHeatLevel(r, min, max));
    // 0→0, 25→floor(1.25)=1, 50→floor(2.5)=2, 75→floor(3.75)=3, 100 clamps to 4
    expect(buckets).toEqual([0, 1, 2, 3, 4]);
  });

  it('clamps rates below the minimum to bucket 0', () => {
    expect(rateHeatLevel(5_000, 10_000, 30_000)).toBe(0);
    expect(rateHeatLevel(-1, 0, 100)).toBe(0);
  });

  it('clamps rates above the maximum to the hottest bucket', () => {
    expect(rateHeatLevel(99_999, 10_000, 30_000)).toBe(4);
  });

  it('returns the middle bucket when min === max (flat month)', () => {
    // 5 levels → maxLevel 4 → floor(4 / 2) = 2
    expect(rateHeatLevel(24_000, 24_000, 24_000)).toBe(2);
    // odd-handling for an even level count: 4 levels → maxLevel 3 → floor(3/2) = 1
    expect(rateHeatLevel(24_000, 24_000, 24_000, 4)).toBe(1);
  });

  it('honours a custom level count', () => {
    expect(rateHeatLevel(0, 0, 100, 3)).toBe(0);
    expect(rateHeatLevel(100, 0, 100, 3)).toBe(2);
    expect(rateHeatLevel(50, 0, 100, 3)).toBe(1);
  });

  it('returns 0 for non-finite or degenerate input', () => {
    expect(rateHeatLevel(Number.NaN, 0, 100)).toBe(0);
    expect(rateHeatLevel(50, Number.NaN, 100)).toBe(0);
    expect(rateHeatLevel(50, 0, Number.NaN)).toBe(0);
    expect(rateHeatLevel(Number.POSITIVE_INFINITY, 0, 100)).toBe(0);
    expect(rateHeatLevel(50, 0, 100, 0)).toBe(0);
    expect(rateHeatLevel(50, 100, 0)).toBe(0); // max < min
  });

  it('keeps every result inside [0, levels - 1]', () => {
    const levels = 5;
    for (let r = -50; r <= 150; r += 7) {
      const level = rateHeatLevel(r, 0, 100, levels);
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(levels - 1);
      expect(Number.isInteger(level)).toBe(true);
    }
  });
});
