'use client';

import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useAppStore } from '@/lib/store';
import { toIsoDate } from '@/lib/utils/dates';

/** Captured revenue this month + projected revenue from remaining approved stays. */
export function SalesSummaryWidget() {
  const reservations = useAppStore((s) => s.reservations);
  const t = useTranslations('Admin');

  const { captured, upcoming } = useMemo(() => {
    const today = new Date();
    const monthStart = toIsoDate(
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
    );
    const monthEnd = toIsoDate(
      new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 1)),
    );

    let cap = 0;
    let up = 0;
    for (const r of reservations) {
      if (r.checkIn >= monthStart && r.checkIn < monthEnd) {
        if (r.payment.status === 'captured') cap += r.amount;
        else if (r.status === 'approved') up += r.amount;
      }
    }
    return { captured: cap, upcoming: up };
  }, [reservations]);

  return (
    <section className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5">
      <header className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-serif text-base text-ink/80">
          <TrendingUp className="h-4 w-4 text-moss" />
          {t('monthlySales')}
        </h2>
      </header>
      <div className="space-y-2">
        <div>
          <p className="text-2xl font-medium text-ink">¥{captured.toLocaleString()}</p>
          <p className="text-[11px] text-ink/50">{t('salesCaptured')}</p>
        </div>
        <div className="border-t border-ink/10 pt-2">
          <p className="text-lg text-ink/70">+¥{upcoming.toLocaleString()}</p>
          <p className="text-[11px] text-ink/50">{t('salesUpcoming')}</p>
        </div>
      </div>
    </section>
  );
}
