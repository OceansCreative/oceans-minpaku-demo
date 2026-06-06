import { describe, expect, it } from 'vitest';

import { seedPricingRules } from '@/lib/seed/pricing';
import { calculateNightlyRates, calculateStayTotal } from '@/lib/services/pricing';

import type { PricingRule } from '@/types';

const BASE = 10_000;

/** Next UTC calendar day as YYYY-MM-DD — handy for one-night check-out dates. */
function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const weekendRule: PricingRule = {
  id: 'rule-weekend',
  condition: { type: 'weekend', value: { weekdays: [5, 6] } },
  multiplier: 1.2,
};

const summerRule: PricingRule = {
  id: 'rule-summer',
  condition: { type: 'season', value: { from: '07-20', to: '08-31' } },
  multiplier: 1.3,
};

const newYearRule: PricingRule = {
  id: 'rule-new-year',
  condition: { type: 'season', value: { from: '12-29', to: '01-03' } },
  multiplier: 1.6,
};

const lastMinuteRule: PricingRule = {
  id: 'rule-last-minute',
  condition: { type: 'leadtime', value: { maxDaysBefore: 3 } },
  multiplier: 0.9,
};

const highOccupancyRule: PricingRule = {
  id: 'rule-high-occupancy',
  condition: { type: 'occupancy', value: { minOccupancyRate: 0.8 } },
  multiplier: 1.25,
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

  it('keeps the stay date stable across a DST boundary (America/New_York spring-forward)', () => {
    // 2026-03-08 is US spring-forward (02:00 → 03:00 local). UTC date math must
    // not drop or duplicate a night when the suite runs under TZ=America/New_York.
    const rates = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-03-07',
      checkOut: '2026-03-10',
      rules: [],
    });
    expect(rates.map((r) => r.date)).toEqual(['2026-03-07', '2026-03-08', '2026-03-09']);
    expect(rates).toHaveLength(3);
    expect(rates.every((r) => r.price === BASE)).toBe(true);
  });
});

describe('leadtime rule', () => {
  it('applies at exactly maxDaysBefore but not at maxDaysBefore + 1', () => {
    // booked 3 days before check-in → leadDays === 3 === maxDaysBefore → applies
    const exactly = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-06-04',
      checkOut: '2026-06-05',
      rules: [lastMinuteRule],
      context: { bookedAt: new Date('2026-06-01T00:00:00.000Z') },
    })[0];
    expect(exactly?.appliedRules).toEqual(['rule-last-minute']);

    // booked 4 days before → leadDays === 4 > maxDaysBefore → does NOT apply
    const tooEarly = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-06-05',
      checkOut: '2026-06-06',
      rules: [lastMinuteRule],
      context: { bookedAt: new Date('2026-06-01T00:00:00.000Z') },
    })[0];
    expect(tooEarly?.appliedRules).toEqual([]);
  });

  it('floors a bookedAt that carries a time component (proves the off-by-one fix)', () => {
    // bookedAt is late on 2026-06-01 (23:30 UTC). Without flooring, the raw
    // span to 2026-06-04 midnight is ~2.02 days → floor 2; with both sides
    // floored to UTC midnight it is exactly 3 days, matching maxDaysBefore.
    const rate = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-06-04',
      checkOut: '2026-06-05',
      rules: [lastMinuteRule],
      context: { bookedAt: new Date('2026-06-01T23:30:00.000Z') },
    })[0];
    expect(rate?.appliedRules).toEqual(['rule-last-minute']);
    expect(rate?.price).toBe(Math.round(BASE * 0.9));
  });

  it('throws when a leadtime rule is present but no bookedAt is supplied', () => {
    expect(() =>
      calculateNightlyRates({
        basePrice: BASE,
        checkIn: '2026-06-02',
        checkOut: '2026-06-03',
        rules: [lastMinuteRule],
      }),
    ).toThrow(/bookedAt/);
  });
});

