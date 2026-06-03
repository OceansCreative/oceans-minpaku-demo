'use client';

import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { occupancyInRange, type DateRange } from '@/lib/services/metrics';
import { useAppStore } from '@/lib/store';
import { nightsBetween } from '@/lib/utils/dates';

/**
 * Room-night occupancy over the selected window = booked nights / (rooms × nights).
 * Counts approved + pending (pending is committed inventory).
 */
export function OccupancyWidget({ range }: { range: DateRange }) {
  const reservations = useAppStore((s) => s.reservations);
  const rooms = useAppStore((s) => s.rooms);
  const t = useTranslations('Admin');

  const summary = useMemo(
    () => occupancyInRange(reservations, rooms.length, range),
    [reservations, rooms.length, range],
  );

  const nights = nightsBetween(range.start, range.end);
  const pct = Math.round(summary.rate * 100);

  return (
    <section className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-base text-ink/80">
          <Activity className="h-4 w-4 text-moss" />
          {t('occupancy')}
        </h2>
        <span className="text-xs text-ink/40">{pct}%</span>
      </header>
      <div className="space-y-1">
        <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
          <div
            className="h-full rounded-full bg-moss transition-all"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
        <p className="text-[11px] text-ink/40">
          {t('occupancyDenominator', {
            rooms: rooms.length,
            nights,
            roomNights: summary.capacity,
          })}
        </p>
      </div>
    </section>
  );
}
