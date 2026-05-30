import { describe, expect, it } from 'vitest';

import { approveReservation } from '@/lib/services/reservation';

import type { MockPaymentIntent } from '@/lib/mock/stripe';
import type { Reservation } from '@/types';

function makeReservation(overrides: Partial<Reservation>): Reservation {
  return {
    id: 'r-default',
    roomId: 'room-a',
    guestId: 'g',
    checkIn: '2026-06-10',
    checkOut: '2026-06-12',
    checkInTime: '15:00',
    checkOutTime: '10:00',
    status: 'pending',
    source: 'direct',
    amount: 20_000,
    payment: { intentId: 'pi_x', status: 'authorized' },
    createdAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function intent(reservation: Reservation): MockPaymentIntent {
  return {
    id: reservation.payment.intentId,
    status: reservation.payment.status,
    amount: reservation.amount,
    metadata: {},
    createdAt: reservation.createdAt,
  };
}

describe('approveReservation overlap guard (anti-double-booking)', () => {
  it('refuses to approve when an existing approved reservation overlaps', async () => {
    const blocker = makeReservation({ id: 'r-blocker', status: 'approved' });
    const pending = makeReservation({
      id: 'r-pending',
      status: 'pending',
      checkIn: '2026-06-11',
      checkOut: '2026-06-13',
    });
    await expect(approveReservation(pending, [blocker, pending], intent(pending))).rejects.toThrow(
      /conflict/,
    );
  });

  it('refuses to approve when another pending reservation overlaps (race window)', async () => {
    const other = makeReservation({ id: 'r-other', status: 'pending' });
    const pending = makeReservation({
      id: 'r-pending',
      status: 'pending',
      checkIn: '2026-06-11',
      checkOut: '2026-06-13',
    });
    await expect(approveReservation(pending, [other, pending], intent(pending))).rejects.toThrow(
      /conflict/,
    );
  });

  it('approves when overlapping reservations are cancelled / rejected (slot is free)', async () => {
    const cancelled = makeReservation({ id: 'r-cancelled', status: 'cancelled' });
    const rejected = makeReservation({ id: 'r-rejected', status: 'rejected' });
    const pending = makeReservation({ id: 'r-pending', status: 'pending' });
    const result = await approveReservation(
      pending,
      [cancelled, rejected, pending],
      intent(pending),
    );
    expect(result.reservation.status).toBe('approved');
    expect(result.passcode.code).toMatch(/^\d{6}$/);
  });

  it('approves when there are no other reservations on the room', async () => {
    const pending = makeReservation({ id: 'r-alone', status: 'pending' });
    const result = await approveReservation(pending, [pending], intent(pending));
    expect(result.reservation.status).toBe('approved');
    expect(result.intent.status).toBe('captured');
  });
});
