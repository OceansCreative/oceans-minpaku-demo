'use client';

import { CreditCard, Plus, Trash2 } from 'lucide-react';

import { useAppStore } from '@/lib/store';

export default function AdminCancellationPolicyPage() {
  const steps = useAppStore((s) => s.cancellationPolicy);
  const upsert = useAppStore((s) => s.upsertCancellationStep);
  const remove = useAppStore((s) => s.removeCancellationStep);

  function addStub() {
    const id = `cxl-${Math.random().toString(36).slice(2, 6)}`;
    upsert({ id, daysBefore: 5, depositRate: 0.3 });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl text-ink">キャンセル設定</h1>
          <p className="text-sm text-ink/60">
            キャンセル日数に応じてデポジット率（返金の差し引き）を設定します。
          </p>
        </div>
        <button
          type="button"
          onClick={addStub}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs text-sand hover:bg-ink/90"
        >
          <Plus className="h-3.5 w-3.5" />
          ステップを追加
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-2.5 text-left">ID</th>
              <th className="px-4 py-2.5 text-left">適用条件</th>
              <th className="px-4 py-2.5 text-right">デポジット率</th>
              <th className="px-4 py-2.5 text-right">返金率</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {steps
              .slice()
              .sort((a, b) => b.daysBefore - a.daysBefore)
              .map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">{s.id}</td>
                  <td className="px-4 py-3 text-ink">
                    <span className="inline-flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-moss" />
                      {s.daysBefore} 日以上前まで
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink">
                    {Math.round(s.depositRate * 100)}%
                  </td>
                  <td className="px-4 py-3 text-right text-ink/60">
                    {Math.round((1 - s.depositRate) * 100)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => remove(s.id)}
                      aria-label={`${s.id} を削除`}
                      className="rounded-md p-1.5 text-crimson/60 hover:bg-crimson/10 hover:text-crimson"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-ink/40">
        ※ 当日キャンセルなど、どのステップにも該当しない場合は最も厳しい（小さい daysBefore
        の）ステップが適用されます。
      </p>
    </div>
  );
}
