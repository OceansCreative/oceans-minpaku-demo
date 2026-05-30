'use client';

import { ChevronRight, Filter } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import type { ReservationStatus } from '@/types';

type StatusFilter = ReservationStatus | 'all';

const STATUS_LABEL: Record<ReservationStatus, { label: string; tone: string }> = {
  pending: { label: '承認待ち', tone: 'bg-moss/15 text-moss' },
  approved: { label: '確定', tone: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: '却下', tone: 'bg-crimson/10 text-crimson' },
  cancelled: { label: 'キャンセル', tone: 'bg-ink/10 text-ink/60' },
};

export default function AdminReservationsPage() {
  const reservations = useAppStore((s) => s.reservations);
  const rooms = useAppStore((s) => s.rooms);
  const guests = useAppStore((s) => s.guests);
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

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-2xl text-ink">予約管理</h1>
          <p className="text-sm text-ink/60">
            予約のステータスと経路を確認し、承認 / 却下を判断します。
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink/10 bg-sand p-3">
        <Filter className="h-3.5 w-3.5 text-ink/40" />
        {(Object.keys(STATUS_LABEL) as ReservationStatus[]).concat(['all'] as never).length > 0 &&
          (['all', 'pending', 'approved', 'rejected', 'cancelled'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                'rounded-full px-3 py-1 text-xs',
                filter === s ? 'bg-ink text-sand' : 'bg-ink/[0.04] text-ink/70 hover:bg-ink/10',
              )}
            >
              {s === 'all' ? 'すべて' : STATUS_LABEL[s].label}
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
            {s === 'all' ? '全経路' : s}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-4 py-2.5 text-left">予約ID</th>
              <th className="px-4 py-2.5 text-left">ゲスト</th>
              <th className="px-4 py-2.5 text-left">部屋</th>
              <th className="px-4 py-2.5 text-left">日程</th>
              <th className="px-4 py-2.5 text-right">金額</th>
              <th className="px-4 py-2.5 text-center">経路</th>
              <th className="px-4 py-2.5 text-center">ステータス</th>
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
                        STATUS_LABEL[r.status].tone,
                      )}
                    >
                      {STATUS_LABEL[r.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/reservations/${r.id}`}
                      className="inline-flex items-center gap-1 text-xs text-moss hover:text-ink"
                    >
                      詳細
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-ink/40">
                  条件に一致する予約はありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
