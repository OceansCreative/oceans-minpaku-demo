import { toCsv } from '@/lib/services/csv';
import { parseIsoDate, toIsoDate } from '@/lib/utils/dates';

import type { Guest, GuestRegister, Reservation } from '@/types';
import type { IsoDate } from '@/types/common';

/**
 * 住宅宿泊事業法 §14 periodic report (定期報告). A host must report to the
 * authority every two months (by the 15th of each even month) the nights the
 * dwelling was used, the number of guests, the person-nights (延べ宿泊者数), and
 * the person-nights broken down by nationality. This module aggregates the demo
 * reservations + 宿泊者名簿 into those figures — pure and timezone-independent.
 */

export interface ReportPeriod {
  /** Inclusive start, `YYYY-MM-DD`. */
  start: IsoDate;
  /** Exclusive end, `YYYY-MM-DD`. */
  end: IsoDate;
}

export interface StatutoryPeriod extends ReportPeriod {
  /** Filing deadline — the 15th of the (even) reporting month. */
  deadline: IsoDate;
}

export interface NationalityNights {
  /** ISO 3166-1 alpha-2 code, or `UNKNOWN` when not recorded. */
  nationality: string;
  guestNights: number;
}

export interface MinpakuPeriodReport {
  period: ReportPeriod;
  /** Distinct nights the dwelling hosted at least one stay (届出住宅の宿泊提供日数). */
  nightsOperated: number;
  /** Number of stayers (persons) whose stay touched the period (宿泊者数). */
  guestCount: number;
  /** Person-nights within the period (延べ宿泊者数). */
  guestNights: number;
  /** Person-nights split by nationality, sorted by nights desc then code asc. */
  byNationality: NationalityNights[];
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function normalizeNationality(value: string | undefined): string {
  const trimmed = value?.trim().toUpperCase();
  return trimmed && trimmed.length > 0 ? trimmed : 'UNKNOWN';
}

/** The inclusive last day of a half-open period (for display: `end` − 1 day). */
export function inclusiveEndDate(period: ReportPeriod): IsoDate {
  const d = parseIsoDate(period.end);
  d.setUTCDate(d.getUTCDate() - 1);
  return toIsoDate(d);
}

/**
 * The six statutory two-month reporting periods whose filing deadlines fall in
 * `year` (even months Feb…Dec, each due on the 15th). The February period spans
 * the previous December–January, so its start is in `year − 1`.
 */
export function statutoryReportPeriods(year: number): StatutoryPeriod[] {
  const periods: StatutoryPeriod[] = [];
  for (const evenMonth of [2, 4, 6, 8, 10, 12]) {
    periods.push({
      start: toIsoDate(new Date(Date.UTC(year, evenMonth - 3, 1))),
      end: toIsoDate(new Date(Date.UTC(year, evenMonth - 1, 1))),
      deadline: `${year}-${pad2(evenMonth)}-15`,
    });
  }
  return periods;
}

/** The nights of `[checkIn, checkOut)` that fall inside the half-open period. */
function nightsInPeriod(checkIn: IsoDate, checkOut: IsoDate, period: ReportPeriod): IsoDate[] {
  const start = checkIn > period.start ? checkIn : period.start;
  const end = checkOut < period.end ? checkOut : period.end;
  const nights: IsoDate[] = [];
  const cursor = parseIsoDate(start);
  const endDate = parseIsoDate(end);
  while (cursor < endDate) {
    nights.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return nights;
}

/**
 * Aggregate reservations + 宿泊者名簿 into a §14 periodic report for `period`.
 *
 * - Cancelled / rejected reservations are excluded.
 * - Each reservation's stayers come from the guest register; if none have been
 *   recorded yet, it falls back to the reservation's primary guest (1 person) so
 *   the report stays meaningful before the register is filled in.
 * - Stays spanning the period boundary contribute only their in-period nights.
 */
export function buildMinpakuPeriodReport(input: {
  period: ReportPeriod;
  reservations: readonly Reservation[];
  registers: readonly GuestRegister[];
  guests: readonly Guest[];
}): MinpakuPeriodReport {
  const { period, reservations, registers, guests } = input;

  const guestById = new Map(guests.map((g) => [g.id, g]));
  const registersByReservation = new Map<string, GuestRegister[]>();
  for (const reg of registers) {
    const list = registersByReservation.get(reg.reservationId) ?? [];
    list.push(reg);
    registersByReservation.set(reg.reservationId, list);
  }

  const operatedNights = new Set<string>();
  const nationalityNights = new Map<string, number>();
  let guestCount = 0;
  let guestNights = 0;

  for (const r of reservations) {
    if (r.status === 'cancelled' || r.status === 'rejected') continue;
    const nights = nightsInPeriod(r.checkIn, r.checkOut, period);
    if (nights.length === 0) continue;
    for (const night of nights) operatedNights.add(night);

    const regs = registersByReservation.get(r.id);
    const nationalities =
      regs && regs.length > 0
        ? regs.map((reg) => normalizeNationality(reg.nationality))
        : [normalizeNationality(guestById.get(r.guestId)?.nationality)];

    guestCount += nationalities.length;
    for (const nat of nationalities) {
      guestNights += nights.length;
      nationalityNights.set(nat, (nationalityNights.get(nat) ?? 0) + nights.length);
    }
  }

  const byNationality = [...nationalityNights.entries()]
    .map(([nationality, gn]) => ({ nationality, guestNights: gn }))
    .sort((a, b) => b.guestNights - a.guestNights || (a.nationality < b.nationality ? -1 : 1));

  return {
    period,
    nightsOperated: operatedNights.size,
    guestCount,
    guestNights,
    byNationality,
  };
}

/** Stable English header for the nationality breakdown table in the export. */
export const MINPAKU_REPORT_CSV_HEADER = ['Nationality', 'Guest-nights'] as const;

/**
 * Render a periodic report as a CSV document: a labelled summary block followed
 * by the nationality breakdown table. Amounts are integers.
 */
export function minpakuReportToCsv(report: MinpakuPeriodReport): string {
  const rows: string[][] = [
    ['Reporting period', `${report.period.start} – ${inclusiveEndDate(report.period)}`],
    ['Nights operated', String(report.nightsOperated)],
    ['Guests', String(report.guestCount)],
    ['Guest-nights', String(report.guestNights)],
    [],
    [...MINPAKU_REPORT_CSV_HEADER],
    ...report.byNationality.map((n) => [n.nationality, String(n.guestNights)]),
  ];
  return toCsv(rows);
}
