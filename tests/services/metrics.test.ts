import { describe, expect, it } from 'vitest';

import {
  nightsInRange,
  occupancyInRange,
  resolvePeriod,
  salesInRange,
  type DateRange,
} from '@/lib/services/metrics';

import type { Reservation } from '@/types';

describe('resolvePeriod', () => {
  it('resolves thisMonth to calendar-month bounds (half-open)', () => {
    expect(resolvePeriod('thisMonth', '2026-06-03')).toEqual({
      start: '2026-06-01',
      end: '2026-07-01',
    });
  });

  it('resolves lastMonth to the prior calendar month', () => {
    expect(resolvePeriod('lastMonth', '2026-06-03')).toEqual({
      start: '2026-05-01',
      end: '2026-06-01',
    });
  });

  it('wraps lastMonth across a year boundary', () => {
    expect(resolvePeriod('lastMonth', '2026-01-15')).toEqual({
      start: '2025-12-01',
      end: '2026-01-01',
    });
  });

  it('rolls thisMonth into the next year in December', () => {
    expect(resolvePeriod('thisMonth', '2026-12-20')).toEqual({
      start: '2026-12-01',
      end: '2027-01-01',
    });
  });

  it('resolves last30Days to a trailing 30-night window ending at ref', () => {
    const range = resolvePeriod('last30Days', '2026-06-30');
    expect(range).toEqual({ start: '2026-05-31', end: '2026-06-30' });
    expect(nightsInRange('2026-05-31', '2026-06-30', range)).toBe(30);
  });

  it('resolves last90Days to a trailing 90-night window ending at ref', () => {
    const range = resolvePeriod('last90Days', '2026-06-30');
    expect(nightsInRange(range.start, range.end, range)).toBe(90);
  });
});

describe('nightsInRange', () => {
  const range: DateRange = { start: '2026-06-01', end: '2026-07-01' };

  it('counts a stay fully inside the range', () => {
    expect(nightsInRange('2026-06-10', '2026-06-13', range)).toBe(3);
  });

  it('clamps a stay overlapping the start edge', () => {
    expect(nightsInRange('2026-05-28', '2026-06-03', range)).toBe(2);
  });

  it('clamps a stay overlapping the end edge', () => {
    expect(nightsInRange('2026-06-29', '2026-07-05', range)).toBe(2);
  });

  it('returns 0 for a stay entirely before the range', () => {
    expect(nightsInRange('2026-05-01', '2026-05-20', range)).toBe(0);
  });

  it('returns 0 for a stay entirely after the range', () => {
    expect(nightsInRange('2026-07-10', '2026-07-15', range)).toBe(0);
  });

  it('treats the exclusive end as not bookable', () => {
    expect(nightsInRange('2026-07-01', '2026-07-03', range)).toBe(0);
  });
});

/** Minimal reservation factory for metric tests. */
function resv(over: Partial<Reservation>): Reservation {
  return {
    id: 'r1',
    roomId: 'room-1',
    guestId: 'g1',
    checkIn: '2026-06-10',
    checkOut: '2026-06-12',
    checkInTime: '15:00',
    checkOutTime: '10:00',
    status: 'approved',
    source: 'direct',
    amount: 30_000,
    payment: { intentId: 'pi_1', status: 'authorized' },
    createdAt: '2026-06-01T00:00:00+09:00',
    ...over,
  };
}

describe('occupancyInRange', () => {
  const range: DateRange = { start: '2026-06-01', end: '2026-07-01' }; // 30 nights

  it('sums booked nights and divides by rooms × nights', () => {
    const reservations = [
      resv({ checkIn: '2026-06-01', checkOut: '2026-06-04' }), // 3
      resv({ id: 'r2', checkIn: '2026-06-10', checkOut: '2026-06-13' }), // 3
    ];
    const s = occupancyInRange(reservations, 2, range);
    expect(s.bookedNights).toBe(6);
    expect(s.capacity).toBe(60); // 2 rooms × 30 nights
    expect(s.rate).toBeCloseTo(0.1, 5);
  });

  it('excludes cancelled and rejected stays', () => {
    const reservations = [
      resv({ status: 'cancelled', checkIn: '2026-06-01', checkOut: '2026-06-10' }),
      resv({ id: 'r2', status: 'rejected', checkIn: '2026-06-01', checkOut: '2026-06-10' }),
      resv({ id: 'r3', status: 'pending', checkIn: '2026-06-01', checkOut: '2026-06-03' }), // 2
    ];
    const s = occupancyInRange(reservations, 1, range);
    expect(s.bookedNights).toBe(2);
  });

  it('clamps the rate to 1 when overbooked', () => {
    const reservations = [resv({ checkIn: '2026-06-01', checkOut: '2026-07-01' })]; // 30 nights
    const s = occupancyInRange(reservations, 1, range);
    expect(s.rate).toBe(1);
  });

  it('guards against a zero room count (denominator floors at 1 room)', () => {
    const s = occupancyInRange([], 0, range);
    expect(s.capacity).toBe(30);
    expect(s.rate).toBe(0);
  });
});

describe('salesInRange', () => {
  const range: DateRange = { start: '2026-06-01', end: '2026-07-01' };

  it('separates captured from approved-but-uncaptured revenue', () => {
    const reservations = [
      resv({
        checkIn: '2026-06-05',
        amount: 40_000,
        payment: { intentId: 'a', status: 'captured' },
      }),
      resv({
        id: 'r2',
        checkIn: '2026-06-20',
        amount: 25_000,
        status: 'approved',
        payment: { intentId: 'b', status: 'authorized' },
      }),
    ];
    const s = salesInRange(reservations, range);
    expect(s.captured).toBe(40_000);
    expect(s.upcoming).toBe(25_000);
  });

  it('buckets by check-in date: start inclusive, end exclusive', () => {
    const reservations = [
      resv({
        checkIn: '2026-06-01',
        amount: 10_000,
        payment: { intentId: 'a', status: 'captured' },
      }),
      resv({
        id: 'r2',
        checkIn: '2026-07-01',
        amount: 99_000,
        payment: { intentId: 'b', status: 'captured' },
      }),
    ];
    const s = salesInRange(reservations, range);
    expect(s.captured).toBe(10_000); // 07-01 excluded
  });

  it('ignores pending and cancelled stays for the upcoming projection', () => {
    const reservations = [
      resv({
        checkIn: '2026-06-05',
        status: 'pending',
        payment: { intentId: 'a', status: 'authorized' },
      }),
      resv({
        id: 'r2',
        checkIn: '2026-06-06',
        status: 'cancelled',
        payment: { intentId: 'b', status: 'refunded' },
      }),
    ];
    const s = salesInRange(reservations, range);
    expect(s.captured).toBe(0);
    expect(s.upcoming).toBe(0);
  });
});
