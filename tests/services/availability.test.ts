import { describe, expect, it } from 'vitest';

import { buildRoomMonthAvailability, shiftMonth } from '@/lib/services/availability';

import type { PricingRule, Reservation } from '@/types';

function resv(over: Partial<Reservation> = {}): Reservation {
  return {
    id: 'r1',
    roomId: 'room-1',
    guestId: 'g1',
    checkIn: '2026-06-10',
    checkOut: '2026-06-12',
    checkInTime: '15:00',
    checkOutTime: '10:00',
    status: 'approved',
    source: 'direct',
    amount: 30_000,
    payment: { intentId: 'pi_1', status: 'captured' },
    createdAt: '2026-06-01T00:00:00+09:00',
    ...over,
  };
}

const BASE = {
  year: 2026,
  month: 6,
  roomId: 'room-1',
  basePrice: 20_000,
  rules: [] as PricingRule[],
  reservations: [] as Reservation[],
  today: '2026-06-15' as const,
};

describe('shiftMonth', () => {
  it('steps forward and backward within a year', () => {
    expect(shiftMonth(2026, 6, 1)).toEqual({ year: 2026, month: 7 });
    expect(shiftMonth(2026, 6, -1)).toEqual({ year: 2026, month: 5 });
  });

  it('wraps across year boundaries in both directions', () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 6, 12)).toEqual({ year: 2027, month: 6 });
  });
});

describe('buildRoomMonthAvailability', () => {
  it('emits one cell per day with the correct first weekday', () => {
    const m = buildRoomMonthAvailability(BASE);
    expect(m.days).toHaveLength(30); // June
    expect(m.days[0]?.date).toBe('2026-06-01');
    expect(m.days[29]?.date).toBe('2026-06-30');
    // 2026-06-01 is a Monday → getUTCDay() === 1
    expect(m.firstWeekday).toBe(1);
  });

  it('counts February days correctly (non-leap 2026)', () => {
    expect(buildRoomMonthAvailability({ ...BASE, month: 2 }).days).toHaveLength(28);
  });

  it('marks the half-open booked interval (checkout day is free)', () => {
    const m = buildRoomMonthAvailability({
      ...BASE,
      reservations: [resv({ checkIn: '2026-06-10', checkOut: '2026-06-12' })],
    });
    const byDate = new Map(m.days.map((d) => [d.date, d]));
    expect(byDate.get('2026-06-09')?.booked).toBe(false);
    expect(byDate.get('2026-06-10')?.booked).toBe(true);
    expect(byDate.get('2026-06-11')?.booked).toBe(true);
    expect(byDate.get('2026-06-12')?.booked).toBe(false); // checkout day free
  });

  it('ignores cancelled / rejected reservations and other rooms', () => {
    const m = buildRoomMonthAvailability({
      ...BASE,
      reservations: [
        resv({ checkIn: '2026-06-05', checkOut: '2026-06-08', status: 'cancelled' }),
        resv({ id: 'r2', checkIn: '2026-06-05', checkOut: '2026-06-08', status: 'rejected' }),
        resv({ id: 'r3', roomId: 'room-2', checkIn: '2026-06-05', checkOut: '2026-06-08' }),
      ],
    });
    expect(m.days.every((d) => !d.booked)).toBe(true);
  });

  it('flags past days relative to `today`', () => {
    const m = buildRoomMonthAvailability(BASE); // today = 2026-06-15
    const byDate = new Map(m.days.map((d) => [d.date, d]));
    expect(byDate.get('2026-06-14')?.past).toBe(true);
    expect(byDate.get('2026-06-15')?.past).toBe(false);
    expect(byDate.get('2026-06-16')?.past).toBe(false);
  });

  it('prices each night from date-intrinsic rules, ignoring leadtime/occupancy', () => {
    const rules: PricingRule[] = [
      {
        id: 'weekend',
        condition: { type: 'weekend', value: { weekdays: [5, 6] } },
        multiplier: 1.5,
      },
      { id: 'lead', condition: { type: 'leadtime', value: { maxDaysBefore: 7 } }, multiplier: 2 },
    ];
    const m = buildRoomMonthAvailability({ ...BASE, rules });
    const byDate = new Map(m.days.map((d) => [d.date, d]));
    // 2026-06-05 is a Friday (weekday 5) → ×1.5; leadtime rule must NOT apply.
    expect(byDate.get('2026-06-05')?.price).toBe(30_000);
    // 2026-06-04 is a Thursday → base only.
    expect(byDate.get('2026-06-04')?.price).toBe(20_000);
  });
});
