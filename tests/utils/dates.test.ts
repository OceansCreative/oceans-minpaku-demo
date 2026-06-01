import { describe, expect, it } from 'vitest';

import {
  joinPropertyDateTime,
  nightsBetween,
  parseIsoDate,
  PROPERTY_TZ_OFFSET,
  toIsoDate,
} from '@/lib/utils/dates';

describe('toIsoDate / parseIsoDate', () => {
  it('round-trips a YYYY-MM-DD through parseIsoDate → toIsoDate', () => {
    expect(toIsoDate(parseIsoDate('2026-06-12'))).toBe('2026-06-12');
  });

  it('parseIsoDate anchors to UTC midnight', () => {
    const d = parseIsoDate('2026-06-12');
    expect(d.getUTCHours()).toBe(0);
    expect(d.getUTCDate()).toBe(12);
  });
});

describe('nightsBetween', () => {
  it('returns the count of stay nights for a half-open range', () => {
    // 2026-06-01 → 2026-06-04 = three nights (1st, 2nd, 3rd)
    expect(nightsBetween('2026-06-01', '2026-06-04')).toBe(3);
  });

  it('returns 0 for an empty or inverted range', () => {
    expect(nightsBetween('2026-06-01', '2026-06-01')).toBe(0);
    expect(nightsBetween('2026-06-04', '2026-06-01')).toBe(0);
  });
});

describe('joinPropertyDateTime', () => {
  it('serializes wall-clock times in the property timezone, NOT UTC', () => {
    // Regression for the original bug: `${date}T${time}:00.000Z` made
    // JST 15:00 → UTC 15:00 → JST 24:00. Codes came alive 9 hours late.
    const checkIn = joinPropertyDateTime('2026-06-12', '15:00');
    expect(checkIn).toBe(`2026-06-12T15:00:00${PROPERTY_TZ_OFFSET}`);
    expect(checkIn).not.toContain('Z');

    // Confirm that the parsed instant *is* what a JST 15:00 should be:
    // JST 15:00 = UTC 06:00 on the same day.
    const asInstant = new Date(checkIn);
    expect(asInstant.getUTCHours()).toBe(6);
    expect(asInstant.getUTCDate()).toBe(12);
  });

  it('serializes midnight check-out without rolling the day forward in UTC', () => {
    // JST 10:00 = UTC 01:00 — still the same UTC date.
    const checkOut = joinPropertyDateTime('2026-06-14', '10:00');
    expect(new Date(checkOut).getUTCDate()).toBe(14);
    expect(new Date(checkOut).getUTCHours()).toBe(1);
  });
});
