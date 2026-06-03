'use client';

import { CreditCard, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
  const t = useTranslations('Admin');

  const [editing, setEditing] = useState<CancellationPolicy | null>(null);

  function handleSave(step: CancellationPolicy) {
    upsert(step);
    toast.success(t('stepSaved'), { description: step.id });
    setEditing(null);
  }

  function handleRemove(step: CancellationPolicy) {
    if (!confirm(t('confirmRemoveStep', { id: step.id }))) return;
    remove(step.id);
    toast.success(t('stepRemoved'), { description: step.id });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl text-ink">{t('navCancellation')}</h1>
          <p className="text-sm text-ink/60">{t('cancellationSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(blankStep())}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs text-sand hover:bg-ink/90"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('addStep')}
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-2.5 text-left">{t('idLabel')}</th>
              <th className="px-4 py-2.5 text-left">{t('colApplyCondition')}</th>
              <th className="px-4 py-2.5 text-right">{t('colDepositRate')}</th>
              <th className="px-4 py-2.5 text-right">{t('colRefundRate')}</th>
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
                      {t('daysOrMoreBefore', { days: s.daysBefore })}
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
                        aria-label={t('editAria', { name: s.id })}
                        className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(s)}
                        aria-label={t('removeAria', { name: s.id })}
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
                  {t('cancellationEmpty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-ink/40">{t('cancellationFallbackNote')}</p>

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
      aria-labelledby="cxl-step-editor-title"
      onClick={onCancel}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-5 rounded-2xl bg-sand p-6 shadow-2xl"
      >
        <header>
          <h2 id="cxl-step-editor-title" className="font-serif text-lg text-ink">
            {t('editCancellationStep')}
          </h2>
          <p className="text-xs text-ink/50">
            {t('idLabel')} <code>{draft.id}</code>
          </p>
        </header>

        <label className="block space-y-1.5">
          <span className="text-xs text-ink/60">{t('applyDaysBefore')}</span>
          <input
            type="number"
            value={draft.daysBefore}
            min="0"
            max="365"
            onChange={(e) => setDraft({ ...draft, daysBefore: Number(e.target.value) })}
            className="w-32 rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
          />
          <span className="ml-2 text-[11px] text-ink/40">{t('applyDaysBeforeHint')}</span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-ink/60">{t('depositRatePct')}</span>
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
            {t('depositRateHint', { pct: Math.round((1 - draft.depositRate) * 100) })}
          </span>
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
            className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-sand hover:bg-ink/90"
          >
            {tc('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
