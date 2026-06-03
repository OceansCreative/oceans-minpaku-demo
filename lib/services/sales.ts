import { toCsv } from '@/lib/services/csv';

import type { Reservation } from '@/types';
import type { IsoDate } from '@/types/common';

export type SalesGranularity = 'day' | 'month' | 'year';

/** One time-bucket of revenue, split by booking source. */
export interface SalesBucket {
  /** Bucket label: `YYYY-MM-DD` (day), `YYYY-MM` (month), or `YYYY` (year). */
  key: string;
  direct: number;
  airbnb: number;
}

export interface SalesFilter {
  granularity: SalesGranularity;
  /** Inclusive lower bound on check-in date (`YYYY-MM-DD`); empty = unbounded. */
  from?: string;
  /** Inclusive upper bound on check-in date (`YYYY-MM-DD`); empty = unbounded. */
  to?: string;
}

export interface SalesTotals {
  total: number;
  direct: number;
  airbnb: number;
}

/**
 * Truncate an `IsoDate` to its bucket key. Pure string slicing — no `Date`, so
 * it is identical under every timezone (`checkIn` is already a UTC ISO date).
 */
function bucketKey(iso: IsoDate, granularity: SalesGranularity): string {
  if (granularity === 'day') return iso;
  if (granularity === 'month') return iso.slice(0, 7);
  return iso.slice(0, 4);
}

type CountableReservation = Pick<Reservation, 'checkIn' | 'status' | 'amount' | 'source'>;

/**
 * Aggregate reservation revenue into time buckets, split by source. Cancelled
 * and rejected reservations are excluded (they earned nothing). Reservations are
 * bucketed by check-in date and filtered to the inclusive `[from, to]` window
 * when those bounds are set. Buckets are returned sorted ascending by key.
 */
export function bucketSales(
  reservations: readonly CountableReservation[],
  filter: SalesFilter,
): SalesBucket[] {
  const { granularity, from, to } = filter;
  const map = new Map<string, SalesBucket>();

  for (const r of reservations) {
    if (r.status === 'cancelled' || r.status === 'rejected') continue;
    if (from && r.checkIn < from) continue;
    if (to && r.checkIn > to) continue;

    const key = bucketKey(r.checkIn, granularity);
    const bucket = map.get(key) ?? { key, direct: 0, airbnb: 0 };
    if (r.source === 'direct') bucket.direct += r.amount;
    else bucket.airbnb += r.amount;
    map.set(key, bucket);
  }

  return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
}

/** Sum a set of buckets into grand totals. */
export function salesTotals(buckets: readonly SalesBucket[]): SalesTotals {
  let direct = 0;
  let airbnb = 0;
  for (const b of buckets) {
    direct += b.direct;
    airbnb += b.airbnb;
  }
  return { total: direct + airbnb, direct, airbnb };
}

/** Stable, machine-importable English header row for the sales export. */
export const SALES_CSV_HEADER = ['Period', 'Direct', 'Airbnb', 'Total'] as const;

/**
 * Render aggregated sales buckets as a CSV string (Period, Direct, Airbnb,
 * Total). Amounts are JPY integers. An empty list returns just the header row.
 */
export function salesBucketsToCsv(buckets: readonly SalesBucket[]): string {
  const rows: string[][] = [[...SALES_CSV_HEADER]];
  for (const b of buckets) {
    rows.push([b.key, String(b.direct), String(b.airbnb), String(b.direct + b.airbnb)]);
  }
  return toCsv(rows);
}
