'use client';

import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useAppStore } from '@/lib/store';
import { parseIsoDate, toIsoDate } from '@/lib/utils/dates';

import type { IsoDate } from '@/types/common';

interface RevenueCompareWidgetProps {
  today: IsoDate;
}

interface MonthRevenue {
  label: string;
  actual: number;
  forecast: number;
}

/**
 * Grouped bar chart: last 3 months, each with "actual" (approved/captured) and
 * "forecast" (pending) revenue bars side by side.
 * Pure CSS bars — no chart library.
 */
export function RevenueCompareWidget({ today }: RevenueCompareWidgetProps) {
  const reservations = useAppStore((s) => s.reservations);
  const t = useTranslations('Admin');

  const months = useMemo<MonthRevenue[]>(() => {
    const ref = parseIsoDate(today);
    const currentYear = ref.getUTCFullYear();
    const currentMonth = ref.getUTCMonth();

    return Array.from({ length: 3 }, (_, i) => {
      // i=0 is 2 months ago, i=2 is current month
      const offset = i - 2;
      const start = new Date(Date.UTC(currentYear, currentMonth + offset, 1));
      const end = new Date(Date.UTC(currentYear, currentMonth + offset + 1, 1));

      const startIso = toIsoDate(start);
      const endIso = toIsoDate(end);

      let actual = 0;
      let forecast = 0;

      for (const r of reservations) {
        if (r.checkIn < startIso || r.checkIn >= endIso) continue;
        if (r.status === 'cancelled' || r.status === 'rejected') continue;

        if (r.status === 'approved') {
          actual += r.amount;
        } else if (r.status === 'pending') {
          forecast += r.amount;
        }
      }

      const label = new Intl.DateTimeFormat('ja-JP', { month: 'short' }).format(start);
      return { label, actual, forecast };
    });
  }, [reservations, today]);

  const maxRevenue = Math.max(1, ...months.map((m) => Math.max(m.actual, m.forecast)));

  return (
    <section className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5 dark:border-gray-700 dark:bg-gray-800">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-base text-ink/80 dark:text-gray-200">
          <TrendingUp className="h-4 w-4 text-moss" />
          {t('widgets.revenue_compare')}
        </h2>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="inline-flex items-center gap-1 text-ink/50 dark:text-gray-500">
            <span className="inline-block h-2 w-2 rounded-sm bg-blue-500 dark:bg-blue-400" />
            {t('widgets.actual')}
          </span>
          <span className="inline-flex items-center gap-1 text-ink/50 dark:text-gray-500">
            <span className="inline-block h-2 w-2 rounded-sm border border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-600" />
            {t('widgets.forecast')}
          </span>
        </div>
      </header>

      <div className="flex items-end justify-around gap-2" style={{ height: '72px' }}>
        {months.map((month) => {
          const actualPct = Math.max(0, Math.round((month.actual / maxRevenue) * 100));
          const forecastPct = Math.max(0, Math.round((month.forecast / maxRevenue) * 100));
          return (
            <div key={month.label} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex w-full flex-1 items-end justify-center gap-1">
                <div
                  className="flex-1 rounded-sm bg-blue-500 transition-all dark:bg-blue-400"
                  style={{ height: `${Math.max(4, actualPct)}%` }}
                  title={`${month.label} ${t('widgets.actual')}: ¥${month.actual.toLocaleString()}`}
                  aria-hidden
                />
                <div
                  className="flex-1 rounded-sm border border-gray-400 bg-gray-200 transition-all dark:border-gray-500 dark:bg-gray-600"
                  style={{ height: `${Math.max(4, forecastPct)}%` }}
                  title={`${month.label} ${t('widgets.forecast')}: ¥${month.forecast.toLocaleString()}`}
                  aria-hidden
                />
              </div>
              <span className="text-[10px] text-ink/40 dark:text-gray-500">{month.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
