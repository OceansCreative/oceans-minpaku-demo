
import { seedGuests } from './guests';
import { seedRooms } from './property';

import type { Reservation } from '@/types';

/**
 * Intentionally overlapping reservation pair for the anti-double-booking demo (SPEC §13).
 *
 * Scenario:
 * - An Airbnb-sourced booking already exists for room `tsuki` on day +7 .. +9 (approved).
 * - A direct request lands for the SAME room on day +8 .. +10 (pending).
 *
 * On the admin approval screen the second one MUST surface a red conflict warning
 * and block confirm. The self-tour drives users through this exact path.
 *
 * Returned separately from `createSeedReservations` so the seam is obvious in git history
 * and we can opt out of the conflict in tests when we want a clean fixture.
 */
export function createOverlapDemoReservations(today: Date): Reservation[] {
  const room = seedRooms.find((r) => r.id === 'room-tsuki');
  if (!room) throw new Error('Expected seed room room-tsuki to exist');

  const guestExisting = seedGuests.find((g) => g.id === 'guest-smith');
  const guestRacer = seedGuests.find((g) => g.id === 'guest-yamada');
  if (!guestExisting || !guestRacer) throw new Error('Expected demo guests in seed');

  const shift = (days: number): string => {
    const next = new Date(today);
    next.setDate(next.getDate() + days);
    const iso = next.toISOString().slice(0, 10);
    if (!iso) throw new Error('shift produced empty date');
    return iso;
  };

  const issuedAt = (() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 5);
    d.setHours(9, 0, 0, 0);
    return d.toISOString();
  })();

  const existing: Reservation = {
    id: 'res-overlap-airbnb',
    roomId: room.id,
    guestId: guestExisting.id,
    checkIn: shift(7),
    checkOut: shift(9),
    checkInTime: '16:00',
    checkOutTime: '10:00',
    status: 'approved',
    source: 'airbnb',
    amount: room.basePrice * 2,
    payment: { intentId: 'pi_mock_overlap_airbnb', status: 'captured' },
    passcode: {
      code: '482915',
      validFrom: shift(7) + 'T16:00:00.000Z',
      validUntil: shift(9) + 'T10:00:00.000Z',
      issuedAt,
    },
    createdAt: issuedAt,
  };

  const racer: Reservation = {
    id: 'res-overlap-direct',
    roomId: room.id,
    guestId: guestRacer.id,
    checkIn: shift(8),
    checkOut: shift(10),
    checkInTime: '15:00',
    checkOutTime: '10:00',
    status: 'pending',
    source: 'direct',
    amount: room.basePrice * 2,
    payment: { intentId: 'pi_mock_overlap_direct', status: 'authorized' },
    createdAt: issuedAt,
  };

  return [existing, racer];
}
