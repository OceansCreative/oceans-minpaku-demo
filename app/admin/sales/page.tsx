'use client';

import { BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
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

interface Bucket {
  key: string;
  direct: number;
  airbnb: number;
}

export default function AdminSalesPage() {
  const reservations = useAppStore((s) => s.reservations);

  const monthly: Bucket[] = useMemo(() => {
    const map = new Map<string, Bucket>();
    for (const r of reservations) {
      if (r.status === 'cancelled' || r.status === 'rejected') continue;
      const key = r.checkIn.slice(0, 7); // YYYY-MM
      const existing = map.get(key) ?? { key, direct: 0, airbnb: 0 };
      if (r.source === 'direct') existing.direct += r.amount;
      else existing.airbnb += r.amount;
      map.set(key, existing);
    }
    return [...map.values()].sort((a, b) => (a.key < b.key ? -1 : 1));
  }, [reservations]);

  const total = monthly.reduce((acc, m) => acc + m.direct + m.airbnb, 0);
  const totalDirect = monthly.reduce((acc, m) => acc + m.direct, 0);
  const totalAirbnb = monthly.reduce((acc, m) => acc + m.airbnb, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl text-ink">売上集計</h1>
        <p className="text-sm text-ink/60">
          月別 / 経路別の売上を確認できます。グラフは予約のチェックイン月で集計しています。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="期間合計" value={total} />
        <SummaryCard label="Direct 経路" value={totalDirect} tone="text-blue-700" />
        <SummaryCard label="Airbnb 経路" value={totalAirbnb} tone="text-pink-700" />
      </div>

      <section className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5">
        <h2 className="flex items-center gap-2 font-serif text-base text-ink/80">
          <BarChart3 className="h-4 w-4 text-moss" />
          月別売上（経路別積み上げ）
        </h2>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <BarChart data={monthly}>
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
