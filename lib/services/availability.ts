import { calculateNightlyRates } from '@/lib/services/pricing';
import { toIsoDate } from '@/lib/utils/dates';

import type { PricingRule, Reservation } from '@/types';
import type { IsoDate } from '@/types/common';

/** One day cell in a room's month availability grid. */
export interface AvailabilityDay {
  date: IsoDate;
  /** Booked iff a live reservation covers this night `[checkIn, checkOut)`. */
  booked: boolean;
  /** True for dates strictly before `today`. */
  past: boolean;
  /** Nightly rate from date-intrinsic pricing rules (weekend / season). */
  price: number;
}

export interface RoomMonthAvailability {
  year: number;
  /** 1–12. */
  month: number;
  /** UTC weekday of the 1st (0 = Sun … 6 = Sat) — leading blanks for a Sun-first grid. */
  firstWeekday: number;
  days: AvailabilityDay[];
}

/** Number of days in human month `month` (1–12) of `year`, UTC. */
function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Step a `{ year, month }` (month 1–12) by whole months, wrapping the year. */
export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zeroBased = month - 1 + delta;
  return {
    year: year + Math.floor(zeroBased / 12),
    month: (((zeroBased % 12) + 12) % 12) + 1,
  };
}

/**
 * Build a room's month availability + nightly-rate grid. Pure and
 * timezone-independent: `today` is passed in (never read from the clock), and
 * all date math uses UTC slices.
 *
 * Only date-intrinsic pricing rules (weekend / season) are applied — leadtime
 * and occupancy rules need a booking context that does not exist for a
 * speculative calendar cell (and leadtime would throw without `bookedAt`). This
 * mirrors the admin calendar heatmap so guest and host see consistent rates.
 */
export function buildRoomMonthAvailability(input: {
  year: number;
  /** 1–12. */
  month: number;
  roomId: string;
  basePrice: number;
  rules: PricingRule[];
  reservations: Reservation[];
  today: IsoDate;
}): RoomMonthAvailability {
  const { year, month, roomId, basePrice, rules, reservations, today } = input;

  const dateRules = rules.filter(
    (r) => r.condition.type === 'weekend' || r.condition.type === 'season',
  );

  const checkIn = toIsoDate(new Date(Date.UTC(year, month - 1, 1)));
  const checkOut = toIsoDate(new Date(Date.UTC(year, month, 1)));
  const priceByDate = new Map<string, number>();
  for (const rate of calculateNightlyRates({ basePrice, checkIn, checkOut, rules: dateRules })) {
    priceByDate.set(rate.date, rate.price);
  }

  const live = reservations.filter(
    (r) => r.roomId === roomId && r.status !== 'cancelled' && r.status !== 'rejected',
  );
  const isBooked = (date: IsoDate): boolean =>
    live.some((r) => r.checkIn <= date && date < r.checkOut);

  const n = daysInMonth(year, month);
  const days: AvailabilityDay[] = [];
  for (let day = 1; day <= n; day += 1) {
    const date = toIsoDate(new Date(Date.UTC(year, month - 1, day)));
    days.push({
      date,
      booked: isBooked(date),
      past: date < today,
      price: priceByDate.get(date) ?? basePrice,
    });
  }

  return {
    year,
    month,
    firstWeekday: new Date(Date.UTC(year, month - 1, 1)).getUTCDay(),
    days,
  };
}
