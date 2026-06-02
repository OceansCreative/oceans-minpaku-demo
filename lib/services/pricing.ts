/**
 * Pricing service. Pure functions for dynamic-pricing math and cancellation fees.
 * Stateless: pass in rules / policy and get back numbers. No I/O, no store access.
 *
 * All day/month arithmetic is performed in UTC so the result is independent of the
 * runtime's `TZ`. This is critical for a property in JST whose CI runs in UTC and
 * whose contributors may be anywhere.
 */

import { parseIsoDate, toIsoDate } from '@/lib/utils/dates';

import type { CancellationPolicy, IsoDate, PricingRule } from '@/types';

// ---------- Dynamic pricing ----------

export interface PriceContext {
  /**
   * When the booking was made — drives lead-time rules. Required whenever a
   * `leadtime` rule is present; there is no "now" fallback so pricing stays
   * deterministic and TZ-independent.
   */
  bookedAt?: Date;
  /** Month-of-stay occupancy as `YYYY-MM` → 0..1, drives occupancy rules. */
  monthlyOccupancy?: Record<string, number>;
}

export interface NightlyRate {
  date: IsoDate;
  price: number;
  appliedRules: string[];
}

export interface StayPriceQuote {
  total: number;
  nights: number;
  rates: NightlyRate[];
}

/**
 * Compute the per-night rate for every night in `[checkIn, checkOut)`.
 * Multiple matching rules compound (multiplier_1 * multiplier_2 * ...).
 * The result is rounded to the nearest yen.
 */
