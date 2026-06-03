'use client';

import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { salesInRange, type DateRange } from '@/lib/services/metrics';
import { useAppStore } from '@/lib/store';

/** Captured revenue + projected (approved, uncaptured) revenue over the window. */
export function SalesSummaryWidget({ range }: { range: DateRange }) {
  const reservations = useAppStore((s) => s.reservations);
  const t = useTranslations('Admin');

  const { captured, upcoming } = useMemo(
    () => salesInRange(reservations, range),
    [reservations, range],
  );

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
