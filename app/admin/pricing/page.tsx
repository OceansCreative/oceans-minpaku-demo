'use client';

import { Plus, Tag, Trash2 } from 'lucide-react';

import { useAppStore } from '@/lib/store';

import type { PricingRule } from '@/types';

const TYPE_LABEL: Record<PricingRule['type'], string> = {
  weekday: '曜日',
  weekend: '週末',
  season: 'シーズン',
  leadtime: '直前 / 早期',
  occupancy: '稼働率連動',
};

export default function AdminPricingPage() {
  const rules = useAppStore((s) => s.pricingRules);
  const removeRule = useAppStore((s) => s.removePricingRule);
  const upsertRule = useAppStore((s) => s.upsertPricingRule);

  function addStubRule() {
    const id = `rule-${Math.random().toString(36).slice(2, 7)}`;
    upsertRule({
      id,
      type: 'weekend',
      condition: { type: 'weekend', value: { weekdays: [5, 6] } },
      multiplier: 1.1,
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl text-ink">料金設定</h1>
          <p className="text-sm text-ink/60">
            ダイナミックプライシングのルールを追加 /
            削除できます。複数のルールが当たる場合は乗算されます。
          </p>
        </div>
        <button
          type="button"
          onClick={addStubRule}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs text-sand hover:bg-ink/90"
        >
          <Plus className="h-3.5 w-3.5" />
          ルールを追加
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-2.5 text-left">ID</th>
              <th className="px-4 py-2.5 text-left">タイプ</th>
              <th className="px-4 py-2.5 text-left">条件</th>
              <th className="px-4 py-2.5 text-right">倍率</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className="px-4 py-3 font-mono text-xs text-ink/60">{rule.id}</td>
                <td className="px-4 py-3 text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-moss" />
                    {TYPE_LABEL[rule.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-ink/70">
                  <code className="rounded bg-ink/[0.04] px-1.5 py-0.5">
                    {summarizeCondition(rule)}
                  </code>
                </td>
                <td className="px-4 py-3 text-right text-ink">×{rule.multiplier}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    aria-label={`${rule.id} を削除`}
                    className="rounded-md p-1.5 text-crimson/60 hover:bg-crimson/10 hover:text-crimson"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-ink/40">
                  ルールがありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function summarizeCondition(rule: PricingRule): string {
  const c = rule.condition;
  switch (c.type) {
    case 'weekday':
    case 'weekend':
      return `weekdays: [${c.value.weekdays.join(',')}]`;
    case 'season':
      return `${c.value.from} – ${c.value.to}`;
    case 'leadtime':
      return `≤ ${c.value.maxDaysBefore} 日前`;
    case 'occupancy':
      return `稼働率 ≥ ${Math.round(c.value.minOccupancyRate * 100)}%`;
  }
}
