'use client';

import { BarChart3, Download, Filter } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import {
  bucketSales,
  salesBucketsToCsv,
  salesTotals,
  type SalesGranularity,
} from '@/lib/services/sales';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';
import { toIsoDate } from '@/lib/utils/dates';

function SalesChartLoading() {
  const t = useTranslations('Admin');
  return (
    <div className="grid h-72 w-full place-items-center text-xs text-ink/40">
      {t('chartLoading')}
    </div>
  );
}

// Lazy-load recharts so the rest of the admin shell stays close to the ~110kB
// First Load JS budget that the other admin pages occupy. SSR is disabled
// because ResponsiveContainer measures the DOM on mount.
const SalesChart = dynamic(() => import('@/components/admin/SalesChart'), {
  ssr: false,
  loading: () => <SalesChartLoading />,
});

export default function AdminSalesPage() {
  const reservations = useAppStore((s) => s.reservations);
  const t = useTranslations('Admin');
  const [gran, setGran] = useState<SalesGranularity>('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const buckets = useMemo(
    () => bucketSales(reservations, { granularity: gran, from, to }),
    [reservations, gran, from, to],
  );

  const { total, direct: totalDirect, airbnb: totalAirbnb } = salesTotals(buckets);

  function exportCsv() {
    const csv = salesBucketsToCsv(buckets);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-${gran}-${toIsoDate(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">{t('navSales')}</h1>
          <p className="text-sm text-ink/60">{t('salesSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={buckets.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink/15 bg-sand px-3 py-2 text-xs text-ink/70 transition-colors hover:bg-ink/[0.04] hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          {t('exportSalesCsv')}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-sand p-3 text-sm">
        <Filter className="h-3.5 w-3.5 text-ink/40" />
        {(['day', 'month', 'year'] as SalesGranularity[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGran(g)}
            className={cn(
              'rounded-full px-3 py-1 text-xs',
              gran === g ? 'bg-ink text-sand' : 'bg-ink/[0.04] text-ink/70 hover:bg-ink/10',
            )}
          >
            {g === 'day' ? t('granDay') : g === 'month' ? t('granMonth') : t('granYear')}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-ink/15" />
        <label className="flex items-center gap-1.5 text-xs text-ink/60">
          {t('rangeStart')}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-ink/15 bg-sand px-2 py-1 text-xs"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-ink/60">
          {t('rangeEnd')}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-ink/15 bg-sand px-2 py-1 text-xs"
          />
        </label>
        {(from || to) && (
          <button
            type="button"
            onClick={() => {
              setFrom('');
              setTo('');
            }}
            className="text-[11px] text-ink/40 underline-offset-2 hover:underline"
          >
            {t('clearRange')}
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label={t('totalForRange')} value={total} />
        <SummaryCard label={t('directRevenue')} value={totalDirect} tone="text-blue-700" />
        <SummaryCard label={t('airbnbRevenue')} value={totalAirbnb} tone="text-pink-700" />
      </div>

      <section className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5">
        <h2 className="flex items-center gap-2 font-serif text-base text-ink/80">
          <BarChart3 className="h-4 w-4 text-moss" />
          {t('salesTrend')}
        </h2>
        <SalesChart data={buckets} />
      </section>

      <p className="text-[11px] text-ink/40">{t('salesExcludeNote')}</p>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="space-y-1 rounded-2xl border border-ink/10 bg-sand p-5">
      <p className="text-xs text-ink/50">{label}</p>
      <p className={`text-xl font-medium ${tone ?? 'text-ink'}`}>¥{value.toLocaleString()}</p>
    </div>
  );
}
