'use client';

import { BookOpenCheck, Mail, MessageSquare, Plus, Trash2 } from 'lucide-react';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import type { ReminderTemplate } from '@/types';

export default function AdminRemindersPage() {
  const templates = useAppStore((s) => s.reminderTemplates);
  const toggle = useAppStore((s) => s.toggleReminderTemplate);
  const remove = useAppStore((s) => s.removeReminderTemplate);
  const upsert = useAppStore((s) => s.upsertReminderTemplate);

  function addStub() {
    const id = `rem-${Math.random().toString(36).slice(2, 6)}`;
    upsert({
      id,
      name: '新規テンプレート',
      offset: '-P1D',
      channel: 'message',
      subject: '',
      body: '',
      enabled: false,
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="font-serif text-2xl text-ink">リマインダー</h1>
          <p className="text-sm text-ink/60">
            自動送信メッセージのテンプレート。`offset` は ISO 8601 duration（チェックイン基準）。
          </p>
        </div>
        <button
          type="button"
          onClick={addStub}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-3 py-1.5 text-xs text-sand hover:bg-ink/90"
        >
          <Plus className="h-3.5 w-3.5" />
          テンプレート追加
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
                  offset: <code>{t.offset}</code> · {channelLabel(t)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1 text-xs text-ink/60">
                  <input
                    type="checkbox"
                    checked={t.enabled}
                    onChange={(e) => toggle(t.id, e.target.checked)}
                  />
                  有効
                </label>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  aria-label={`${t.name} を削除`}
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
      </div>
    </div>
  );
}

function channelLabel(t: ReminderTemplate): React.ReactNode {
  if (t.channel === 'email')
    return (
      <span className="inline-flex items-center gap-1">
        <Mail className="h-3 w-3" />
        メール
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1">
      <MessageSquare className="h-3 w-3" />
      アプリ内メッセージ
    </span>
  );
}
