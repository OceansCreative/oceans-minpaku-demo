import { describe, expect, it } from 'vitest';

import { buildNotificationsFromReservations } from '@/lib/services/notifications';

import type { Reservation } from '@/types';

const TODAY = '2026-06-07';

function makeReservation(overrides: Partial<Reservation> & { id: string }): Reservation {
  return {
    roomId: 'room-tsuki',
    guestId: 'guest-001',
    checkIn: '2026-06-10',
    checkOut: '2026-06-12',
    checkInTime: '15:00',
    checkOutTime: '10:00',
    status: 'pending',
    source: 'direct',
    amount: 30000,
    payment: { intentId: 'pi_mock_test', status: 'authorized' },
    createdAt: '2026-06-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('buildNotificationsFromReservations', () => {
  it('returns [] for an empty array', () => {
    expect(buildNotificationsFromReservations([], TODAY)).toEqual([]);
  });

  it('returns new_reservation for a pending reservation', () => {
    const r = makeReservation({ id: 'res-001', status: 'pending' });
    const notifs = buildNotificationsFromReservations([r], TODAY);
    expect(notifs).toHaveLength(1);
    expect(notifs[0]?.kind).toBe('new_reservation');
    expect(notifs[0]?.reservationId).toBe('res-001');
    expect(notifs[0]?.id).toBe('notif-res-001-new_reservation');
  });

  it('returns cancellation for a cancelled reservation', () => {
    const r = makeReservation({ id: 'res-002', status: 'cancelled' });
    const notifs = buildNotificationsFromReservations([r], TODAY);
    expect(notifs).toHaveLength(1);
    expect(notifs[0]?.kind).toBe('cancellation');
    expect(notifs[0]?.id).toBe('notif-res-002-cancellation');
  });

  it('returns checkin_today when checkIn matches today for an approved reservation', () => {
    const r = makeReservation({
      id: 'res-003',
      status: 'approved',
      checkIn: TODAY,
      checkOut: '2026-06-09',
    });
    const notifs = buildNotificationsFromReservations([r], TODAY);
    const checkin = notifs.find((n) => n.kind === 'checkin_today');
    expect(checkin).toBeDefined();
    expect(checkin?.id).toBe('notif-res-003-checkin_today');
  });

  it('returns checkout_today when checkOut matches today for an approved reservation', () => {
    const r = makeReservation({
      id: 'res-004',
      status: 'approved',
      checkIn: '2026-06-05',
      checkOut: TODAY,
    });
    const notifs = buildNotificationsFromReservations([r], TODAY);
    const checkout = notifs.find((n) => n.kind === 'checkout_today');
    expect(checkout).toBeDefined();
    expect(checkout?.id).toBe('notif-res-004-checkout_today');
  });

  it('does not produce checkin/checkout for non-approved reservations', () => {
    const pending = makeReservation({
      id: 'res-005',
      status: 'pending',
      checkIn: TODAY,
      checkOut: '2026-06-09',
    });
    const notifs = buildNotificationsFromReservations([pending], TODAY);
    // should only have new_reservation, not checkin_today
    expect(notifs.every((n) => n.kind === 'new_reservation')).toBe(true);
  });

  it('produces both checkin_today and checkout_today if the same reservation qualifies for both (impossible but guard)', () => {
    // checkin and checkout on same day is a weird edge case — the service should still produce both
    const r = makeReservation({
      id: 'res-006',
      status: 'approved',
      checkIn: TODAY,
      checkOut: TODAY,
    });
    const notifs = buildNotificationsFromReservations([r], TODAY);
    const kinds = notifs.map((n) => n.kind).sort();
    expect(kinds).toContain('checkin_today');
    expect(kinds).toContain('checkout_today');
  });

  it('produces multiple notifications from different reservations', () => {
    const reservations: Reservation[] = [
      makeReservation({ id: 'res-010', status: 'pending' }),
      makeReservation({ id: 'res-011', status: 'cancelled' }),
      makeReservation({
        id: 'res-012',
        status: 'approved',
        checkIn: TODAY,
        checkOut: '2026-06-09',
      }),
    ];
    const notifs = buildNotificationsFromReservations(reservations, TODAY);
    expect(notifs.length).toBeGreaterThanOrEqual(3);
    const kinds = notifs.map((n) => n.kind);
    expect(kinds).toContain('new_reservation');
    expect(kinds).toContain('cancellation');
    expect(kinds).toContain('checkin_today');
  });

  it('sorts results by createdAt descending', () => {
    const reservations: Reservation[] = [
      makeReservation({ id: 'res-020', status: 'pending', createdAt: '2026-05-01T10:00:00.000Z' }),
      makeReservation({ id: 'res-021', status: 'pending', createdAt: '2026-06-01T10:00:00.000Z' }),
      makeReservation({
        id: 'res-022',
        status: 'cancelled',
        createdAt: '2026-04-01T10:00:00.000Z',
      }),
    ];
    const notifs = buildNotificationsFromReservations(reservations, TODAY);
    const dates = notifs.map((n) => n.createdAt);
    for (let i = 0; i < dates.length - 1; i++) {
      const a = dates[i];
      const b = dates[i + 1];
      if (a !== undefined && b !== undefined) {
        expect(a >= b).toBe(true);
      }
    }
  });

  it('all returned notifications have read: false', () => {
    const r = makeReservation({ id: 'res-030', status: 'pending' });
    const notifs = buildNotificationsFromReservations([r], TODAY);
    expect(notifs.every((n) => n.read === false)).toBe(true);
  });
});
