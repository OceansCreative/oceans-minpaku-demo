'use client';

import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';

import type { PricingRule, PricingRuleType } from '@/types';

type Translator = ReturnType<typeof useTranslations>;

const TYPE_LABEL_KEY: Record<PricingRuleType, string> = {
  weekend: 'ruleTypeWeekend',
  season: 'ruleTypeSeason',
  leadtime: 'ruleTypeLeadtime',
  occupancy: 'ruleTypeOccupancy',
  lengthOfStay: 'ruleTypeLengthOfStay',
};

const WEEKDAY_LABEL_KEYS = [
  'weekdaySun',
  'weekdayMon',
  'weekdayTue',
  'weekdayWed',
  'weekdayThu',
  'weekdayFri',
  'weekdaySat',
];

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
    case 'lengthOfStay':
      return { id, condition: { type, value: { minNights: 5 } }, multiplier: 0.9 };
  }
}

export default function AdminPricingPage() {
  const rules = useAppStore((s) => s.pricingRules);
  const removeRule = useAppStore((s) => s.removePricingRule);
  const upsertRule = useAppStore((s) => s.upsertPricingRule);
  const t = useTranslations('Admin');

  const [editing, setEditing] = useState<PricingRule | null>(null);

  function handleSave(rule: PricingRule) {
    upsertRule(rule);
    toast.success(t('ruleSaved'), { description: rule.id });
    setEditing(null);
  }

  function handleRemove(rule: PricingRule) {
    if (!confirm(t('confirmRemoveRule', { id: rule.id }))) return;
    removeRule(rule.id);
    toast.success(t('ruleRemoved'), { description: rule.id });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl text-ink">{t('navPricing')}</h1>
          <p className="text-sm text-ink/60">{t('pricingSubtitle')}</p>
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
            aria-label={t('addRuleTypeAria')}
          >
            <option value="">{t('addRulePlaceholder')}</option>
            {(Object.keys(TYPE_LABEL_KEY) as PricingRuleType[]).map((type) => (
              <option key={type} value={type}>
                {t(TYPE_LABEL_KEY[type])}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-2.5 text-left">{t('idLabel')}</th>
              <th className="px-4 py-2.5 text-left">{t('colType')}</th>
              <th className="px-4 py-2.5 text-left">{t('colCondition')}</th>
              <th className="px-4 py-2.5 text-right">{t('colMultiplier')}</th>
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
                    {t(TYPE_LABEL_KEY[rule.condition.type])}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-ink/70">
                  <code className="rounded bg-ink/[0.04] px-1.5 py-0.5">
                    {summarizeCondition(rule, t)}
                  </code>
                </td>
                <td className="px-4 py-3 text-right text-ink">×{rule.multiplier}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(rule)}
                      aria-label={t('editAria', { name: rule.id })}
                      className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(rule)}
                      aria-label={t('removeAria', { name: rule.id })}
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
                    {t('pricingEmpty')}
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

function summarizeCondition(rule: PricingRule, t: Translator): string {
  const c = rule.condition;
  switch (c.type) {
    case 'weekend':
      return `weekdays: [${c.value.weekdays
        .map((d) => (WEEKDAY_LABEL_KEYS[d] ? t(WEEKDAY_LABEL_KEYS[d]) : d))
        .join(',')}]`;
    case 'season':
      return `${c.value.from} – ${c.value.to}`;
    case 'leadtime':
      return t('leadtimeSummary', { days: c.value.maxDaysBefore });
    case 'occupancy':
      return t('occupancySummary', { pct: Math.round(c.value.minOccupancyRate * 100) });
    case 'lengthOfStay':
      return t('lengthOfStaySummary', { nights: c.value.minNights });
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
  const t = useTranslations('Admin');
  const tc = useTranslations('Common');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="rule-editor-title"
      onClick={onCancel}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg space-y-5 rounded-2xl bg-sand p-6 shadow-2xl"
      >
        <header>
          <h2 id="rule-editor-title" className="font-serif text-lg text-ink">
            {t('editRuleTitle', { type: t(TYPE_LABEL_KEY[draft.condition.type]) })}
          </h2>
          <p className="text-xs text-ink/50">
            {t('idLabel')} <code>{draft.id}</code>
          </p>
        </header>

        <ConditionFields draft={draft} setDraft={setDraft} />

        <label className="block space-y-1.5">
          <span className="text-xs text-ink/60">{t('multiplierLabel')}</span>
          <input
            type="number"
            value={draft.multiplier}
            step="0.05"
            min="0.1"
            max="3"
            onChange={(e) => setDraft({ ...draft, multiplier: Number(e.target.value) })}
            className="w-32 rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
          />
          <span className="ml-2 text-[11px] text-ink/40">{t('multiplierHint')}</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-ink/70 hover:bg-ink/5"
          >
            {tc('cancel')}
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm font-medium text-sand hover:bg-ink/90"
          >
            {tc('save')}
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
  const t = useTranslations('Admin');
  if (c.type === 'weekend') {
    return (
      <fieldset className="space-y-2">
        <legend className="mb-1 text-xs text-ink/60">{t('weekdaysLegend')}</legend>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_LABEL_KEYS.map((labelKey, idx) => {
            const active = c.value.weekdays.includes(idx);
            return (
              <button
                key={labelKey}
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
                {t(labelKey)}
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
          <span className="text-xs text-ink/60">{t('seasonFrom')}</span>
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
          <span className="text-xs text-ink/60">{t('seasonTo')}</span>
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
        <p className="col-span-full text-[11px] text-ink/40">{t('seasonWrapNote')}</p>
      </div>
    );
  }
  if (c.type === 'leadtime') {
    return (
      <label className="block space-y-1.5">
        <span className="text-xs text-ink/60">{t('leadtimeWithin')}</span>
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
          {t('leadtimeApplyHint', { days: c.value.maxDaysBefore })}
        </span>
      </label>
    );
  }
  if (c.type === 'lengthOfStay') {
    return (
      <label className="block space-y-1.5">
        <span className="text-xs text-ink/60">{t('lengthOfStayMin')}</span>
        <input
          type="number"
          value={c.value.minNights}
          min="2"
          max="30"
          onChange={(e) =>
            setDraft({
              ...draft,
              condition: { type: 'lengthOfStay', value: { minNights: Number(e.target.value) } },
            })
          }
          className="w-32 rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
        />
        <span className="ml-2 text-[11px] text-ink/40">
          {t('lengthOfStayApplyHint', { nights: c.value.minNights })}
        </span>
      </label>
    );
  }
  // occupancy
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-ink/60">{t('minOccupancyRate')}</span>
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
        {t('occupancyApplyHint', { pct: Math.round(c.value.minOccupancyRate * 100) })}
      </span>
    </label>
  );
}
