'use client';

import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

const CAP_DAYS = 180;

/**
 * 住宅宿泊事業法 §2-3: a 民泊 host can only operate up to 180 nights per fiscal
 * year (Apr 1 – Mar 31). This widget aggregates booked + completed approved nights
 * within the current fiscal year and warns as the cap approaches.
 */
export function CapCounterWidget() {
  const reservations = useAppStore((s) => s.reservations);
  const t = useTranslations('Admin');

  const used = useMemo(() => {
    const now = new Date();
    const fyStart = new Date(
      Date.UTC(now.getUTCMonth() < 3 ? now.getUTCFullYear() - 1 : now.getUTCFullYear(), 3, 1),
    );
    const fyEnd = new Date(Date.UTC(fyStart.getUTCFullYear() + 1, 3, 1));
    const fyStartIso = fyStart.toISOString().slice(0, 10);
    const fyEndIso = fyEnd.toISOString().slice(0, 10);

    let nights = 0;
    for (const r of reservations) {
      if (r.status !== 'approved') continue;
      const a = r.checkIn > fyStartIso ? r.checkIn : fyStartIso;
      const b = r.checkOut < fyEndIso ? r.checkOut : fyEndIso;
      if (b <= a) continue;
      const days = Math.round(
        (new Date(`${b}T00:00:00.000Z`).getTime() - new Date(`${a}T00:00:00.000Z`).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      nights += days;
    }
    return nights;
  }, [reservations]);

  const pct = Math.min(100, Math.round((used / CAP_DAYS) * 100));
  const danger = pct >= 90;

  return (
    <section className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-base text-ink/80">
          <ShieldCheck className="h-4 w-4 text-moss" />
          {t('capCounter')}
        </h2>
        <span className={cn('text-xs tabular-nums', danger ? 'text-crimson' : 'text-ink/50')}>
          {t('capCounterValue', { used, cap: CAP_DAYS })}
        </span>
      </header>
      <div className="h-2 overflow-hidden rounded-full bg-ink/[0.06]">
        <div
          className={cn('h-full rounded-full transition-all', danger ? 'bg-crimson' : 'bg-moss')}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
      <p className="text-[11px] text-ink/40">{t('capCounterNote')}</p>
    </section>
  );
}
