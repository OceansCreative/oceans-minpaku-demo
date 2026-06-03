import { describe, expect, it } from 'vitest';

import { RESERVATION_CSV_HEADER, reservationsToCsv } from '@/lib/services/export';

import type { Guest, Reservation, Room } from '@/types';

const HEADER_LINE = RESERVATION_CSV_HEADER.join(',');

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 'res-1',
    roomId: 'room-a',
    guestId: 'guest-1',
    checkIn: '2026-06-10',
    checkOut: '2026-06-13',
    checkInTime: '15:00',
    checkOutTime: '10:00',
    status: 'approved',
    source: 'direct',
    amount: 30_000,
    payment: { intentId: 'pi_1', status: 'captured' },
    createdAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'room-a',
    propertyId: 'prop-1',
    name: 'Garden Suite',
    capacity: 2,
    basePrice: 10_000,
    photos: [],
    description: '',
    ...overrides,
  };
}

function makeGuest(overrides: Partial<Guest> = {}): Guest {
  return {
    id: 'guest-1',
    name: 'Hanako Yamada',
    email: 'hanako@example.com',
    phone: '+81-90-0000-0000',
    language: 'ja',
    ...overrides,
  };
}

describe('reservationsToCsv', () => {
  it('returns just the header row for an empty list', () => {
    const csv = reservationsToCsv([], { rooms: [], guests: [] });
    expect(csv).toBe(HEADER_LINE);
  });

  it('emits the stable English header as the first line', () => {
    const csv = reservationsToCsv([makeReservation()], {
      rooms: [makeRoom()],
      guests: [makeGuest()],
    });
    const [header] = csv.split('\n');
    expect(header).toBe('Reservation ID,Room,Guest,Check-in,Check-out,Nights,Status,Total');
  });

  it('resolves room and guest names from the lookups', () => {
    const csv = reservationsToCsv([makeReservation()], {
      rooms: [makeRoom()],
      guests: [makeGuest()],
    });
    const [, row] = csv.split('\n');
    expect(row).toBe('res-1,Garden Suite,Hanako Yamada,2026-06-10,2026-06-13,3,approved,30000');
  });

  it('computes nights via the half-open interval (UTC-safe)', () => {
    const csv = reservationsToCsv(
      [makeReservation({ checkIn: '2026-06-01', checkOut: '2026-06-04' })],
      { rooms: [makeRoom()], guests: [makeGuest()] },
    );
    const [, row] = csv.split('\n');
    // 2026-06-01 -> 2026-06-04 is 3 nights, not 4 days.
    expect(row?.split(',')[5]).toBe('3');
  });

  it('counts nights correctly across a month boundary regardless of TZ', () => {
    const csv = reservationsToCsv(
      [makeReservation({ checkIn: '2026-06-28', checkOut: '2026-07-02' })],
      { rooms: [makeRoom()], guests: [makeGuest()] },
    );
    const [, row] = csv.split('\n');
    expect(row?.split(',')[5]).toBe('4');
  });

  it('falls back to empty strings when the room or guest lookup is missing', () => {
    const csv = reservationsToCsv([makeReservation({ roomId: 'nope', guestId: 'nope' })], {
      rooms: [],
      guests: [],
    });
    const [, row] = csv.split('\n');
    expect(row).toBe('res-1,,,2026-06-10,2026-06-13,3,approved,30000');
  });

  it('quotes and doubles interior quotes when a name contains a comma or quote', () => {
    const csv = reservationsToCsv([makeReservation()], {
      rooms: [makeRoom({ name: 'Suite "A", West Wing' })],
      guests: [makeGuest({ name: 'Doe, John' })],
    });
    const [, row] = csv.split('\n');
    expect(row).toBe(
      'res-1,"Suite ""A"", West Wing","Doe, John",2026-06-10,2026-06-13,3,approved,30000',
    );
  });

  it('wraps a field containing a newline in double quotes', () => {
    const csv = reservationsToCsv([makeReservation()], {
      rooms: [makeRoom({ name: 'Line1\nLine2' })],
      guests: [makeGuest()],
    });
    const lines = csv.split('\n');
    // The embedded newline splits the logical row into two physical lines,
    // but the field is quoted so a CSV parser reads it as one cell.
    expect(lines[1]).toBe('res-1,"Line1');
    expect(lines[2]).toBe('Line2",Hanako Yamada,2026-06-10,2026-06-13,3,approved,30000');
  });

  it('renders multiple rows in input order, one logical row each', () => {
    const reservations = [
      makeReservation({ id: 'res-1', amount: 30_000 }),
      makeReservation({
        id: 'res-2',
        roomId: 'room-b',
        guestId: 'guest-2',
        checkIn: '2026-07-01',
        checkOut: '2026-07-02',
        status: 'pending',
        amount: 12_500,
      }),
    ];
    const csv = reservationsToCsv(reservations, {
      rooms: [makeRoom(), makeRoom({ id: 'room-b', name: 'Loft' })],
      guests: [makeGuest(), makeGuest({ id: 'guest-2', name: 'Taro Suzuki' })],
    });
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[1]).toBe(
      'res-1,Garden Suite,Hanako Yamada,2026-06-10,2026-06-13,3,approved,30000',
    );
    expect(lines[2]).toBe('res-2,Loft,Taro Suzuki,2026-07-01,2026-07-02,1,pending,12500');
  });
});
