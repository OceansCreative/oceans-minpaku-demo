// ===== MOCK: 本番では実API（Airbnb Calendar iCal export）に差し替え =====
//
// Airbnb pushes an iCal feed that we poll. The feed refreshes roughly every
// 2–4 hours upstream — so a brand-new "Instant Book" on Airbnb may not appear
// in our calendar for a couple of hours. The admin approval gate is the final
// guard against the race window (see SPEC §13).

import type { IsoDate, IsoDateTime } from '@/types';

const LATENCY_MIN_MS = 300;
const LATENCY_MAX_MS = 800;

/** Published upstream lag for the Airbnb iCal export. Surface this in the UI. */
export const AIRBNB_ICAL_LAG_HOURS = { min: 2, max: 4 } as const;

async function simulateLatency(): Promise<void> {
  const ms = LATENCY_MIN_MS + Math.random() * (LATENCY_MAX_MS - LATENCY_MIN_MS);
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export interface MockIcalEntry {
  /** Airbnb's stable event UID (used for upsert / dedup). */
  uid: string;
  summary: string;
  start: IsoDate;
  end: IsoDate;
  /** Airbnb redacts guest names in the iCal export; populated only when known. */
  guestName?: string;
}

export interface FetchAirbnbCalendarInput {
  icalUrl: string;
  /** Anchor "now" so seed-relative dates stay deterministic in tests. */
  now?: Date;
}

export interface FetchAirbnbCalendarResult {
  entries: MockIcalEntry[];
  fetchedAt: IsoDateTime;
  /** Estimated upstream lag, surfaced as the "2〜4時間遅延" notice in the admin OTA page. */
  estimatedLagHoursMin: number;
  estimatedLagHoursMax: number;
}

/**
 * Pretend to fetch and parse the Airbnb iCal feed at `icalUrl`.
 * Returns a small set of synthetic future bookings so the "今すぐ同期" button
 * in the admin OTA page has something to import.
 */
export async function fetchAirbnbCalendar(
  input: FetchAirbnbCalendarInput,
): Promise<FetchAirbnbCalendarResult> {
  if (!input.icalUrl.startsWith('http')) {
    throw new Error('fetchAirbnbCalendar: icalUrl must be an http(s) URL');
  }
  await simulateLatency();
  const anchor = input.now ?? new Date();
  const shift = (days: number): IsoDate => {
    const d = new Date(anchor);
    d.setDate(d.getDate() + days);
    const iso = d.toISOString().slice(0, 10);
    if (!iso) throw new Error('shift produced empty date');
    return iso;
  };

  return {
    entries: [
      {
        uid: 'airbnb-evt-001',
        summary: 'Reserved (HMUVCXXXXX)',
        start: shift(5),
        end: shift(7),
        guestName: 'Airbnb Guest',
      },
      {
        uid: 'airbnb-evt-002',
        summary: 'Reserved (HMUVCXXXXX)',
        start: shift(18),
        end: shift(20),
        guestName: 'Airbnb Guest',
      },
    ],
    fetchedAt: new Date().toISOString(),
    estimatedLagHoursMin: AIRBNB_ICAL_LAG_HOURS.min,
    estimatedLagHoursMax: AIRBNB_ICAL_LAG_HOURS.max,
  };
}
