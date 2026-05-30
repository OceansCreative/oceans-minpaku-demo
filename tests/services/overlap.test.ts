import { describe, expect, it } from 'vitest';

import { detectOverlap } from '@/lib/services/reservation';

import type { Reservation, ReservationStatus } from '@/types';

function makeReservation(overrides: Partial<Reservation>): Reservation {
  return {
    id: 'r1',
    roomId: 'room-a',
    guestId: 'g1',
    checkIn: '2026-06-10',
    checkOut: '2026-06-12',
    checkInTime: '15:00',
    checkOutTime: '10:00',
    status: 'approved',
    source: 'direct',
    amount: 20_000,
    payment: { intentId: 'pi_1', status: 'captured' },
    createdAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('detectOverlap', () => {
  it('flags an exact-date duplicate on the same room', () => {
    const existing = [makeReservation({ id: 'r1' })];
    const conflicts = detectOverlap(existing, {
      roomId: 'room-a',
      checkIn: '2026-06-10',
      checkOut: '2026-06-12',
    });
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.id).toBe('r1');
  });

  it('flags a partial overlap that starts inside an existing stay', () => {
    const existing = [makeReservation({ id: 'r1' })];
    const conflicts = detectOverlap(existing, {
      roomId: 'room-a',
      checkIn: '2026-06-11',
      checkOut: '2026-06-13',
    });
    expect(conflicts).toHaveLength(1);
  });

  it('flags a partial overlap that ends inside an existing stay', () => {
    const existing = [makeReservation({ id: 'r1' })];
    const conflicts = detectOverlap(existing, {
      roomId: 'room-a',
      checkIn: '2026-06-09',
      checkOut: '2026-06-11',
    });
    expect(conflicts).toHaveLength(1);
  });

  it('flags a stay fully contained within the candidate window', () => {
    const existing = [makeReservation({ id: 'r1' })];
    const conflicts = detectOverlap(existing, {
      roomId: 'room-a',
      checkIn: '2026-06-09',
      checkOut: '2026-06-13',
    });
    expect(conflicts).toHaveLength(1);
  });

  it('treats checkOut day as free for the next guest (adjacent stays do not conflict)', () => {
    const existing = [makeReservation({ id: 'r1', checkIn: '2026-06-08', checkOut: '2026-06-10' })];
    const conflicts = detectOverlap(existing, {
      roomId: 'room-a',
      checkIn: '2026-06-10', // starts the day the previous stay checks out
      checkOut: '2026-06-12',
    });
    expect(conflicts).toHaveLength(0);
  });

  it('does not flag a different room', () => {
    const existing = [makeReservation({ id: 'r1', roomId: 'room-a' })];
    const conflicts = detectOverlap(existing, {
      roomId: 'room-b',
      checkIn: '2026-06-10',
      checkOut: '2026-06-12',
    });
    expect(conflicts).toHaveLength(0);
  });

  it.each<ReservationStatus>(['cancelled', 'rejected'])(
    'ignores reservations in `%s` status (they free the slot)',
    (status) => {
      const existing = [makeReservation({ id: 'r1', status })];
      const conflicts = detectOverlap(existing, {
        roomId: 'room-a',
        checkIn: '2026-06-10',
        checkOut: '2026-06-12',
      });
      expect(conflicts).toHaveLength(0);
    },
  );

  it('still flags conflicts with `pending` reservations (host could still approve them)', () => {
    const existing = [makeReservation({ id: 'r1', status: 'pending' })];
    const conflicts = detectOverlap(existing, {
      roomId: 'room-a',
      checkIn: '2026-06-10',
      checkOut: '2026-06-12',
    });
    expect(conflicts).toHaveLength(1);
  });

  it('does not self-overlap when revalidating an existing reservation via ignoreId', () => {
    const existing = [makeReservation({ id: 'r1' })];
    const conflicts = detectOverlap(existing, {
      roomId: 'room-a',
      checkIn: '2026-06-10',
      checkOut: '2026-06-12',
      ignoreId: 'r1',
    });
    expect(conflicts).toHaveLength(0);
  });

  it('returns every conflicting reservation, not just the first', () => {
    const existing = [
      makeReservation({ id: 'r1', checkIn: '2026-06-09', checkOut: '2026-06-11' }),
      makeReservation({ id: 'r2', checkIn: '2026-06-11', checkOut: '2026-06-13' }),
    ];
    const conflicts = detectOverlap(existing, {
      roomId: 'room-a',
      checkIn: '2026-06-10',
      checkOut: '2026-06-12',
    });
    expect(conflicts.map((r) => r.id).sort()).toEqual(['r1', 'r2']);
  });

  it('throws when checkOut is not after checkIn (caller bug guard)', () => {
    expect(() =>
      detectOverlap([], {
        roomId: 'room-a',
        checkIn: '2026-06-12',
        checkOut: '2026-06-12',
      }),
    ).toThrow(/checkOut/);
  });
});
