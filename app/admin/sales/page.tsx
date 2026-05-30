'use client';

import { BarChart3, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

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
        <h1 className="font-serif text-2xl text-ink">売上集計</h1>
        <p className="text-sm text-ink/60">経路別 / 期間別の売上をグラフで確認できます。</p>
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
            {g === 'day' ? '日別' : g === 'month' ? '月別' : '年別'}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-ink/15" />
        <label className="flex items-center gap-1.5 text-xs text-ink/60">
          開始
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-ink/15 bg-sand px-2 py-1 text-xs"
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-ink/60">
          終了
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
            期間をクリア
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="期間合計" value={total} />
        <SummaryCard label="Direct 経路" value={totalDirect} tone="text-blue-700" />
        <SummaryCard label="Airbnb 経路" value={totalAirbnb} tone="text-pink-700" />
      </div>

      <section className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5">
        <h2 className="flex items-center gap-2 font-serif text-base text-ink/80">
          <BarChart3 className="h-4 w-4 text-moss" />
          売上推移（経路別積み上げ）
        </h2>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={buckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
              <XAxis dataKey="key" stroke="rgba(0,0,0,0.5)" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="rgba(0,0,0,0.5)"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `¥${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v: number) => `¥${v.toLocaleString()}`}
                contentStyle={{
                  background: 'rgba(31,32,36,0.95)',
                  border: 'none',
                  borderRadius: 8,
                  color: '#f6f1e7',
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="direct" stackId="src" fill="#3b82f6" name="Direct" />
              <Bar dataKey="airbnb" stackId="src" fill="#ec4899" name="Airbnb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <p className="text-[11px] text-ink/40">※ キャンセル / 却下された予約は集計対象外です。</p>
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
