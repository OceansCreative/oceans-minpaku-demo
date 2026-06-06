import { describe, expect, it } from 'vitest';

import { seedPromoCodes } from '@/lib/seed/promos';
import { applyPromoCode } from '@/lib/services/promo';

describe('applyPromoCode', () => {
  it('applies percent discount correctly (WELCOME10 on 30000)', () => {
    const result = applyPromoCode('WELCOME10', 30_000, 1, seedPromoCodes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.discountAmount).toBe(3_000);
    expect(result.result.finalAmount).toBe(27_000);
    expect(result.result.code).toBe('WELCOME10');
  });

  it('applies fixed discount correctly (FLAT5000 on 20000)', () => {
    const result = applyPromoCode('FLAT5000', 20_000, 1, seedPromoCodes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.discountAmount).toBe(5_000);
    expect(result.result.finalAmount).toBe(15_000);
  });

  it('caps fixed discount at the original amount (FLAT5000 on 3000)', () => {
    const result = applyPromoCode('FLAT5000', 3_000, 1, seedPromoCodes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.discountAmount).toBe(3_000);
    expect(result.result.finalAmount).toBe(0);
  });

  it('returns NOT_FOUND for an unknown code', () => {
    const result = applyPromoCode('UNKNOWN', 20_000, 1, seedPromoCodes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('NOT_FOUND');
  });

  it('returns INACTIVE for EXPIRED code', () => {
    const result = applyPromoCode('EXPIRED', 20_000, 1, seedPromoCodes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('INACTIVE');
  });

  it('returns MIN_NIGHTS_NOT_MET when nights < minNights (STAY3, 2 nights)', () => {
    const result = applyPromoCode('STAY3', 20_000, 2, seedPromoCodes);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe('MIN_NIGHTS_NOT_MET');
  });

  it('applies STAY3 successfully when nights >= minNights (3 nights)', () => {
    const result = applyPromoCode('STAY3', 20_000, 3, seedPromoCodes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.discountAmount).toBe(1_000); // 5% of 20000
    expect(result.result.finalAmount).toBe(19_000);
  });

  it('is case-insensitive ("welcome10" matches "WELCOME10")', () => {
    const result = applyPromoCode('welcome10', 30_000, 1, seedPromoCodes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.discountAmount).toBe(3_000);
    expect(result.result.finalAmount).toBe(27_000);
  });

  it('trims whitespace from the code input', () => {
    const result = applyPromoCode('  WELCOME10  ', 10_000, 1, seedPromoCodes);
    expect(result.ok).toBe(true);
  });
});
