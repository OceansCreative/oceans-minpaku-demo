
import { seedGuests } from './guests';
import { seedParkingSlots, seedRooms } from './property';

import type { IsoDate, IsoDateTime, Reservation } from '@/types';

/** Shift `date` by `days` (positive = future) and return as `YYYY-MM-DD`. */
function shiftDate(date: Date, days: number): IsoDate {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  const result = next.toISOString().slice(0, 10);
  if (!result) {
    throw new Error('shiftDate produced an empty string');
  }
  return result;
}

function isoDateTime(date: Date, days: number, hour: number): IsoDateTime {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(hour, 0, 0, 0);
  return next.toISOString();
}

/**
 * Build the demo reservation set relative to `today`.
 *
 * Mix per SPEC §9:
 * - direct and airbnb sources interleaved
 * - past and future ~1–2 months
 * - a handful of `pending` requests awaiting host approval
 *
 * NOTE: an intentionally overlapping reservation is appended in a separate seed file
 * (see `overlapping.ts`) so the anti-double-booking demo is easy to find in git history.
 */
export function createSeedReservations(today: Date): Reservation[] {
  const room = (i: number): string => {
    const r = seedRooms[i % seedRooms.length];
    if (!r) throw new Error(`No seed room at index ${i}`);
    return r.id;
  };
  const parking = (i: number): string => {
    const p = seedParkingSlots[i % seedParkingSlots.length];
    if (!p) throw new Error(`No seed parking slot at index ${i}`);
    return p.id;
  };
  const guest = (i: number): string => {
    const g = seedGuests[i % seedGuests.length];
    if (!g) throw new Error(`No seed guest at index ${i}`);
    return g.id;
  };

  // [offsetFromToday(days), nights, source, status, roomIdx, guestIdx]
  const plan: Array<{
    offset: number;
    nights: number;
    source: 'direct' | 'airbnb';
    status: 'approved' | 'pending' | 'cancelled';
    roomIdx: number;
    guestIdx: number;
  }> = [
    { offset: -42, nights: 2, source: 'direct', status: 'approved', roomIdx: 0, guestIdx: 0 },
    { offset: -35, nights: 3, source: 'airbnb', status: 'approved', roomIdx: 1, guestIdx: 1 },
    { offset: -28, nights: 1, source: 'direct', status: 'cancelled', roomIdx: 2, guestIdx: 2 },
    { offset: -21, nights: 2, source: 'airbnb', status: 'approved', roomIdx: 3, guestIdx: 3 },
    { offset: -14, nights: 3, source: 'direct', status: 'approved', roomIdx: 0, guestIdx: 4 },
    { offset: -7, nights: 2, source: 'airbnb', status: 'approved', roomIdx: 1, guestIdx: 5 },
    { offset: 3, nights: 2, source: 'direct', status: 'pending', roomIdx: 2, guestIdx: 0 },
    { offset: 7, nights: 3, source: 'direct', status: 'approved', roomIdx: 3, guestIdx: 1 },
    { offset: 10, nights: 1, source: 'airbnb', status: 'pending', roomIdx: 0, guestIdx: 2 },
    { offset: 14, nights: 2, source: 'direct', status: 'approved', roomIdx: 1, guestIdx: 3 },
    { offset: 21, nights: 4, source: 'airbnb', status: 'approved', roomIdx: 2, guestIdx: 4 },
    { offset: 28, nights: 2, source: 'direct', status: 'pending', roomIdx: 3, guestIdx: 5 },
    { offset: 35, nights: 3, source: 'direct', status: 'approved', roomIdx: 0, guestIdx: 0 },
    { offset: 45, nights: 2, source: 'airbnb', status: 'approved', roomIdx: 1, guestIdx: 1 },
  ];

  return plan.map((p, i): Reservation => {
    const roomId = room(p.roomIdx);
    const seedRoom = seedRooms.find((r) => r.id === roomId);
    if (!seedRoom) throw new Error(`Room ${roomId} not found in seed`);
    const amount = seedRoom.basePrice * p.nights;
    const checkIn = shiftDate(today, p.offset);
    const checkOut = shiftDate(today, p.offset + p.nights);
    const createdAt = isoDateTime(today, p.offset - 21, 10);

    return {
      id: `res-${String(i + 1).padStart(3, '0')}`,
      roomId,
      parkingSlotId: i % 3 === 0 ? parking(i) : undefined,
      guestId: guest(p.guestIdx),
      checkIn,
      checkOut,
      checkInTime: '15:00',
      checkOutTime: '10:00',
      status: p.status === 'cancelled' ? 'cancelled' : p.status,
      source: p.source,
      amount,
      payment: {
        intentId: `pi_mock_${i + 1}`,
        status:
          p.status === 'approved'
            ? 'captured'
            : p.status === 'cancelled'
              ? 'refunded'
              : 'authorized',
      },
      passcode:
        p.status === 'approved' && p.offset >= -7
          ? {
              code: String(100000 + ((i * 7919) % 900000)),
              validFrom: isoDateTime(today, p.offset, 15),
              validUntil: isoDateTime(today, p.offset + p.nights, 10),
              issuedAt: isoDateTime(today, p.offset - 1, 9),
            }
          : undefined,
      createdAt,
    };
  });
}
