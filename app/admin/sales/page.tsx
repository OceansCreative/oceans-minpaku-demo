'use client';

import { BarChart3, Filter } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

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

type Granularity = 'day' | 'month' | 'year';

interface Bucket {
  key: string;
  direct: number;
  airbnb: number;
}

function bucketKey(iso: string, gran: Granularity): string {
  if (gran === 'day') return iso;
  if (gran === 'month') return iso.slice(0, 7);
  return iso.slice(0, 4);
}

export default function AdminSalesPage() {
  const reservations = useAppStore((s) => s.reservations);
  const t = useTranslations('Admin');
  const [gran, setGran] = useState<Granularity>('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const buckets: Bucket[] = useMemo(() => {
    const map = new Map<string, Bucket>();
    for (const r of reservations) {
      if (r.status === 'cancelled' || r.status === 'rejected') continue;
      if (from && r.checkIn < from) continue;
      if (to && r.checkIn > to) continue;
      const key = bucketKey(r.checkIn, gran);
      const existing = map.get(key) ?? { key, direct: 0, airbnb: 0 };
      if (r.source === 'direct') existing.direct += r.amount;
      else existing.airbnb += r.amount;
      map.set(key, existing);
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
  }, [reservations, gran, from, to]);

  const total = buckets.reduce((acc, m) => acc + m.direct + m.airbnb, 0);
  const totalDirect = buckets.reduce((acc, m) => acc + m.direct, 0);
  const totalAirbnb = buckets.reduce((acc, m) => acc + m.airbnb, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl text-ink">{t('navSales')}</h1>
        <p className="text-sm text-ink/60">{t('salesSubtitle')}</p>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-sand p-3 text-sm">
        <Filter className="h-3.5 w-3.5 text-ink/40" />
        {(['day', 'month', 'year'] as Granularity[]).map((g) => (
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