describe('occupancy rule', () => {
  it('applies when month-of-stay occupancy meets the threshold', () => {
    const rate = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-08-15',
      checkOut: '2026-08-16',
      rules: [highOccupancyRule],
      context: { monthlyOccupancy: { '2026-08': 0.9 } },
    })[0];
    expect(rate?.appliedRules).toEqual(['rule-high-occupancy']);
    expect(rate?.price).toBe(Math.round(BASE * 1.25));
  });

  it('applies at exactly the minimum occupancy rate (>=)', () => {
    const rate = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-08-15',
      checkOut: '2026-08-16',
      rules: [highOccupancyRule],
      context: { monthlyOccupancy: { '2026-08': 0.8 } },
    })[0];
    expect(rate?.appliedRules).toEqual(['rule-high-occupancy']);
  });

  it('does not apply below the threshold or when the month key is absent', () => {
    const below = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-08-15',
      checkOut: '2026-08-16',
      rules: [highOccupancyRule],
      context: { monthlyOccupancy: { '2026-08': 0.79 } },
    })[0];
    const missing = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-08-15',
      checkOut: '2026-08-16',
      rules: [highOccupancyRule],
      context: { monthlyOccupancy: { '2026-07': 1 } },
    })[0];
    expect(below?.appliedRules).toEqual([]);
    expect(missing?.appliedRules).toEqual([]);
  });

  it('derives the YYYY-MM month key from the night in UTC, not local time', () => {
    // Night of 2026-08-31 must key into '2026-08' regardless of runtime TZ.
    // Under TZ=America/New_York the local date of UTC-midnight is still Aug 31.
    const rate = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-08-31',
      checkOut: '2026-09-01',
      rules: [highOccupancyRule],
      context: { monthlyOccupancy: { '2026-08': 0.95, '2026-09': 0 } },
    })[0];
    expect(rate?.appliedRules).toEqual(['rule-high-occupancy']);
  });
});

describe('season rule edges', () => {
  const sameDayRule: PricingRule = {
    id: 'rule-single-day',
    condition: { type: 'season', value: { from: '08-15', to: '08-15' } },
    multiplier: 2,
  };

  it('matches a single-day season where from === to', () => {
    const onDay = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-08-15',
      checkOut: '2026-08-16',
      rules: [sameDayRule],
    })[0];
    const offDay = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-08-16',
      checkOut: '2026-08-17',
      rules: [sameDayRule],
    })[0];
    expect(onDay?.price).toBe(Math.round(BASE * 2));
    expect(offDay?.price).toBe(BASE);
  });

  it('includes both wrap endpoints (12-29 and 01-03) and excludes just outside', () => {
    const night = (date: string) =>
      calculateNightlyRates({
        basePrice: BASE,
        checkIn: date,
        checkOut: nextDay(date),
        rules: [newYearRule],
      })[0];

    expect(night('2026-12-29')?.price).toBe(Math.round(BASE * 1.6)); // start endpoint
    expect(night('2027-01-03')?.price).toBe(Math.round(BASE * 1.6)); // end endpoint
    expect(night('2026-12-28')?.price).toBe(BASE); // day before start
    expect(night('2027-01-04')?.price).toBe(BASE); // day after end
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

const longStayRule: PricingRule = {
  id: 'rule-long-stay',
  condition: { type: 'lengthOfStay', value: { minNights: 5 } },
  multiplier: 0.9,
};

describe('lengthOfStay rule', () => {
  it('discounts every night once the stay reaches the minimum nights', () => {
    const rates = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-06-08', // Mon → 5 nights, all weekdays (no weekend overlap)
      checkOut: '2026-06-13',
      rules: [longStayRule],
    });
    expect(rates).toHaveLength(5);
    expect(rates.every((r) => r.price === Math.round(BASE * 0.9))).toBe(true);
    expect(rates.every((r) => r.appliedRules.includes('rule-long-stay'))).toBe(true);
  });

  it('does not apply below the minimum nights', () => {
    const rates = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-06-08', // 4 nights
      checkOut: '2026-06-12',
      rules: [longStayRule],
    });
    expect(rates).toHaveLength(4);
    expect(rates.every((r) => r.price === BASE)).toBe(true);
    expect(rates.every((r) => r.appliedRules.length === 0)).toBe(true);
  });

  it('compounds with a weekend rule', () => {
    const rates = calculateNightlyRates({
      basePrice: BASE,
      checkIn: '2026-06-05', // Fri → 5 nights incl. Fri+Sat
      checkOut: '2026-06-10',
      rules: [weekendRule, longStayRule],
    });
    const byDate = new Map(rates.map((r) => [r.date, r.price]));
    // Fri: weekend ×1.2 × long-stay ×0.9
    expect(byDate.get('2026-06-05')).toBe(Math.round(BASE * 1.2 * 0.9));
    // Sun: long-stay only ×0.9
    expect(byDate.get('2026-06-07')).toBe(Math.round(BASE * 0.9));
  });
});

describe('calculateStayTotal with the seed rule set (booking path)', () => {
  it('quotes without throwing when a leadtime rule is present and bookedAt is supplied', () => {
    // Mirrors the guest BookingFlow call: full seed rules + a bookedAt anchor.
    const quote = calculateStayTotal({
      basePrice: 20_000,
      checkIn: '2026-09-10',
      checkOut: '2026-09-13',
      rules: seedPricingRules,
      context: { bookedAt: new Date('2026-09-01T00:00:00.000Z') },
    });
    expect(quote.nights).toBe(3);
    expect(quote.total).toBeGreaterThan(0);
  });
});
