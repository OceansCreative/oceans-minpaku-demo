'use client';

import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { ConflictsPanel } from '@/components/admin/ConflictsPanel';
import { AIRBNB_ICAL_LAG_HOURS } from '@/lib/mock/airbnb-ical';
import { calculateNightlyRates, rateHeatLevel } from '@/lib/services/pricing';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import type { PricingRule, Reservation } from '@/types';

/** Number of heat buckets; matches HEAT_TINTS length. */
const HEAT_LEVELS = 5;

/**
 * Graduated tint per heat level, coldest (cheapest) → hottest (most expensive).
 * Listed as full class strings so Tailwind can statically detect them. The moss
 * accent keeps the palette on-brand; opacity stays low so cell content (reserva-
 * tion chips, today marker, the crimson double-booking ring) stays legible.
 */
const HEAT_TINTS = [
  'bg-moss/[0.04]',
  'bg-moss/[0.10]',
  'bg-moss/[0.18]',
  'bg-moss/[0.28]',
  'bg-moss/[0.40]',
] as const;

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function daysInMonth(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}
function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AdminCalendarPage() {
  const reservations = useAppStore((s) => s.reservations);
  const rooms = useAppStore((s) => s.rooms);
  const pricingRules = useAppStore((s) => s.pricingRules);
  const t = useTranslations('Admin');
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => {
    const n = daysInMonth(cursor);
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(cursor);
      d.setUTCDate(i + 1);
      return d;
    });
  }, [cursor]);

  // Heatmap: per-room nightly rate for every visible day, via the shared pricing
  // service (no inline pricing math). Only date-intrinsic rules apply on the
  // calendar — leadtime/occupancy need a booking context that doesn't exist for
  // an empty grid cell, and leadtime would otherwise throw without `bookedAt`.
  const { ratesByRoom, monthMin, monthMax } = useMemo(() => {
    const dateRules: PricingRule[] = pricingRules.filter(
      (r) => r.condition.type === 'weekend' || r.condition.type === 'season',
    );
    const checkIn = isoDay(days[0] ?? cursor);
    const lastDay = days[days.length - 1] ?? cursor;
    const checkOutDate = new Date(lastDay);
    checkOutDate.setUTCDate(checkOutDate.getUTCDate() + 1);
    const checkOut = isoDay(checkOutDate);

    const byRoom = new Map<string, Map<string, number>>();
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const room of rooms) {
      const dayMap = new Map<string, number>();
      const rates = calculateNightlyRates({
        basePrice: room.basePrice,
        checkIn,
        checkOut,
        rules: dateRules,
      });
      for (const rate of rates) {
        dayMap.set(rate.date, rate.price);
        if (rate.price < min) min = rate.price;
        if (rate.price > max) max = rate.price;
      }
      byRoom.set(room.id, dayMap);
    }
    return { ratesByRoom: byRoom, monthMin: min, monthMax: max };
  }, [cursor, days, rooms, pricingRules]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">{t('navCalendar')}</h1>
          <p className="text-sm text-ink/60">{t('calendarSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-sand px-2 py-1">
          <button
            type="button"
            onClick={() => {
              const d = new Date(cursor);
              d.setUTCMonth(d.getUTCMonth() - 1);
              setCursor(d);
            }}
            className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5"
            aria-label={t('prevMonth')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-sm tabular-nums text-ink">
            {t('yearMonth', { year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 })}
          </span>
          <button
            type="button"
            onClick={() => {
              const d = new Date(cursor);
              d.setUTCMonth(d.getUTCMonth() + 1);
              setCursor(d);
            }}
            className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5"
            aria-label={t('nextMonth')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <ConflictsPanel />
      <div className="flex items-start gap-2 rounded-md border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-[11px] text-ink/60">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
        <p>
          {t('icalLagBefore')}{' '}
          <strong>
            {t('icalLagHours', {
              min: AIRBNB_ICAL_LAG_HOURS.min,
              max: AIRBNB_ICAL_LAG_HOURS.max,
            })}
          </strong>{' '}
          {t('icalLagAfter')} <strong>{t('icalLagSafeguard')}</strong> {t('icalLagFinal')}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Legend />
        <HeatLegend />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-sand">
        <table className="min-w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-ink/[0.03] text-[10px] uppercase tracking-wider text-ink/50">
            <tr>
              <th className="sticky left-0 z-20 min-w-[7rem] border-b border-ink/10 bg-ink/[0.03] px-3 py-2 text-left">
                {t('colRoomHeader')}
              </th>
              {days.map((d) => (
                <th
                  key={isoDay(d)}
                  className={cn(
                    'min-w-[2.25rem] border-b border-l border-ink/5 px-1.5 py-2 text-center font-normal',
                    [0, 6].includes(d.getUTCDay()) && 'text-crimson',
                  )}
                >
                  {d.getUTCDate()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-ink">
            {rooms.map((room) => (
              <tr key={room.id} className="border-t border-ink/5">
                <th className="sticky left-0 z-10 border-r border-ink/5 bg-sand px-3 py-2 text-left text-xs font-normal text-ink/80">
                  {room.name}
                </th>
                {days.map((d) => {
                  const cellIso = isoDay(d);
                  const occupants = reservations.filter(
                    (r) =>
                      r.roomId === room.id &&
                      r.status !== 'cancelled' &&
                      r.status !== 'rejected' &&
                      r.checkIn <= cellIso &&
                      r.checkOut > cellIso,
                  );
                  const conflict = occupants.length > 1;
                  const first = occupants[0];
                  const rate = ratesByRoom.get(room.id)?.get(cellIso);
                  // Heat tint only on cells without a double-booking, so the
                  // crimson conflict highlight is never diluted.
                  const heatTint =
                    !conflict && rate !== undefined
                      ? HEAT_TINTS[rateHeatLevel(rate, monthMin, monthMax, HEAT_LEVELS)]
                      : undefined;
                  const rateLabel =
                    rate !== undefined
                      ? t('cellNightlyRate', { rate: rate.toLocaleString() })
                      : undefined;
                  const occupantTitle =
                    occupants.length === 0
                      ? t('cellVacant')
                      : occupants.map((o) => `${o.id} (${o.source}, ${o.status})`).join('\n');
                  return (
                    <td
                      key={cellIso}
                      className={cn(
                        'h-9 border-l border-ink/5 align-middle',
                        heatTint,
                        conflict && 'bg-crimson/20 ring-2 ring-inset ring-crimson',
                      )}
                      title={rateLabel ? `${occupantTitle}\n${rateLabel}` : occupantTitle}
                    >
                      {first && (
                        <Link
                          href={`/admin/reservations/${first.id}`}
                          className={cn(
                            'mx-0.5 block truncate rounded px-1.5 py-1 text-[9px]',
                            cellColor(first),
                          )}
                        >
                          {abbrevId(first.id)}
                        </Link>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cellColor(r: Reservation): string {
  if (r.status === 'pending') return 'bg-moss/20 text-moss';
  const tone = r.source === 'airbnb' ? 'bg-pink-200 text-pink-900' : 'bg-blue-200 text-blue-900';
  return tone;
}

function abbrevId(id: string): string {
  return id.replace('res-', '').slice(0, 6);
}

function Legend() {
  const t = useTranslations('Admin');
  const items: { labelKey: string; tone: string }[] = [
    { labelKey: 'legendDirect', tone: 'bg-blue-200 text-blue-900' },
    { labelKey: 'legendAirbnb', tone: 'bg-pink-200 text-pink-900' },
    { labelKey: 'legendPending', tone: 'bg-moss/20 text-moss' },
    {
      labelKey: 'legendDoubleBooking',
      tone: 'bg-crimson/20 ring-2 ring-inset ring-crimson text-crimson',
    },
  ];
  return (
    <ul className="flex flex-wrap gap-2 text-[11px] text-ink/60">
      {items.map((it) => (
        <li key={it.labelKey} className="inline-flex items-center gap-1.5">
          <span className={cn('inline-block h-3 w-5 rounded-sm', it.tone)} />
          {t(it.labelKey)}
        </li>
      ))}
    </ul>
  );
}

function HeatLegend() {
  const t = useTranslations('Admin');
  return (
    <div className="inline-flex items-center gap-2 text-[11px] text-ink/60">
      <span className="uppercase tracking-wider text-ink/45">{t('heatLegendTitle')}</span>
      <span>{t('heatLegendLow')}</span>
      <span className="inline-flex overflow-hidden rounded-sm ring-1 ring-inset ring-ink/10">
        {HEAT_TINTS.map((tone, i) => (
          <span key={i} className={cn('inline-block h-3 w-5', tone)} aria-hidden />
        ))}
      </span>
      <span>{t('heatLegendHigh')}</span>
    </div>
  );
}