export function calculateNightlyRates(input: {
  basePrice: number;
  checkIn: IsoDate;
  checkOut: IsoDate;
  rules: PricingRule[];
  context?: PriceContext;
}): NightlyRate[] {
  if (input.checkOut <= input.checkIn) {
    throw new Error('calculateNightlyRates: checkOut must be after checkIn');
  }
  const checkInDate = parseIsoDate(input.checkIn);
  const checkOutDate = parseIsoDate(input.checkOut);
  const ctx = input.context ?? {};

  const rates: NightlyRate[] = [];
  const cursor = new Date(checkInDate);
  while (cursor < checkOutDate) {
    const dateIso = toIsoDate(cursor);

    const applied = input.rules.filter((rule) =>
      ruleAppliesToNight(rule, { night: new Date(cursor), checkIn: input.checkIn, context: ctx }),
    );
    const multiplier = applied.reduce((acc, r) => acc * r.multiplier, 1);
    rates.push({
      date: dateIso,
      price: Math.round(input.basePrice * multiplier),
      appliedRules: applied.map((r) => r.id),
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return rates;
}

export function calculateStayTotal(input: {
  basePrice: number;
  checkIn: IsoDate;
  checkOut: IsoDate;
  rules: PricingRule[];
  context?: PriceContext;
}): StayPriceQuote {
  const rates = calculateNightlyRates(input);
  return {
    rates,
    nights: rates.length,
    total: rates.reduce((acc, r) => acc + r.price, 0),
  };
}

function ruleAppliesToNight(
  rule: PricingRule,
  { night, checkIn, context }: { night: Date; checkIn: IsoDate; context: PriceContext },
): boolean {
  switch (rule.condition.type) {
    case 'weekend':
      // UTC weekday so the result is TZ-independent (CI runs in UTC, the
      // property is in JST; weekdays here are interpreted as the stay's *date*,
      // not the runtime's localtime).
      return rule.condition.value.weekdays.includes(night.getUTCDay());
    case 'season':
      return isInSeason(night, rule.condition.value.from, rule.condition.value.to);
    case 'leadtime': {
      if (!context.bookedAt) {
        throw new Error(
          'ruleAppliesToNight: a leadtime rule requires context.bookedAt (no "now" fallback)',
        );
      }
      const checkInDate = parseIsoDate(checkIn);
      const leadDays = daysBetween(context.bookedAt, checkInDate);
      return leadDays <= rule.condition.value.maxDaysBefore;
    }
    case 'occupancy': {
      const monthKey = toIsoDate(night).slice(0, 7); // 'YYYY-MM'
      const occ = context.monthlyOccupancy?.[monthKey];
      if (occ === undefined) return false;
      return occ >= rule.condition.value.minOccupancyRate;
    }
    default: {
      // Exhaustiveness check — adding a new rule type fails the build here.
      const _exhaustive: never = rule.condition;
      return _exhaustive;
    }
  }
}

function isInSeason(night: Date, fromMmDd: string, toMmDd: string): boolean {
  const mmDd = `${String(night.getUTCMonth() + 1).padStart(2, '0')}-${String(night.getUTCDate()).padStart(2, '0')}`;
  if (fromMmDd <= toMmDd) {
    return mmDd >= fromMmDd && mmDd <= toMmDd;
  }
  // Wraps the year boundary (e.g. 12-29 .. 01-03).
  return mmDd >= fromMmDd || mmDd <= toMmDd;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Floor a `Date` to UTC midnight, dropping any wall-clock time component. */
function floorToUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Whole UTC calendar days between `a` and `b` (`b - a`). Both inputs are floored
 * to UTC midnight first, so a time component on either side can never push the
 * lead-time count off by one.
 */
function daysBetween(a: Date, b: Date): number {
  return Math.round((floorToUtcDay(b).getTime() - floorToUtcDay(a).getTime()) / MS_PER_DAY);
}

// ---------- Cancellation fee ----------

export interface CancellationFeeResult {
  /** Days remaining between cancellation and check-in. Negative for after check-in. */
  daysRemaining: number;
  /** Step that drove the fee (undefined if policy is empty). */
  appliedStep?: CancellationPolicy;
  /** Fee retained as the cancellation charge (JPY, integer). */
  feeAmount: number;
  /** Amount actually refunded to the guest (JPY, integer). */
  refundAmount: number;
}

/**
 * Pick the policy step that applies and compute the fee + refund.
 *
 * Semantics (matches the SPEC seed `[7d→0, 3d→0.5, 1d→1.0]`):
 * - Sort steps by `daysBefore` descending.
 * - The first step whose `daysBefore` is ≤ `daysRemaining` wins.
 * - If no step matches (cancellation is after every threshold), the strictest
 *   step (smallest `daysBefore`) applies — usually 100% fee.
 *
 * Examples on the seed policy:
 * - 10 days out → 7d step → 0% fee
 * - 5 days out  → 3d step → 50% fee
 * - 2 days out  → 1d step → 100% fee
 * - 0 days out  → 1d step → 100% fee (fallback)
 */
export function calculateCancellationFee(input: {
  amount: number;
  checkInDate: IsoDate;
  cancelledAt: Date;
  policy: CancellationPolicy[];
}): CancellationFeeResult {
  if (input.amount < 0) {
    throw new Error('calculateCancellationFee: amount must be non-negative');
  }
  const checkIn = parseIsoDate(input.checkInDate);
  // Same convention as the lead-time rule: floor both sides to UTC midnight
  // before differencing so a time component on cancelledAt can't shift the count.
  const daysRemaining = daysBetween(input.cancelledAt, checkIn);

  if (input.policy.length === 0) {
    return { daysRemaining, feeAmount: 0, refundAmount: input.amount };
  }

  const sortedDesc = [...input.policy].sort((a, b) => b.daysBefore - a.daysBefore);
  const matched = sortedDesc.find((p) => daysRemaining >= p.daysBefore);
  const strictest = [...input.policy].sort((a, b) => a.daysBefore - b.daysBefore)[0];
  const step = matched ?? strictest;
  if (!step) {
    return { daysRemaining, feeAmount: 0, refundAmount: input.amount };
  }

  const feeAmount = Math.round(input.amount * step.depositRate);
  return {
    daysRemaining,
    appliedStep: step,
    feeAmount,
    refundAmount: input.amount - feeAmount,
  };
}
