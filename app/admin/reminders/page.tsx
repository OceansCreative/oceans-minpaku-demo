'use client';

import { BookOpenCheck, Mail, MessageSquare, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import type { ReminderChannel, ReminderTemplate } from '@/types';

const OFFSET_PRESETS: { labelKey: string; value: string }[] = [
  { labelKey: 'offsetAtCheckIn', value: 'PT0S' },
  { labelKey: 'offsetDayBefore', value: '-P1D' },
  { labelKey: 'offset3DaysBefore', value: '-P3D' },
  { labelKey: 'offset1WeekBefore', value: '-P7D' },
  { labelKey: 'offset2HoursAfter', value: 'PT2H' },
];

function blankTemplate(name: string): ReminderTemplate {
  return {
    id: `rem-${Math.random().toString(36).slice(2, 6)}`,
    name,
    offset: '-P1D',
    channel: 'message',
    subject: '',
    body: '',
    enabled: false,
  };
}

export default function AdminRemindersPage() {
  const templates = useAppStore((s) => s.reminderTemplates);
  const toggle = useAppStore((s) => s.toggleReminderTemplate);
  const remove = useAppStore((s) => s.removeReminderTemplate);
  const upsert = useAppStore((s) => s.upsertReminderTemplate);
  const tr = useTranslations('Admin');

  const [editing, setEditing] = useState<ReminderTemplate | null>(null);

  function handleSave(t: ReminderTemplate) {
    upsert(t);
    toast.success(tr('templateSaved'), { description: t.name });
    setEditing(null);
  }

  function handleRemove(t: ReminderTemplate) {
    if (!confirm(tr('confirmRemoveTemplate', { name: t.name }))) return;
    remove(t.id);
    toast.success(tr('templateRemoved'), { description: t.name });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl text-ink">{tr('navReminders')}</h1>
          <p className="text-sm text-ink/60">{tr('remindersSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(blankTemplate(tr('newTemplate')))}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs text-sand hover:bg-ink/90"
        >
          <Plus className="h-3.5 w-3.5" />
          {tr('addTemplate')}
        </button>
      </header>

      <div className="space-y-3">
        {templates.map((t) => (
          <article
            key={t.id}
            className={cn(
              'space-y-2 rounded-2xl border border-ink/10 bg-sand p-4',
              !t.enabled && 'opacity-60',
            )}
          >
            <header className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="flex items-center gap-2 font-medium text-ink">
                  <BookOpenCheck className="h-4 w-4 text-moss" />
                  {t.name}
                </p>
                <p className="text-[11px] text-ink/50">
                  {tr('offsetLabel')} <code>{t.offset}</code> · {channelLabel(t, tr)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1 text-xs text-ink/60">
                  <input
                    type="checkbox"
                    checked={t.enabled}
                    onChange={(e) => toggle(t.id, e.target.checked)}
                  />
                  {tr('enabled')}
                </label>
                <button
                  type="button"
                  onClick={() => setEditing(t)}
                  aria-label={tr('editAria', { name: t.name })}
                  className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5 hover:text-ink"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(t)}
                  aria-label={tr('removeAria', { name: t.name })}
                  className="rounded-md p-1.5 text-crimson/60 hover:bg-crimson/10 hover:text-crimson"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </header>
            {t.subject && <p className="text-sm font-medium text-ink/80">{t.subject}</p>}
            {t.body && <p className="whitespace-pre-line text-xs text-ink/60">{t.body}</p>}
          </article>
        ))}
        {templates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-sand/40 px-6 py-10 text-center">
            <BookOpenCheck className="mx-auto h-6 w-6 text-ink/30" />
            <p className="mt-2 text-sm text-ink/50">{tr('remindersEmpty')}</p>
            <p className="text-[11px] text-ink/40">{tr('remindersEmptyHint')}</p>
          </div>
        )}
      </div>

      {editing && (
        <TemplateEditor template={editing} onSave={handleSave} onCancel={() => setEditing(null)} />
      )}
    </div>
  );
}

function channelLabel(
  t: ReminderTemplate,
  tr: ReturnType<typeof useTranslations>,
): React.ReactNode {
  if (t.channel === 'email')
    return (
      <span className="inline-flex items-center gap-1">
        <Mail className="h-3 w-3" />
        {tr('channelEmail')}
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1">
      <MessageSquare className="h-3 w-3" />
      {tr('channelMessage')}
    </span>
  );
}

function TemplateEditor({
  template,
  onSave,
  onCancel,
}: {
  template: ReminderTemplate;
  onSave: (t: ReminderTemplate) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ReminderTemplate>(template);
  const tr = useTranslations('Admin');
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
      aria-labelledby="reminder-editor-title"
      onClick={onCancel}
      className="fixed inset-0 z-[55] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-2xl bg-sand p-6 shadow-2xl"
      >
        <header>
          <h2 id="reminder-editor-title" className="font-serif text-lg text-ink">
            {tr('editReminder')}
          </h2>
          <p className="text-xs text-ink/50">
            {tr('idLabel')} <code>{draft.id}</code>
          </p>
        </header>

        <label className="block space-y-1.5">
          <span className="text-xs text-ink/60">{tr('templateName')}</span>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-xs text-ink/60">{tr('sendTiming')}</span>
            <input
              type="text"
              value={draft.offset}
              onChange={(e) => setDraft({ ...draft, offset: e.target.value })}
              placeholder="-P1D"
              className="w-full rounded-md border border-ink/20 bg-sand px-3 py-2 font-mono text-sm"
            />
            <div className="flex flex-wrap gap-1">
              {OFFSET_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setDraft({ ...draft, offset: p.value })}
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${
                    draft.offset === p.value
                      ? 'border-ink bg-ink text-sand'
                      : 'border-ink/15 text-ink/60 hover:bg-ink/5'
                  }`}
                >
                  {tr(p.labelKey)}
                </button>
              ))}
            </div>
          </label>
          <label className="space-y-1.5">
            <span className="text-xs text-ink/60">{tr('channel')}</span>
            <select
              value={draft.channel}
              onChange={(e) => setDraft({ ...draft, channel: e.target.value as ReminderChannel })}
              className="w-full rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
            >
              <option value="email">{tr('channelEmail')}</option>
              <option value="message">{tr('channelMessage')}</option>
            </select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs text-ink/60">{tr('subject')}</span>
          <input
            type="text"
            value={draft.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            className="w-full rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-ink/60">{tr('body')}</span>
          <textarea
            value={draft.body}
            rows={5}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            className="w-full rounded-md border border-ink/20 bg-sand px-3 py-2 text-sm"
          />
        </label>

        <label className="inline-flex items-center gap-2 text-xs text-ink/60">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
          />
          {tr('enableNow')}
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
