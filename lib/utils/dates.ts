import type { IsoDate } from '@/types';

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

/** Inclusive number of nights between two ISO dates. */
export function nightsBetween(checkIn: IsoDate, checkOut: IsoDate): number {
  const ms = parseIsoDate(checkOut).getTime() - parseIsoDate(checkIn).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}
