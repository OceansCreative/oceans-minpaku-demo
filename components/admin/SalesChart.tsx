'use client';

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

export interface SalesBucket {
  key: string;
  direct: number;
  airbnb: number;
}

/**
 * Stacked bar chart for the sales aggregation page. Pulled out of the page so
 * `next/dynamic` can lazy-load `recharts` — keeping the rest of the admin
 * shell below the 110kB First Load JS budget.
 */
export default function SalesChart({ data }: { data: SalesBucket[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
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
  );
}
