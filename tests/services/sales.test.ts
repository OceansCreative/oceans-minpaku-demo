import { describe, expect, it } from 'vitest';

import {
  bucketSales,
  SALES_CSV_HEADER,
  salesBucketsToCsv,
  salesTotals,
} from '@/lib/services/sales';

import type { Reservation } from '@/types';

function resv(over: Partial<Reservation> = {}): Reservation {
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
    payment: { intentId: 'pi_1', status: 'captured' },
    createdAt: '2026-06-01T00:00:00+09:00',
    ...over,
  };
}

describe('bucketSales', () => {
  it('groups by month and splits revenue by source', () => {
    const buckets = bucketSales(
      [
        resv({ checkIn: '2026-06-05', source: 'direct', amount: 10_000 }),
        resv({ id: 'r2', checkIn: '2026-06-20', source: 'airbnb', amount: 25_000 }),
        resv({ id: 'r3', checkIn: '2026-07-02', source: 'direct', amount: 40_000 }),
      ],
      { granularity: 'month' },
    );
    expect(buckets).toEqual([
      { key: '2026-06', direct: 10_000, airbnb: 25_000 },
      { key: '2026-07', direct: 40_000, airbnb: 0 },
    ]);
  });

  it('buckets by day and by year via ISO slicing', () => {
    const rows = [
      resv({ checkIn: '2026-06-10', amount: 1_000 }),
      resv({ id: 'r2', checkIn: '2027-01-01', amount: 2_000 }),
    ];
    expect(bucketSales(rows, { granularity: 'day' }).map((b) => b.key)).toEqual([
      '2026-06-10',
      '2027-01-01',
    ]);
    expect(bucketSales(rows, { granularity: 'year' }).map((b) => b.key)).toEqual(['2026', '2027']);
  });

  it('excludes cancelled and rejected reservations', () => {
    const buckets = bucketSales(
      [
        resv({ status: 'cancelled', amount: 99_000 }),
        resv({ id: 'r2', status: 'rejected', amount: 88_000 }),
        resv({ id: 'r3', status: 'pending', amount: 5_000 }),
      ],
      { granularity: 'month' },
    );
    expect(buckets).toEqual([{ key: '2026-06', direct: 5_000, airbnb: 0 }]);
  });

  it('filters to the inclusive [from, to] check-in window', () => {
    const rows = [
      resv({ checkIn: '2026-05-31', amount: 1_000 }),
      resv({ id: 'r2', checkIn: '2026-06-01', amount: 2_000 }),
      resv({ id: 'r3', checkIn: '2026-06-30', amount: 3_000 }),
      resv({ id: 'r4', checkIn: '2026-07-01', amount: 4_000 }),
    ];
    const buckets = bucketSales(rows, {
      granularity: 'day',
      from: '2026-06-01',
      to: '2026-06-30',
    });
    expect(buckets.map((b) => b.key)).toEqual(['2026-06-01', '2026-06-30']);
  });

  it('returns buckets sorted ascending by key', () => {
    const buckets = bucketSales(
      [
        resv({ checkIn: '2026-08-01', amount: 1 }),
        resv({ id: 'r2', checkIn: '2026-02-01', amount: 1 }),
        resv({ id: 'r3', checkIn: '2026-05-01', amount: 1 }),
      ],
      { granularity: 'month' },
    );
    expect(buckets.map((b) => b.key)).toEqual(['2026-02', '2026-05', '2026-08']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(bucketSales([], { granularity: 'month' })).toEqual([]);
  });
});

describe('salesTotals', () => {
  it('sums direct, airbnb, and grand total', () => {
    const totals = salesTotals([
      { key: '2026-06', direct: 10_000, airbnb: 25_000 },
      { key: '2026-07', direct: 40_000, airbnb: 0 },
    ]);
    expect(totals).toEqual({ total: 75_000, direct: 50_000, airbnb: 25_000 });
  });

  it('is zero for no buckets', () => {
    expect(salesTotals([])).toEqual({ total: 0, direct: 0, airbnb: 0 });
  });
});

describe('salesBucketsToCsv', () => {
  it('emits a stable header and a row per bucket with a computed total', () => {
    const csv = salesBucketsToCsv([
      { key: '2026-06', direct: 10_000, airbnb: 25_000 },
      { key: '2026-07', direct: 40_000, airbnb: 0 },
    ]);
    expect(csv).toBe(
      [SALES_CSV_HEADER.join(','), '2026-06,10000,25000,35000', '2026-07,40000,0,40000'].join('\n'),
    );
  });

  it('returns just the header row for an empty bucket list', () => {
    expect(salesBucketsToCsv([])).toBe(SALES_CSV_HEADER.join(','));
  });
});
