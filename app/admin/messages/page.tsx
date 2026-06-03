'use client';

import { MessageSquare, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import type { Reservation } from '@/types';

export default function AdminMessagesPage() {
  const reservations = useAppStore((s) => s.reservations);
  const guests = useAppStore((s) => s.guests);
  const rooms = useAppStore((s) => s.rooms);
  const messages = useAppStore((s) => s.messages);
  const appendMessage = useAppStore((s) => s.appendMessage);
  const tr = useTranslations('Admin');

  const threads = useMemo(
    () =>
      reservations
        .filter((r) => r.status !== 'rejected')
        .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1)),
    [reservations],
  );

  const [activeId, setActiveId] = useState<string | undefined>(() => threads[0]?.id);
  const active = threads.find((t) => t.id === activeId);
  const activeMessages = messages.filter((m) => m.reservationId === activeId);
  const [draft, setDraft] = useState('');

  function send() {
    if (!active || !draft.trim()) return;
    appendMessage({
      id: `msg-${Date.now().toString(36)}`,
      reservationId: active.id,
      from: 'admin',
      text: draft.trim(),
      createdAt: new Date().toISOString(),
    });
    setDraft('');
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-serif text-2xl text-ink">{tr('navMessages')}</h1>
        <p className="text-sm text-ink/60">{tr('messagesSubtitle')}</p>
      </header>

      <div className="grid h-[60vh] gap-4 md:grid-cols-[16rem,1fr]">
        <aside className="overflow-y-auto rounded-2xl border border-ink/10 bg-sand">
          {threads.length === 0 ? (
            <div className="grid h-full place-items-center p-6 text-center">
              <div>
                <MessageSquare className="mx-auto h-6 w-6 text-ink/30" />
                <p className="mt-2 text-xs text-ink/50">{tr('threadsEmpty')}</p>
                <p className="mt-1 text-[10px] text-ink/40">{tr('threadsEmptyHint')}</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-ink/5">
              {threads.map((t) => {
                const guest = guests.find((g) => g.id === t.guestId);
                const room = rooms.find((rm) => rm.id === t.roomId);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(t.id)}
                      className={cn(
                        'block w-full px-4 py-3 text-left text-xs hover:bg-ink/[0.02]',
                        activeId === t.id && 'bg-ink/[0.06]',
                      )}
                    >
                      <p className="text-ink">{guest?.name ?? tr('guestNameless')}</p>
                      <p className="text-[10px] text-ink/50">
                        {room?.name} · {t.checkIn} → {t.checkOut}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section className="flex flex-col rounded-2xl border border-ink/10 bg-sand">
          {active ? (
            <>
              <ThreadHeader active={active} />
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
                {activeMessages.length === 0 ? (
                  <p className="text-center text-xs text-ink/40">{tr('noMessagesYet')}</p>
                ) : (
                  activeMessages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                        m.from === 'admin' ? 'ml-auto bg-ink text-sand' : 'bg-ink/[0.06] text-ink',
                      )}
                    >
                      {m.text}
                    </div>
                  ))
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2 border-t border-ink/10 px-3 py-2"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={tr('messagePlaceholder')}
                  className="flex-1 rounded-md border border-ink/15 bg-sand px-3 py-2 text-sm focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md bg-ink px-3 py-2 text-xs text-sand hover:bg-ink/90"
                >
                  <Send className="h-3.5 w-3.5" />
                  {tr('sendMessage')}
                </button>
              </form>
            </>
          ) : (
            <p className="m-auto text-sm text-ink/40">{tr('selectThread')}</p>
          )}
        </section>
      </div>
    </div>
  );
}

function ThreadHeader({ active }: { active: Reservation }) {
  return (
    <header className="flex items-center gap-2 border-b border-ink/10 bg-ink/[0.02] px-4 py-3 text-xs text-ink/60">
      <MessageSquare className="h-3.5 w-3.5 text-moss" />
      <span>{active.id}</span>
      <span className="ml-auto rounded bg-ink/[0.05] px-2 py-0.5 text-[10px]">{active.status}</span>
    </header>
  );
}
