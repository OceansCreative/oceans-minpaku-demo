'use client';

import { Bell, CalendarCheck, CalendarX, LogIn, LogOut, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import type { AppNotification, NotificationKind } from '@/types/notification';

function KindIcon({ kind }: { kind: NotificationKind }) {
  const cls = 'h-4 w-4 shrink-0';
  switch (kind) {
    case 'new_reservation':
      return <MessageSquare className={cn(cls, 'text-moss')} />;
    case 'cancellation':
      return <CalendarX className={cn(cls, 'text-crimson')} />;
    case 'checkin_today':
      return <LogIn className={cn(cls, 'text-sky-500')} />;
    case 'checkout_today':
      return <LogOut className={cn(cls, 'text-amber-500')} />;
    case 'review_posted':
      return <CalendarCheck className={cn(cls, 'text-moss')} />;
  }
}

function NotificationRow({
  notif,
  onSelect,
}: {
  notif: AppNotification;
  onSelect: (notif: AppNotification) => void;
}) {
  const t = useTranslations('notifications');
  return (
    <button
      type="button"
      onClick={() => onSelect(notif)}
      className={cn(
        'flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors',
        'hover:bg-ink/5 dark:hover:bg-white/5',
        notif.read ? 'opacity-60' : '',
      )}
    >
      <KindIcon kind={notif.kind} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink dark:text-gray-100">{t(notif.kind)}</p>
        <p className="mt-0.5 truncate text-[11px] text-ink/50 dark:text-gray-400">{notif.body}</p>
      </div>
      {!notif.read && (
        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson" aria-hidden />
      )}
    </button>
  );
}

export function NotificationBell() {
  const t = useTranslations('notifications');
  const router = useRouter();
  const notifications = useAppStore((s) => s.notifications);
  const unreadCount = useAppStore((s) => s.unreadCount);
  const markAllRead = useAppStore((s) => s.markAllRead);
  const markRead = useAppStore((s) => s.markRead);

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  function handleSelect(notif: AppNotification) {
    markRead(notif.id);
    setOpen(false);
    if (notif.reservationId) {
      router.push(`/admin/reservations/${notif.reservationId}`);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={t('title')}
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-1.5 text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-100"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            aria-label={String(unreadCount)}
            className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-crimson text-[9px] font-bold text-sand"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden',
            'rounded-2xl border border-ink/10 bg-sand shadow-xl dark:border-gray-700 dark:bg-gray-800',
          )}
        >
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-3 dark:border-gray-700">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink/60 dark:text-gray-400">
              {t('title')}
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-[11px] text-moss hover:underline"
              >
                {t('mark_all_read')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-ink/40 dark:text-gray-500">
                {t('empty')}
              </p>
            ) : (
              <ul>
                {notifications.map((notif) => (
                  <li
                    key={notif.id}
                    className="border-b border-ink/5 last:border-0 dark:border-gray-700/50"
                  >
                    <NotificationRow notif={notif} onSelect={handleSelect} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
