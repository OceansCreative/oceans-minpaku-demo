/**
 * Reservation CSV export. Pure, side-effect-free: takes the reservation list plus
 * the room/guest lookups and returns a CSV string. The UI is responsible for
 * turning that string into a download (Blob + anchor) — this service never touches
 * the DOM, `new Date()`, or the network, so it stays trivially testable across the
 * three CI timezones.
 *
 * The header row is English and stable so the file imports cleanly into a
 * spreadsheet or downstream tool regardless of the UI locale.
 */

import { toCsv } from '@/lib/services/csv';
import { nightsBetween } from '@/lib/utils/dates';

import type { Guest, Reservation, Room } from '@/types';

/** Lookup collections used to resolve human-readable room and guest names. */
export interface ReservationCsvLookups {
  rooms: Room[];
  guests: Guest[];
}

/** Stable, machine-importable English header row. */
export const RESERVATION_CSV_HEADER = [
  'Reservation ID',
  'Room',
  'Guest',
  'Check-in',
  'Check-out',
  'Nights',
  'Status',
  'Total',
] as const;

/**
 * Render the given reservations as a CSV string.
 *
 * Columns: Reservation ID, Room, Guest, Check-in, Check-out, Nights, Status,
 * Total. Room and guest names are resolved from `lookups`; a missing lookup
 * yields an empty string rather than throwing. Nights come from `nightsBetween`
 * (UTC-safe). Total uses the reservation's stored `amount` (JPY) — pricing is not
 * recomputed here. Rows are separated by `\n`; an empty list returns just the
 * header row.
 */
export function reservationsToCsv(
  reservations: Reservation[],
  lookups: ReservationCsvLookups,
): string {
  const roomById = new Map(lookups.rooms.map((r) => [r.id, r]));
  const guestById = new Map(lookups.guests.map((g) => [g.id, g]));

  const rows: string[][] = [[...RESERVATION_CSV_HEADER]];

  for (const r of reservations) {
    const roomName = roomById.get(r.roomId)?.name ?? '';
    const guestName = guestById.get(r.guestId)?.name ?? '';
    rows.push([
      r.id,
      roomName,
      guestName,
      r.checkIn,
      r.checkOut,
      String(nightsBetween(r.checkIn, r.checkOut)),
      r.status,
      String(r.amount),
    ]);
  }

  return toCsv(rows);
}
