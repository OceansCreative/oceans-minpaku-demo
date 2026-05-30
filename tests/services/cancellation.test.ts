import { describe, expect, it } from 'vitest';

import { calculateCancellationFee } from '@/lib/services/pricing';

import type { CancellationPolicy } from '@/types';

const SEED_POLICY: CancellationPolicy[] = [
  { id: 'cxl-7d', daysBefore: 7, depositRate: 0 },
  { id: 'cxl-3d', daysBefore: 3, depositRate: 0.5 },
  { id: 'cxl-1d', daysBefore: 1, depositRate: 1.0 },
];

describe('calculateCancellationFee', () => {
  it('charges 0% when cancelled well outside the strictest window', () => {
    const result = calculateCancellationFee({
      amount: 24_000,
      checkInDate: '2026-06-20',
      cancelledAt: new Date('2026-06-05T00:00:00.000Z'), // 15 days out
      policy: SEED_POLICY,
    });
    expect(result.daysRemaining).toBe(15);
    expect(result.appliedStep?.id).toBe('cxl-7d');
    expect(result.feeAmount).toBe(0);
    expect(result.refundAmount).toBe(24_000);
  });

  it('charges 50% when cancelled in the mid window (3–6 days out)', () => {
    const result = calculateCancellationFee({
      amount: 24_000,
      checkInDate: '2026-06-20',
      cancelledAt: new Date('2026-06-15T00:00:00.000Z'), // 5 days out
      policy: SEED_POLICY,
    });
    expect(result.daysRemaining).toBe(5);
    expect(result.appliedStep?.id).toBe('cxl-3d');
    expect(result.feeAmount).toBe(12_000);
    expect(result.refundAmount).toBe(12_000);
  });

  it('charges 100% when cancelled within 1–2 days of check-in', () => {
    const result = calculateCancellationFee({
      amount: 24_000,
      checkInDate: '2026-06-20',
      cancelledAt: new Date('2026-06-19T00:00:00.000Z'), // 1 day out
      policy: SEED_POLICY,
    });
    expect(result.daysRemaining).toBe(1);
    expect(result.appliedStep?.id).toBe('cxl-1d');
    expect(result.feeAmount).toBe(24_000);
    expect(result.refundAmount).toBe(0);
  });

  it('falls back to the strictest step when cancelled on the day of check-in', () => {
    const result = calculateCancellationFee({
      amount: 24_000,
      checkInDate: '2026-06-20',
      cancelledAt: new Date('2026-06-20T03:00:00.000Z'), // 0 days remaining
      policy: SEED_POLICY,
    });
    expect(result.daysRemaining).toBe(0);
    expect(result.appliedStep?.id).toBe('cxl-1d');
    expect(result.feeAmount).toBe(24_000);
    expect(result.refundAmount).toBe(0);
  });

  it('honours exact threshold boundaries (>= daysBefore)', () => {
    // 7 days out should pick the 7-day step exactly, not roll down to 3-day.
    const result = calculateCancellationFee({
      amount: 10_000,
      checkInDate: '2026-06-12',
      cancelledAt: new Date('2026-06-05T00:00:00.000Z'),
      policy: SEED_POLICY,
    });
    expect(result.daysRemaining).toBe(7);
    expect(result.appliedStep?.id).toBe('cxl-7d');
    expect(result.feeAmount).toBe(0);
  });

  it('rounds the fee to the nearest yen for non-integer multipliers', () => {
    const policy: CancellationPolicy[] = [{ id: 'cxl-1d', daysBefore: 1, depositRate: 0.333 }];
    const result = calculateCancellationFee({
      amount: 10_001,
      checkInDate: '2026-06-12',
      cancelledAt: new Date('2026-06-11T00:00:00.000Z'),
      policy,
    });
    // 10001 × 0.333 = 3330.333 → 3330
    expect(result.feeAmount).toBe(3330);
    expect(result.refundAmount).toBe(10_001 - 3330);
  });

  it('returns the full amount as refund when the policy list is empty', () => {
    const result = calculateCancellationFee({
      amount: 15_000,
      checkInDate: '2026-06-20',
      cancelledAt: new Date('2026-06-10T00:00:00.000Z'),
      policy: [],
    });
    expect(result.appliedStep).toBeUndefined();
    expect(result.feeAmount).toBe(0);
    expect(result.refundAmount).toBe(15_000);
  });

  it('throws when amount is negative', () => {
    expect(() =>
      calculateCancellationFee({
        amount: -1,
        checkInDate: '2026-06-20',
        cancelledAt: new Date('2026-06-10T00:00:00.000Z'),
        policy: SEED_POLICY,
      }),
    ).toThrow(/non-negative/);
  });
});
