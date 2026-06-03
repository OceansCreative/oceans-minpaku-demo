import { nightsBetween, parseIsoDate, toIsoDate } from '@/lib/utils/dates';

import type { Reservation } from '@/types';
import type { IsoDate } from '@/types/common';

/**
 * Named reporting windows for the admin dashboard KPI filter. The 民泊 180-night
 * cap counter is deliberately NOT one of these — it is fiscal-year-bound by
 * 住宅宿泊事業法 §2-3 and must never be re-scoped by a UI filter.
 */
export type PeriodPreset = 'thisMonth' | 'lastMonth' | 'last30Days' | 'last90Days';

export const PERIOD_PRESETS: readonly PeriodPreset[] = [
  'thisMonth',
  'lastMonth',
  'last30Days',
  'last90Days',
];

/** A half-open `[start, end)` date window. All comparisons are UTC ISO slices. */
export interface DateRange {
  /** Inclusive start, `YYYY-MM-DD`. */
  start: IsoDate;
  /** Exclusive end, `YYYY-MM-DD`. */
  end: IsoDate;
}

/** Shift an `IsoDate` by whole days in UTC. */
function addDays(date: IsoDate, days: number): IsoDate {
  const d = parseIsoDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d);
}

/**
 * Resolve a named period to a half-open `[start, end)` UTC range, relative to
 * `ref` ("today"). Pure: the reference date is passed in rather than read from
 * the clock, so the result is deterministic and identical under every timezone
 * (this repo runs its suite under UTC / Asia-Tokyo / America-New_York).
 *
 * - `thisMonth` / `lastMonth` align to calendar-month boundaries.
 * - `last30Days` / `last90Days` are trailing windows ending at (exclusive) `ref`,
 *   so they span exactly 30 / 90 nights.
 */
export function resolvePeriod(preset: PeriodPreset, ref: IsoDate): DateRange {
  const r = parseIsoDate(ref);
  const y = r.getUTCFullYear();
  const m = r.getUTCMonth();
  switch (preset) {
    case 'thisMonth':
      return {
        start: toIsoDate(new Date(Date.UTC(y, m, 1))),
        end: toIsoDate(new Date(Date.UTC(y, m + 1, 1))),
      };
    case 'lastMonth':
      return {
        start: toIsoDate(new Date(Date.UTC(y, m - 1, 1))),
        end: toIsoDate(new Date(Date.UTC(y, m, 1))),
      };
    case 'last30Days':
      return { start: addDays(ref, -30), end: ref };
    case 'last90Days':
      return { start: addDays(ref, -90), end: ref };
  }
}

/**
 * Nights of a single `[checkIn, checkOut)` stay that fall inside `range`.
 * Clamps to the overlap; non-overlapping stays yield 0.
 */
export function nightsInRange(checkIn: IsoDate, checkOut: IsoDate, range: DateRange): number {
  const start = checkIn > range.start ? checkIn : range.start;
  const end = checkOut < range.end ? checkOut : range.end;
  return nightsBetween(start, end);
}

/** Only the reservation fields the dashboard metrics read. */
type CountableReservation = Pick<
  Reservation,
  'checkIn' | 'checkOut' | 'status' | 'amount' | 'payment'
>;

export interface OccupancySummary {
  /** Booked room-nights overlapping the range (excludes cancelled / rejected). */
  bookedNights: number;
  /** Denominator: `rooms × nights-in-range`. */
  capacity: number;
  /** `bookedNights / capacity`, clamped to `[0, 1]`. */
  rate: number;
}

/**
 * Room-night occupancy over a window: booked nights / (rooms × nights-in-range).
 * Pending stays count as committed inventory; cancelled / rejected do not.
 */
export function occupancyInRange(
  reservations: readonly CountableReservation[],
  roomCount: number,
  range: DateRange,
): OccupancySummary {
  let bookedNights = 0;
  for (const r of reservations) {
    if (r.status === 'cancelled' || r.status === 'rejected') continue;
    bookedNights += nightsInRange(r.checkIn, r.checkOut, range);
  }
  const nights = nightsBetween(range.start, range.end);
  const capacity = Math.max(1, roomCount) * nights;
  const rate = capacity === 0 ? 0 : Math.min(1, bookedNights / capacity);
  return { bookedNights, capacity, rate };
}

export interface SalesSummary {
  /** Revenue already captured (Stripe `captured`) for stays starting in range. */
  captured: number;
  /** Approved-but-not-yet-captured revenue projected for stays starting in range. */
  upcoming: number;
}

/**
 * Captured vs. projected revenue for stays whose check-in falls in `range`.
 * Bucketed by check-in date so each stay lands in exactly one window.
 */
export function salesInRange(
  reservations: readonly CountableReservation[],
  range: DateRange,
): SalesSummary {
  let captured = 0;
  let upcoming = 0;
  for (const r of reservations) {
    if (r.checkIn >= range.start && r.checkIn < range.end) {
      if (r.payment.status === 'captured') captured += r.amount;
      else if (r.status === 'approved') upcoming += r.amount;
    }
  }
  return { captured, upcoming };
}
