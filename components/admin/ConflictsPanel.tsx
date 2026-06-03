'use client';

import { AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { detectOverlap } from '@/lib/services/reservation';
import { useAppStore } from '@/lib/store';

import type { Reservation } from '@/types';

interface ConflictRow {
  pending: Reservation;
  blockers: Reservation[];
}

/**
 * Lists pending reservations whose approval is currently blocked by overlap. Drives
 * the "fix me first" workflow — host can click straight through to the detail page
 * where the red warning + disabled approve button live.
 */
export function ConflictsPanel() {
  const reservations = useAppStore((s) => s.reservations);
  const rooms = useAppStore((s) => s.rooms);
  const t = useTranslations('Admin');

  const conflicts: ConflictRow[] = useMemo(() => {
    return reservations
      .filter((r) => r.status === 'pending')
      .map((p) => ({
        pending: p,
        blockers: detectOverlap(reservations, {
          roomId: p.roomId,
          checkIn: p.checkIn,
          checkOut: p.checkOut,
          ignoreId: p.id,
        }),
      }))
      .filter((row) => row.blockers.length > 0);
  }, [reservations]);

  if (conflicts.length === 0) return null;

  return (
    <section className="space-y-3 rounded-2xl border-2 border-crimson/40 bg-crimson/5 p-5">
      <header className="flex items-center gap-2 text-sm text-crimson">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">{t('conflictsPanelTitle', { count: conflicts.length })}</span>
      </header>
      <ul className="space-y-2 text-xs">
        {conflicts.map(({ pending, blockers }) => {
          const room = rooms.find((rm) => rm.id === pending.roomId);
          return (
            <li
              key={pending.id}
              className="flex items-start justify-between gap-3 rounded-md bg-sand/70 px-3 py-2"
            >
              <div className="space-y-0.5">
                <p className="text-ink">
                  <span className="font-medium">{room?.name ?? pending.roomId}</span> ·{' '}
                  {pending.checkIn} → {pending.checkOut} ·{' '}
                  <span className="rounded bg-moss/15 px-1.5 py-0.5 text-[10px] text-moss">
                    {pending.source}
                  </span>
                </p>
                <p className="text-ink/50">
                  {t('conflictsDuplicate', {
                    ids: blockers.map((b) => `${b.id} (${b.source})`).join(', '),
                  })}
                </p>
              </div>
              <Link
                href={`/admin/reservations/${pending.id}`}
                className="inline-flex items-center gap-1 text-crimson hover:text-crimson/80"
              >
                {t('conflictsResolve')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
