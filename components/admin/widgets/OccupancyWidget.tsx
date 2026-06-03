'use client';

import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useAppStore } from '@/lib/store';
import { toIsoDate } from '@/lib/utils/dates';

/**
 * Last-30-days room-night occupancy = booked nights / (rooms × 30).
 * Counts approved + pending (pending is committed inventory).
 */
export function OccupancyWidget() {
  const reservations = useAppStore((s) => s.reservations);
  const rooms = useAppStore((s) => s.rooms);
  const t = useTranslations('Admin');

  const rate = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - 30);
    const startIso = toIsoDate(start);
    const endIso = toIsoDate(today);

    let bookedNights = 0;
    for (const r of reservations) {
      if (r.status === 'cancelled' || r.status === 'rejected') continue;
      const a = r.checkIn > startIso ? r.checkIn : startIso;
      const b = r.checkOut < endIso ? r.checkOut : endIso;
      if (b <= a) continue;
      const days = Math.round(
        (new Date(`${b}T00:00:00.000Z`).getTime() - new Date(`${a}T00:00:00.000Z`).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      bookedNights += days;
    }

    const capacity = Math.max(1, rooms.length) * 30;
    return Math.min(1, bookedNights / capacity);
  }, [reservations, rooms]);

  const pct = Math.round(rate * 100);

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
          {t('occupancyDenominator', { rooms: rooms.length, roomNights: rooms.length * 30 })}
        </p>
      </div>
    </section>
  );
}
