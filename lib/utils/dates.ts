import type { HHmm, IsoDate, IsoDateTime } from '@/types';

/**
 * Timezone of the demo property (和庵 山陰 is in JST).
 *
 * Wall-clock times entered by the host or guest are interpreted in this zone.
 * When in doubt, **all wall-clock-bearing serializations go through
 * `joinPropertyDateTime`** rather than appending a hard-coded `Z`.
 */
export const PROPERTY_TZ_OFFSET = '+09:00';

/** Convert a `Date` to `YYYY-MM-DD` (UTC slice). */
export function toIsoDate(d: Date): IsoDate {
  const iso = d.toISOString().slice(0, 10);
  if (!iso) throw new Error('toIsoDate produced empty string');
  return iso;
}

/** Parse `YYYY-MM-DD` as midnight UTC. */
export function parseIsoDate(s: IsoDate): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

/**
 * Half-open number of nights between `[checkIn, checkOut)` — i.e. the count of
 * stay nights, not days. `2026-06-01 → 2026-06-04` is 3 nights. Negative spans
 * clamp to 0.
 */
export function nightsBetween(checkIn: IsoDate, checkOut: IsoDate): number {
  const ms = parseIsoDate(checkOut).getTime() - parseIsoDate(checkIn).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Combine an `IsoDate` + `HHmm` wall-clock time into a full ISO-8601 timestamp,
 * anchored to the property's timezone (`PROPERTY_TZ_OFFSET`).
 *
 * Example: `joinPropertyDateTime('2026-06-12', '15:00')`
 *   → `'2026-06-12T15:00:00+09:00'` — i.e. JST 15:00, not UTC 15:00.
 *
 * This used to be done inline as `${date}T${time}:00.000Z` in
 * `approveReservation` and the seed, which made check-in at JST 15:00 serialize
 * to UTC 15:00 = JST 24:00 — the passcode would have come alive 9 hours late.
 */
export function joinPropertyDateTime(date: IsoDate, time: HHmm): IsoDateTime {
  if (!/^\d{2}:\d{2}$/.test(time)) {
    throw new Error(`joinPropertyDateTime: time must be HH:mm, got "${time}"`);
  }
  return `${date}T${time}:00${PROPERTY_TZ_OFFSET}`;
}
