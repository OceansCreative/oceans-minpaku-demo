'use client';

import { BarChart2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { occupancyInRange } from '@/lib/services/metrics';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';
import { parseIsoDate, toIsoDate } from '@/lib/utils/dates';

import type { IsoDate } from '@/types/common';

interface OccupancyTrendWidgetProps {
  today: IsoDate;
}

interface MonthBucket {
  label: string;
  rate: number;
  isCurrent: boolean;
}

/**
 * Sparkline-style bar chart showing the last 6 months' occupancy rates.
 * Bars are height-proportional to the occupancy rate (0–100%).
 */
export function OccupancyTrendWidget({ today }: OccupancyTrendWidgetProps) {
  const reservations = useAppStore((s) => s.reservations);
  const rooms = useAppStore((s) => s.rooms);
  const t = useTranslations('Admin');

  const buckets = useMemo<MonthBucket[]>(() => {
    const ref = parseIsoDate(today);
    const currentYear = ref.getUTCFullYear();
    const currentMonth = ref.getUTCMonth();

    return Array.from({ length: 6 }, (_, i) => {
      // i=0 is 5 months ago, i=5 is current month
      const offset = i - 5;
      const rawMonth = currentMonth + offset;
      // JavaScript's Date handles month overflow/underflow correctly with UTC
      const start = new Date(Date.UTC(currentYear, rawMonth, 1));
      const end = new Date(Date.UTC(currentYear, rawMonth + 1, 1));

      const startIso = toIsoDate(start);
      const endIso = toIsoDate(end);
      const isCurrent = offset === 0;

      const summary = occupancyInRange(reservations, rooms.length, {
        start: startIso,
        end: endIso,
      });

      const label = new Intl.DateTimeFormat('ja-JP', { month: 'short' }).format(start);

      return { label, rate: summary.rate, isCurrent };
    });
  }, [reservations, rooms.length, today]);

  return (
    <section className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5 dark:border-gray-700 dark:bg-gray-800">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-base text-ink/80 dark:text-gray-200">
          <BarChart2 className="h-4 w-4 text-moss" />
          {t('widgets.occupancy_trend')}
        </h2>
      </header>

      <div
        className="flex items-end gap-1.5"
        style={{ height: '64px' }}
        role="img"
        aria-label={t('widgets.occupancy_trend')}
      >
        {buckets.map((bucket) => {
          const heightPct = Math.max(4, Math.round(bucket.rate * 100));
          return (
            <div
              key={bucket.label}
              className="flex flex-1 flex-col items-center gap-1"
              title={`${bucket.label}: ${Math.round(bucket.rate * 100)}%`}
            >
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn(
                    'w-full rounded-sm transition-all',
                    bucket.isCurrent
                      ? 'bg-teal-500 dark:bg-teal-400'
                      : 'bg-teal-500/60 dark:bg-teal-400/60',
                  )}
                  style={{ height: `${heightPct}%` }}
                  aria-hidden
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="flex flex-1 justify-center">
            <span
              className={cn(
                'text-[10px] tabular-nums',
                bucket.isCurrent
                  ? 'font-semibold text-teal-600 dark:text-teal-400'
                  : 'text-ink/40 dark:text-gray-500',
              )}
            >
              {bucket.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
