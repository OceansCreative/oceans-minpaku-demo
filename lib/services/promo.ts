/**
 * Promo code service. Pure functions — no store access, no I/O.
 *
 * Apply a promo code against a booking total and return the discount
 * breakdown, or an error discriminant if the code cannot be applied.
 */
import type { PromoCode } from '@/lib/seed/promos';

export interface PromoResult {
  code: string;
  discountAmount: number; // JPY, integer (rounded)
  finalAmount: number; // originalAmount - discountAmount (floor at 0)
  promoCode: PromoCode;
}

export type PromoError = 'NOT_FOUND' | 'INACTIVE' | 'MIN_NIGHTS_NOT_MET';

/**
 * Validate and apply a promo code.
 *
 * - Code lookup is case-insensitive (normalised to uppercase).
 * - Returns `NOT_FOUND` when no code matches.
 * - Returns `INACTIVE` when the code exists but `active === false`.
 * - Returns `MIN_NIGHTS_NOT_MET` when `promo.minNights` is set and
 *   `nights < promo.minNights`.
 * - `percent` discount: `Math.round(originalAmount * value / 100)`.
 * - `fixed` discount: capped at `originalAmount` so `finalAmount >= 0`.
 */
export function applyPromoCode(
  code: string,
  originalAmount: number,
  nights: number,
  promoCodes: PromoCode[],
): { ok: true; result: PromoResult } | { ok: false; error: PromoError } {
  const normalized = code.trim().toUpperCase();

  const promo = promoCodes.find((p) => p.code.toUpperCase() === normalized);
  if (!promo) return { ok: false, error: 'NOT_FOUND' };

  if (!promo.active) return { ok: false, error: 'INACTIVE' };

  if (promo.minNights !== undefined && nights < promo.minNights) {
    return { ok: false, error: 'MIN_NIGHTS_NOT_MET' };
  }

  const discountAmount =
    promo.type === 'percent'
      ? Math.round((originalAmount * promo.value) / 100)
      : Math.min(promo.value, originalAmount);

  const finalAmount = Math.max(0, originalAmount - discountAmount);

  return {
    ok: true,
    result: {
      code: promo.code,
      discountAmount,
      finalAmount,
      promoCode: promo,
    },
  };
}
