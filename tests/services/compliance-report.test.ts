import { describe, expect, it } from 'vitest';

import {
  buildMinpakuPeriodReport,
  inclusiveEndDate,
  MINPAKU_REPORT_CSV_HEADER,
  minpakuReportToCsv,
  statutoryReportPeriods,
  type ReportPeriod,
} from '@/lib/services/compliance-report';

import type { Guest, GuestRegister, Reservation } from '@/types';

const PERIOD: ReportPeriod = { start: '2026-04-01', end: '2026-06-01' }; // Apr + May

function resv(over: Partial<Reservation> = {}): Reservation {
  return {
    id: 'r1',
    roomId: 'room-1',
    guestId: 'guest-jp',
    checkIn: '2026-04-10',
    checkOut: '2026-04-13',
    checkInTime: '15:00',
    checkOutTime: '10:00',
    status: 'approved',
    source: 'direct',
    amount: 30_000,
    payment: { intentId: 'pi_1', status: 'captured' },
    createdAt: '2026-04-01T00:00:00+09:00',
    ...over,
  };
}

function reg(
  over: Partial<GuestRegister> & Pick<GuestRegister, 'reservationId' | 'nationality'>,
): GuestRegister {
  return {
    id: `reg-${over.reservationId}-${over.nationality}`,
    name: 'Stayer',
    profession: 'engineer',
    ...over,
  };
}

const guests: Guest[] = [
  {
    id: 'guest-jp',
    name: '山田',
    email: 'a@b.test',
    phone: '1',
    nationality: 'JP',
    language: 'ja',
  },
  { id: 'guest-none', name: 'No Nat', email: 'c@d.test', phone: '2', language: 'en' },
];

describe('statutoryReportPeriods', () => {
  it('returns the six even-month periods with the Feb one spanning the prior year', () => {
    const periods = statutoryReportPeriods(2026);
    expect(periods).toHaveLength(6);
    expect(periods[0]).toEqual({
      start: '2025-12-01',
      end: '2026-02-01',
      deadline: '2026-02-15',
    });
    expect(periods[2]).toEqual({
      start: '2026-04-01',
      end: '2026-06-01',
      deadline: '2026-06-15',
    });
    expect(periods[5]).toEqual({
      start: '2026-10-01',
      end: '2026-12-01',
      deadline: '2026-12-15',
    });
  });
});

describe('inclusiveEndDate', () => {
  it('returns the day before the exclusive end', () => {
    expect(inclusiveEndDate(PERIOD)).toBe('2026-05-31');
  });
});

describe('buildMinpakuPeriodReport', () => {
  it('aggregates nights, guests, person-nights, and nationality split', () => {
    const reservations = [
      resv({ id: 'r1', checkIn: '2026-04-10', checkOut: '2026-04-13', guestId: 'guest-jp' }), // 3 nights, fallback JP
      resv({
        id: 'r2',
        checkIn: '2026-05-30',
        checkOut: '2026-06-03', // clamps to 2 nights (05-30, 05-31)
        guestId: 'guest-jp',
      }),
      resv({ id: 'r3', status: 'cancelled', checkIn: '2026-04-20', checkOut: '2026-04-25' }),
      resv({ id: 'r4', checkIn: '2026-03-01', checkOut: '2026-03-05' }), // outside period
    ];
    const registers = [
      reg({ reservationId: 'r2', nationality: 'US' }),
      reg({ reservationId: 'r2', nationality: 'TW' }),
    ];

    const report = buildMinpakuPeriodReport({ period: PERIOD, reservations, registers, guests });

    expect(report.nightsOperated).toBe(5); // 04-10,11,12 + 05-30,31
    expect(report.guestCount).toBe(3); // r1 fallback 1 + r2 registers 2
    expect(report.guestNights).toBe(7); // 3 (JP) + 2 (US) + 2 (TW)
    expect(report.byNationality).toEqual([
      { nationality: 'JP', guestNights: 3 },
      { nationality: 'TW', guestNights: 2 }, // tie broken by code asc (TW < US)
      { nationality: 'US', guestNights: 2 },
    ]);
  });

  it('falls back to the primary guest nationality when no register entries exist', () => {
    const report = buildMinpakuPeriodReport({
      period: PERIOD,
      reservations: [resv({ id: 'r1', guestId: 'guest-jp' })], // 3 nights
      registers: [],
      guests,
    });
    expect(report.byNationality).toEqual([{ nationality: 'JP', guestNights: 3 }]);
  });

  it('uses UNKNOWN when neither register nor guest has a nationality', () => {
    const report = buildMinpakuPeriodReport({
      period: PERIOD,
      reservations: [resv({ id: 'r1', guestId: 'guest-none' })],
      registers: [],
      guests,
    });
    expect(report.byNationality).toEqual([{ nationality: 'UNKNOWN', guestNights: 3 }]);
  });

  it('counts distinct operated nights when reservations overlap (double-booking)', () => {
    const reservations = [
      resv({ id: 'r1', roomId: 'room-1', checkIn: '2026-04-10', checkOut: '2026-04-13' }),
      resv({ id: 'r2', roomId: 'room-2', checkIn: '2026-04-11', checkOut: '2026-04-14' }),
    ];
    const report = buildMinpakuPeriodReport({
      period: PERIOD,
      reservations,
      registers: [],
      guests,
    });
    // Union of {10,11,12} and {11,12,13} = {10,11,12,13} = 4 distinct nights.
    expect(report.nightsOperated).toBe(4);
    expect(report.guestCount).toBe(2);
    expect(report.guestNights).toBe(6); // 3 + 3 person-nights
  });
});

describe('minpakuReportToCsv', () => {
  it('emits a summary block plus the nationality table', () => {
    const report = buildMinpakuPeriodReport({
      period: PERIOD,
      reservations: [resv({ id: 'r1', guestId: 'guest-jp' })],
      registers: [],
      guests,
    });
    expect(minpakuReportToCsv(report)).toBe(
      [
        'Reporting period,2026-04-01 – 2026-05-31',
        'Nights operated,3',
        'Guests,1',
        'Guest-nights,3',
        '',
        MINPAKU_REPORT_CSV_HEADER.join(','),
        'JP,3',
      ].join('\n'),
    );
  });
});
