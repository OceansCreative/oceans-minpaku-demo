'use client';

import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';

import type { CancellationPolicy } from '@/types';

function blankStep(): CancellationPolicy {
  return {
    id: `cxl-${Math.random().toString(36).slice(2, 6)}`,
    daysBefore: 5,
    depositRate: 0.3,
  };
}

export default function AdminCancellationPolicyPage() {
  const steps = useAppStore((s) => s.cancellationPolicy);
  const upsert = useAppStore((s) => s.upsertCancellationStep);
  const remove = useAppStore((s) => s.removeCancellationStep);

  const [editing, setEditing] = useState<CancellationPolicy | null>(null);

  function handleSave(step: CancellationPolicy) {
    upsert(step);
    toast.success('ステップを保存しました', { description: step.id });
    setEditing(null);
  }

  function handleRemove(step: CancellationPolicy) {
    if (!confirm(`${step.id} を削除しますか？`)) return;
    remove(step.id);
    toast.success('ステップを削除しました', { description: step.id });
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
          onClick={() => setEditing(blankStep())}
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
                <tr key={s.id} className="hover:bg-ink/[0.015]">
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
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditing(s)}
                        aria-label={`${s.id} を編集`}
                        className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(s)}
                        aria-label={`${s.id} を削除`}
                        className="rounded-md p-1.5 text-crimson/60 hover:bg-crimson/10 hover:text-crimson"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {steps.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink/40">
                  ポリシーステップがありません。「ステップを追加」から作成してください。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-ink/40">
        ※ 当日キャンセルなど、どのステップにも該当しない場合は最も厳しい（小さい daysBefore
        の）ステップが適用されます。
      </p>

      {editing && (
        <StepEditor step={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}

function StepEditor({
  step,
  onSave,
  onCancel,
}: {
  step: CancellationPolicy;
  onSave: (step: CancellationPolicy) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<CancellationPolicy>(step);
  return (
    <div
      role="dialog"
      aria-modal
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-5 rounded-2xl bg-sand p-6 shadow-2xl"
      >
        <header>
          <h2 className="font-serif text-lg text-ink">キャンセルステップを編集</h2>
          <p className="text-xs text-ink/50">
            ID: <code>{draft.id}</code>
          </p>
        </header>

        <label className="block space-y-1.5">
          <span className="text-xs text-ink/60">何日前以上で適用</span>
          <input
            type="number"
            value={draft.daysBefore}
            min="0"
            max="365"
            onChange={(e) => setDraft({ ...draft, daysBefore: Number(e.target.value) })}
            className="w-32 rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
          />
          <span className="ml-2 text-[11px] text-ink/40">
            残り日数がこの値以上ならこのステップを適用
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-ink/60">デポジット率（%）</span>
          <input
            type="number"
            value={Math.round(draft.depositRate * 100)}
            min="0"
            max="100"
            step="5"
            onChange={(e) => setDraft({ ...draft, depositRate: Number(e.target.value) / 100 })}
            className="w-32 rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
          />
          <span className="ml-2 text-[11px] text-ink/40">
            ホストが受け取るキャンセル料の割合。残り（{Math.round((1 - draft.depositRate) * 100)}
            %）がゲストに返金されます
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-ink/70 hover:bg-ink/5"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-sand hover:bg-ink/90"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
