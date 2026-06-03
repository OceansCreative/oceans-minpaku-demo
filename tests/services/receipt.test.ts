import { describe, expect, it } from 'vitest';

import { buildReceipt, DEFAULT_TAX_RATE } from '@/lib/services/receipt';

import type { Reservation } from '@/types';

function resv(over: Partial<Reservation> = {}): Reservation {
  return {
    id: 'resv-abc123',
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

const input = { roomName: '月の間', guestName: '山田 太郎', issuedOn: '2026-06-04' as const };

describe('buildReceipt', () => {
  it('splits a tax-inclusive total into net and consumption tax', () => {
    const r = buildReceipt(resv(), input);
    // round(30000 × 0.1 / 1.1) = 2727
    expect(r.tax).toBe(2727);
    expect(r.net).toBe(27_273);
    expect(r.net + r.tax).toBe(r.total);
    expect(r.taxRate).toBe(DEFAULT_TAX_RATE);
    expect(r.total).toBe(30_000);
  });

  it('computes the per-night average from nights', () => {
    const r = buildReceipt(resv(), input); // 2 nights
    expect(r.nights).toBe(2);
    expect(r.nightlyAverage).toBe(15_000);
  });

  it('rounds the per-night average for uneven divisions', () => {
    const r = buildReceipt(resv({ amount: 31_000 }), input); // 31000 / 2
    expect(r.nightlyAverage).toBe(15_500);
  });

  it('falls back to the total as the nightly average for a same-day stay', () => {
    const r = buildReceipt(resv({ checkIn: '2026-06-10', checkOut: '2026-06-10' }), input);
    expect(r.nights).toBe(0);
    expect(r.nightlyAverage).toBe(30_000);
  });

  it('passes through a separately held deposit (0 when none)', () => {
    expect(buildReceipt(resv(), input).deposit).toBe(0);
    const withDeposit = buildReceipt(
      resv({ payment: { intentId: 'pi_1', status: 'captured', depositHeld: 20_000 } }),
      input,
    );
    expect(withDeposit.deposit).toBe(20_000);
  });

  it('honors a custom tax rate, including 0%', () => {
    const zero = buildReceipt(resv(), { ...input, taxRate: 0 });
    expect(zero.tax).toBe(0);
    expect(zero.net).toBe(30_000);
  });

  it('derives a stable receipt number from the issue date and reservation id', () => {
    const r = buildReceipt(resv(), input);
    expect(r.receiptNo).toBe('R-20260604-ABC123');
    // deterministic — same inputs, same number
    expect(buildReceipt(resv(), input).receiptNo).toBe(r.receiptNo);
  });

  it('carries the payment status and display fields through', () => {
    const r = buildReceipt(resv({ payment: { intentId: 'pi_1', status: 'refunded' } }), input);
    expect(r.paymentStatus).toBe('refunded');
    expect(r.guestName).toBe('山田 太郎');
    expect(r.roomName).toBe('月の間');
    expect(r.checkIn).toBe('2026-06-10');
    expect(r.checkOut).toBe('2026-06-12');
  });
});
