'use client';

import { useTranslations } from 'next-intl';

import { PERIOD_PRESETS, type PeriodPreset } from '@/lib/services/metrics';
import { cn } from '@/lib/utils/cn';

const LABEL_KEY: Record<PeriodPreset, string> = {
  thisMonth: 'periodThisMonth',
  lastMonth: 'periodLastMonth',
  last30Days: 'periodLast30Days',
  last90Days: 'periodLast90Days',
};

/**
 * Segmented control for the dashboard KPI window. Controlled — the dashboard
 * owns the selected preset and resolves it to a date range for its widgets.
 */
export function PeriodFilter({
  value,
  onChange,
}: {
  value: PeriodPreset;
  onChange: (preset: PeriodPreset) => void;
}) {
  const t = useTranslations('Admin');

  return (
    <div
      role="group"
      aria-label={t('period')}
      className="inline-flex flex-wrap gap-1 rounded-xl border border-ink/10 bg-sand p-1"
    >
      {PERIOD_PRESETS.map((preset) => {
        const active = preset === value;
        return (
          <button
            key={preset}
            type="button"
            onClick={() => onChange(preset)}
            aria-pressed={active}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs transition-colors',
              active ? 'bg-ink text-sand' : 'text-ink/60 hover:bg-ink/5 hover:text-ink',
            )}
          >
            {t(LABEL_KEY[preset])}
          </button>
        );
      })}
    </div>
  );
}
