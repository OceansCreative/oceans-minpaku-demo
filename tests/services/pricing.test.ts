import { describe, expect, it } from 'vitest';

import { calculateNightlyRates, calculateStayTotal } from '@/lib/services/pricing';

import type { PricingRule } from '@/types';

const BASE = 10_000;

const weekendRule: PricingRule = {
  id: 'rule-weekend',
  type: 'weekend',
  condition: { type: 'weekend', value: { weekdays: [5, 6] } },
  multiplier: 1.2,
};

const summerRule: PricingRule = {
  id: 'rule-summer',
  type: 'season',
  condition: { type: 'season', value: { from: '07-20', to: '08-31' } },
  multiplier: 1.3,
};

const newYearRule: PricingRule = {
  id: 'rule-new-year',
  type: 'season',
  condition: { type: 'season', value: { from: '12-29', to: '01-03' } },
  multiplier: 1.6,
};

const lastMinuteRule: PricingRule = {
  id: 'rule-last-minute',
  type: 'leadtime',
  condition: { type: 'leadtime', value: { maxDaysBefore: 3 } },
  multiplier: 0.9,
};

describe('calculateNightlyRates', () => {
  it('returns one rate per night between checkIn (inclusive) and checkOut (exclusive)', () => {
    const rates = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-06-01', // Monday
      checkOut: '2026-06-04', // Thursday
      rules: [],
    });
    expect(rates.map((r) => r.date)).toEqual(['2026-06-01', '2026-06-02', '2026-06-03']);
    expect(rates.every((r) => r.price === BASE)).toBe(true);
  });

  it('applies weekend multiplier on Friday and Saturday nights only', () => {
    // 2026-06-05 = Fri, 2026-06-06 = Sat, 2026-06-07 = Sun
    const rates = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-06-05',
      checkOut: '2026-06-08',
      rules: [weekendRule],
    });
    expect(rates[0]?.price).toBe(Math.round(BASE * 1.2)); // Fri
    expect(rates[1]?.price).toBe(Math.round(BASE * 1.2)); // Sat
    expect(rates[2]?.price).toBe(BASE); // Sun
  });

  it('compounds multipliers when multiple rules match a single night', () => {
    // 2026-08-01 = Saturday, in the summer season.
    const rates = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-08-01',
      checkOut: '2026-08-02',
      rules: [weekendRule, summerRule],
    });
    expect(rates[0]?.appliedRules).toEqual(['rule-weekend', 'rule-summer']);
    expect(rates[0]?.price).toBe(Math.round(BASE * 1.2 * 1.3));
  });

  it('handles season ranges that wrap the year boundary', () => {
    // newYearRule = 12-29 .. 01-03
    const dec30 = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-12-30',
      checkOut: '2026-12-31',
      rules: [newYearRule],
    });
    const jan02 = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2027-01-02',
      checkOut: '2027-01-03',
      rules: [newYearRule],
    });
    expect(dec30[0]?.price).toBe(Math.round(BASE * 1.6));
    expect(jan02[0]?.price).toBe(Math.round(BASE * 1.6));
  });

  it('applies a last-minute discount uniformly across every night when lead time is short', () => {
    const bookedAt = new Date('2026-06-01T00:00:00.000Z');
    const rates = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-06-02',
      checkOut: '2026-06-05',
      rules: [lastMinuteRule],
      context: { bookedAt },
    });
    expect(rates.every((r) => r.price === Math.round(BASE * 0.9))).toBe(true);
  });

  it('throws when checkOut is not after checkIn', () => {
    expect(() =>
      calculateNightlyRates({
        basePrice: BASE,
        checkIn: '2026-06-05',
        checkOut: '2026-06-05',
        rules: [],
      }),
    ).toThrow(/checkOut/);
  });
});

describe('calculateStayTotal', () => {
  it('sums per-night rates and reports nights count', () => {
    const quote = calculateStayTotal({
      basePrice: BASE,
      checkIn: '2026-06-05', // Fri
      checkOut: '2026-06-08', // Mon
      rules: [weekendRule],
    });
    expect(quote.nights).toBe(3);
    // Fri (×1.2) + Sat (×1.2) + Sun (×1.0)
    expect(quote.total).toBe(Math.round(BASE * 1.2) + Math.round(BASE * 1.2) + BASE);
  });
});
