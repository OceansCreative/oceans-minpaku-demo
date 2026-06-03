'use client';

import { ChevronRight, Download, Filter } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { reservationsToCsv } from '@/lib/services/export';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';
import { toIsoDate } from '@/lib/utils/dates';

import type { ReservationStatus } from '@/types';

type StatusFilter = ReservationStatus | 'all';

const STATUS_META: Record<ReservationStatus, { labelKey: string; tone: string }> = {
  pending: { labelKey: 'statusPending', tone: 'bg-moss/15 text-moss' },
  approved: { labelKey: 'statusApproved', tone: 'bg-emerald-100 text-emerald-700' },
  rejected: { labelKey: 'statusRejected', tone: 'bg-crimson/10 text-crimson' },
  cancelled: { labelKey: 'statusCancelled', tone: 'bg-ink/10 text-ink/60' },
};

export default function AdminReservationsPage() {
  const reservations = useAppStore((s) => s.reservations);
  const rooms = useAppStore((s) => s.rooms);
  const guests = useAppStore((s) => s.guests);
  const t = useTranslations('Admin');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [source, setSource] = useState<'all' | 'direct' | 'airbnb'>('all');

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: reservations.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
    };
    for (const r of reservations) c[r.status] += 1;
    return c;
  }, [reservations]);

  const filtered = useMemo(() => {
    return reservations
      .filter((r) => (filter === 'all' ? true : r.status === filter))
      .filter((r) => (source === 'all' ? true : r.source === source))
      .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1));
  }, [reservations, filter, source]);

  function exportCsv() {
    const csv = reservationsToCsv(filtered, { rooms, guests });
    // Prefix a UTF-8 BOM so Excel reads non-ASCII guest/room names correctly.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reservations-${toIsoDate(new Date())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">{t('navReservations')}</h1>
          <p className="text-sm text-ink/60">{t('reservationsSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 bg-sand px-3 py-1.5 text-xs text-ink/80 hover:bg-ink/[0.04] disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          {t('exportCsv')}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-sand p-3">
        <Filter className="h-3.5 w-3.5 text-ink/40" />
        {(['all', 'pending', 'approved', 'rejected', 'cancelled'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn(
              'rounded-full px-3 py-1 text-xs',
              filter === s ? 'bg-ink text-sand' : 'bg-ink/[0.04] text-ink/70 hover:bg-ink/10',
            )}
          >
            {s === 'all' ? t('filterAll') : t(STATUS_META[s].labelKey)}
            <span className="ml-1.5 text-[10px] opacity-60">{counts[s]}</span>
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-ink/15" />
        {(['all', 'direct', 'airbnb'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={cn(
              'rounded-full px-3 py-1 text-xs',
              source === s ? 'bg-moss text-sand' : 'bg-ink/[0.04] text-ink/70 hover:bg-ink/10',
            )}
          >
            {s === 'all' ? t('filterAllSources') : s}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-2.5 text-left">{t('colReservationId')}</th>
              <th className="px-4 py-2.5 text-left">{t('colGuest')}</th>
              <th className="px-4 py-2.5 text-left">{t('colRoom')}</th>
              <th className="px-4 py-2.5 text-left">{t('colDates')}</th>
              <th className="px-4 py-2.5 text-right">{t('colAmount')}</th>
              <th className="px-4 py-2.5 text-center">{t('colSource')}</th>
              <th className="px-4 py-2.5 text-center">{t('colStatus')}</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {filtered.map((r) => {
              const room = rooms.find((rm) => rm.id === r.roomId);
              const guest = guests.find((g) => g.id === r.guestId);
              return (
                <tr key={r.id} className="hover:bg-ink/[0.02]">
                  <td className="px-4 py-3 font-mono text-xs text-ink/60">{r.id}</td>
                  <td className="px-4 py-3 text-ink">
                    {guest?.name ?? <span className="text-ink/40">—</span>}
                  </td>
                  <td className="px-4 py-3 text-ink/80">{room?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-ink/80">
                    {r.checkIn} → {r.checkOut}
                  </td>
                  <td className="px-4 py-3 text-right text-ink">¥{r.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase',
                        r.source === 'airbnb'
                          ? 'bg-pink-100 text-pink-700'
                          : 'bg-blue-100 text-blue-700',
                      )}
                    >
                      {r.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        STATUS_META[r.status].tone,
                      )}
                    >
                      {t(STATUS_META[r.status].labelKey)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/reservations/${r.id}`}
                      className="inline-flex items-center gap-1 text-xs text-moss hover:text-ink"
                    >
                      {t('detail')}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <Filter className="mx-auto h-6 w-6 text-ink/30" />
                  <p className="mt-2 text-sm text-ink/50">{t('reservationsEmpty')}</p>
                  <p className="mt-1 text-[11px] text-ink/40">{t('reservationsEmptyHint')}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
