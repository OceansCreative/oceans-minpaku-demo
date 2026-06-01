'use client';

import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';

import type { PricingRule, PricingRuleType } from '@/types';

const TYPE_LABEL: Record<PricingRuleType, string> = {
  weekend: '週末',
  season: 'シーズン',
  leadtime: '直前 / 早期',
  occupancy: '稼働率連動',
};

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function blankRule(type: PricingRuleType): PricingRule {
  const id = `rule-${Math.random().toString(36).slice(2, 7)}`;
  switch (type) {
    case 'weekend':
      return { id, condition: { type, value: { weekdays: [5, 6] } }, multiplier: 1.2 };
    case 'season':
      return { id, condition: { type, value: { from: '04-29', to: '05-05' } }, multiplier: 1.3 };
    case 'leadtime':
      return { id, condition: { type, value: { maxDaysBefore: 3 } }, multiplier: 0.9 };
    case 'occupancy':
      return { id, condition: { type, value: { minOccupancyRate: 0.8 } }, multiplier: 1.15 };
  }
}

export default function AdminPricingPage() {
  const rules = useAppStore((s) => s.pricingRules);
  const removeRule = useAppStore((s) => s.removePricingRule);
  const upsertRule = useAppStore((s) => s.upsertPricingRule);

  const [editing, setEditing] = useState<PricingRule | null>(null);

  function handleSave(rule: PricingRule) {
    upsertRule(rule);
    toast.success('ルールを保存しました', { description: rule.id });
    setEditing(null);
  }

  function handleRemove(rule: PricingRule) {
    if (!confirm(`${rule.id} を削除しますか？`)) return;
    removeRule(rule.id);
    toast.success('ルールを削除しました', { description: rule.id });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl text-ink">料金設定</h1>
          <p className="text-sm text-ink/60">
            ダイナミックプライシングのルールを編集できます。複数のルールが当たる場合は乗算されます。
          </p>
        </div>
        <div className="flex items-center gap-1">
          <select
            value=""
            onChange={(e) => {
              if (!e.target.value) return;
              setEditing(blankRule(e.target.value as PricingRuleType));
              e.target.value = '';
            }}
            className="rounded-md border border-ink/15 bg-sand px-3 py-1.5 text-xs text-ink/80"
            aria-label="追加するルールタイプ"
          >
            <option value="">＋ ルールを追加…</option>
            {(Object.keys(TYPE_LABEL) as PricingRuleType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
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
              <tr key={rule.id} className="hover:bg-ink/[0.015]">
                <td className="px-4 py-3 font-mono text-xs text-ink/60">{rule.id}</td>
                <td className="px-4 py-3 text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-moss" />
                    {TYPE_LABEL[rule.condition.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-ink/70">
                  <code className="rounded bg-ink/[0.04] px-1.5 py-0.5">
                    {summarizeCondition(rule)}
                  </code>
                </td>
                <td className="px-4 py-3 text-right text-ink">×{rule.multiplier}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(rule)}
                      aria-label={`${rule.id} を編集`}
                      className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(rule)}
                      aria-label={`${rule.id} を削除`}
                      className="rounded-md p-1.5 text-crimson/60 hover:bg-crimson/10 hover:text-crimson"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <p className="mx-auto inline-flex items-center gap-2 text-sm text-ink/40">
                    <Plus className="h-3.5 w-3.5" />
                    ルールがありません。右上の「ルールを追加…」から追加してください。
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <RuleEditor rule={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}

function summarizeCondition(rule: PricingRule): string {
  const c = rule.condition;
  switch (c.type) {
    case 'weekend':
      return `weekdays: [${c.value.weekdays.map((d) => WEEKDAY_LABELS[d] ?? d).join(',')}]`;
    case 'season':
      return `${c.value.from} – ${c.value.to}`;
    case 'leadtime':
      return `≤ ${c.value.maxDaysBefore} 日前`;
    case 'occupancy':
      return `稼働率 ≥ ${Math.round(c.value.minOccupancyRate * 100)}%`;
  }
}

function RuleEditor({
  rule,
  onSave,
  onCancel,
}: {
  rule: PricingRule;
  onSave: (rule: PricingRule) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<PricingRule>(rule);

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="rule-editor-title"
      onClick={onCancel}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-5 rounded-2xl bg-sand p-6 shadow-2xl"
      >
        <header>
          <h2 id="rule-editor-title" className="font-serif text-lg text-ink">
            {TYPE_LABEL[draft.condition.type]} ルールを編集
          </h2>
          <p className="text-xs text-ink/50">
            ID: <code>{draft.id}</code>
          </p>
        </header>

        <ConditionFields draft={draft} setDraft={setDraft} />

        <label className="block space-y-1.5">
          <span className="text-xs text-ink/60">倍率（基準料金に対する乗数）</span>
          <input
            type="number"
            value={draft.multiplier}
            step="0.05"
            min="0.1"
            max="3"
            onChange={(e) => setDraft({ ...draft, multiplier: Number(e.target.value) })}
            className="w-32 rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
          />
          <span className="ml-2 text-[11px] text-ink/40">
            1.0 = 基準料金、1.2 = +20%、0.9 = -10%
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
            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm font-medium text-sand hover:bg-ink/90"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

function ConditionFields({
  draft,
  setDraft,
}: {
  draft: PricingRule;
  setDraft: (rule: PricingRule) => void;
}) {
  const c = draft.condition;
  if (c.type === 'weekend') {
    return (
      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs text-ink/60">適用曜日（夜）</legend>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_LABELS.map((label, idx) => {
            const active = c.value.weekdays.includes(idx);
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  const next = active
                    ? c.value.weekdays.filter((w) => w !== idx)
                    : [...c.value.weekdays, idx].sort();
                  setDraft({
                    ...draft,
                    condition: { type: 'weekend', value: { weekdays: next } },
                  });
                }}
                className={`h-9 w-9 rounded-md border text-sm ${
                  active
                    ? 'border-ink bg-ink text-sand'
                    : 'border-ink/15 bg-sand text-ink/60 hover:border-ink/30'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }
  if (c.type === 'season') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs text-ink/60">開始 (MM-DD)</span>
          <input
            type="text"
            value={c.value.from}
            onChange={(e) =>
              setDraft({
                ...draft,
                condition: { type: 'season', value: { ...c.value, from: e.target.value } },
              })
            }
            placeholder="04-29"
            className="w-full rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs text-ink/60">終了 (MM-DD)</span>
          <input
            type="text"
            value={c.value.to}
            onChange={(e) =>
              setDraft({
                ...draft,
                condition: { type: 'season', value: { ...c.value, to: e.target.value } },
              })
            }
            placeholder="05-05"
            className="w-full rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
          />
        </label>
        <p className="col-span-full text-[11px] text-ink/40">
          年をまたぐ範囲（12-29 〜 01-03 など）も指定できます。
        </p>
      </div>
    );
  }
  if (c.type === 'leadtime') {
    return (
      <label className="block space-y-1.5">
        <span className="text-xs text-ink/60">何日前以内</span>
        <input
          type="number"
          value={c.value.maxDaysBefore}
          min="0"
          max="180"
          onChange={(e) =>
            setDraft({
              ...draft,
              condition: { type: 'leadtime', value: { maxDaysBefore: Number(e.target.value) } },
            })
          }
          className="w-32 rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
        />
        <span className="ml-2 text-[11px] text-ink/40">
          {c.value.maxDaysBefore} 日前以内の予約に適用
        </span>
      </label>
    );
  }
  // occupancy
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-ink/60">最低稼働率（%）</span>
      <input
        type="number"
        value={Math.round(c.value.minOccupancyRate * 100)}
        min="0"
        max="100"
        step="5"
        onChange={(e) =>
          setDraft({
            ...draft,
            condition: {
              type: 'occupancy',
              value: { minOccupancyRate: Number(e.target.value) / 100 },
            },
          })
        }
        className="w-32 rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
      />
      <span className="ml-2 text-[11px] text-ink/40">
        月間稼働率 ≥ {Math.round(c.value.minOccupancyRate * 100)}% で適用
      </span>
    </label>
  );
}
