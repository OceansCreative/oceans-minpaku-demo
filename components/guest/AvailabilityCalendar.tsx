'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { buildRoomMonthAvailability, shiftMonth } from '@/lib/services/availability';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';
import { toIsoDate } from '@/lib/utils/dates';

/**
 * Guest-facing month grid showing per-night availability and indicative rates
 * for a room. Reads live reservations + pricing rules from the store and defers
 * all logic to the pure `buildRoomMonthAvailability` service. A mount gate keeps
 * the persisted (client) store from clashing with the seed (SSR) store during
 * hydration.
 */
export function AvailabilityCalendar({ roomId, basePrice }: { roomId: string; basePrice: number }) {
  const reservations = useAppStore((s) => s.reservations);
  const pricingRules = useAppStore((s) => s.pricingRules);
  const t = useTranslations('Availability');

  const [mounted, setMounted] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
  });
  useEffect(() => setMounted(true), []);

  const today = toIsoDate(new Date());
  const month = useMemo(
    () =>
      buildRoomMonthAvailability({
        year: cursor.year,
        month: cursor.month,
        roomId,
        basePrice,
        rules: pricingRules,
        reservations,
        today,
      }),
    [cursor, roomId, basePrice, pricingRules, reservations, today],
  );

  const weekdays = t('weekdayNarrow').split(',');

  return (
    <section className="space-y-3 rounded-2xl border border-ink/10 bg-sand/60 p-5 dark:border-gray-700 dark:bg-gray-800/60">
      <header className="flex items-center justify-between">
        <h2 className="font-serif text-lg text-ink dark:text-gray-100">{t('title')}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t('prevMonth')}
            onClick={() => setCursor((c) => shiftMonth(c.year, c.month, -1))}
            className="rounded-md p-1.5 text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[6.5rem] text-center text-sm text-ink/70 dark:text-gray-400">
            {t('monthLabel', { year: String(cursor.year), month: String(cursor.month) })}
          </span>
          <button
            type="button"
            aria-label={t('nextMonth')}
            onClick={() => setCursor((c) => shiftMonth(c.year, c.month, 1))}
            className="rounded-md p-1.5 text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-ink/40 dark:text-gray-500">
        {weekdays.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1" aria-hidden={!mounted}>
        {mounted &&
          Array.from({ length: month.firstWeekday }).map((_, i) => <div key={`blank-${i}`} />)}
        {mounted &&
          month.days.map((d) => {
            const dayNum = Number(d.date.slice(8, 10));
            return (
              <div
                key={d.date}
                className={cn(
                  'flex min-h-[3rem] flex-col items-center justify-center gap-0.5 rounded-md border px-1 py-1 text-center',
                  d.past
                    ? 'border-transparent text-ink/25 dark:text-gray-600'
                    : d.booked
                      ? 'border-crimson/15 bg-crimson/[0.05] dark:border-crimson/20 dark:bg-crimson/10'
                      : 'border-ink/10 bg-sand transition-colors hover:border-moss/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-moss/50',
                )}
              >
                <span
                  className={cn(
                    'text-xs',
                    d.past ? 'text-ink/25 dark:text-gray-600' : 'text-ink/70 dark:text-gray-300',
                  )}
                >
                  {dayNum}
                </span>
                {!d.past &&
                  (d.booked ? (
                    <span className="text-[9px] text-crimson/70">{t('booked')}</span>
                  ) : (
                    <span className="text-[9px] tabular-nums text-moss">
                      ¥{(d.price / 1000).toFixed(0)}k
                    </span>
                  ))}
              </div>
            );
          })}
      </div>

      <div className="flex items-center gap-4 text-[11px] text-ink/50 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-ink/15 bg-sand dark:border-gray-600 dark:bg-gray-800" />
          {t('vacant')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm border border-crimson/20 bg-crimson/[0.15]" />
          {t('booked')}
        </span>
      </div>
      <p className="text-[11px] text-ink/40 dark:text-gray-500">{t('note')}</p>
    </section>
  );
}
