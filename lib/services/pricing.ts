/**
 * Pricing service. Pure functions for dynamic-pricing math and cancellation fees.
 * Stateless: pass in rules / policy and get back numbers. No I/O, no store access.
 */

import type { CancellationPolicy, IsoDate, PricingRule } from '@/types';

// ---------- Dynamic pricing ----------

export interface PriceContext {
  /** When the booking was made — drives lead-time rules. Defaults to "now". */
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
  const checkInDate = new Date(input.checkIn);
  const checkOutDate = new Date(input.checkOut);
  const ctx = input.context ?? {};

  const rates: NightlyRate[] = [];
  const cursor = new Date(checkInDate);
  while (cursor < checkOutDate) {
    const dateIso = cursor.toISOString().slice(0, 10);
    if (!dateIso) throw new Error('calculateNightlyRates: cursor produced empty date');

    const applied = input.rules.filter((rule) =>
      ruleAppliesToNight(rule, { night: new Date(cursor), checkIn: input.checkIn, context: ctx }),
    );
    const multiplier = applied.reduce((acc, r) => acc * r.multiplier, 1);
    rates.push({
      date: dateIso,
      price: Math.round(input.basePrice * multiplier),
      appliedRules: applied.map((r) => r.id),
    });
    cursor.setDate(cursor.getDate() + 1);
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
    case 'weekday':
      return rule.condition.value.weekdays.includes(night.getDay());
    case 'weekend':
      return rule.condition.value.weekdays.includes(night.getDay());
    case 'season':
      return isInSeason(night, rule.condition.value.from, rule.condition.value.to);
    case 'leadtime': {
      const bookedAt = context.bookedAt ?? new Date();
      const checkInDate = new Date(checkIn);
      const leadDays = daysBetween(bookedAt, checkInDate);
      return leadDays <= rule.condition.value.maxDaysBefore;
    }
    case 'occupancy': {
      const monthKey = night.toISOString().slice(0, 7); // 'YYYY-MM'
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

function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((b.getTime() - a.getTime()) / MS_PER_DAY);
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
  const checkIn = new Date(`${input.checkInDate}T00:00:00.000Z`);
  const cancelDay = new Date(
    Date.UTC(
      input.cancelledAt.getUTCFullYear(),
      input.cancelledAt.getUTCMonth(),
      input.cancelledAt.getUTCDate(),
    ),
  );
  const daysRemaining = Math.floor(
    (checkIn.getTime() - cancelDay.getTime()) / (1000 * 60 * 60 * 24),
  );

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
