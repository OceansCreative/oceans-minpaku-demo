'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils/cn';

import type { Reservation, ReservationStatus } from '@/types';

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
function daysInMonth(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}
function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function AdminCalendarPage() {
  const reservations = useAppStore((s) => s.reservations);
  const rooms = useAppStore((s) => s.rooms);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => {
    const n = daysInMonth(cursor);
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(cursor);
      d.setUTCDate(i + 1);
      return d;
    });
  }, [cursor]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">カレンダー</h1>
          <p className="text-sm text-ink/60">
            部屋ごとの予約を1ヶ月単位で確認できます。経路により色分けされ、ダブルブッキングは赤で警告されます。
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-sand px-2 py-1">
          <button
            type="button"
            onClick={() => {
              const d = new Date(cursor);
              d.setUTCMonth(d.getUTCMonth() - 1);
              setCursor(d);
            }}
            className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5"
            aria-label="前月"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-sm tabular-nums text-ink">
            {cursor.getUTCFullYear()} 年 {cursor.getUTCMonth() + 1} 月
          </span>
          <button
            type="button"
            onClick={() => {
              const d = new Date(cursor);
              d.setUTCMonth(d.getUTCMonth() + 1);
              setCursor(d);
            }}
            className="rounded-md p-1.5 text-ink/60 hover:bg-ink/5"
            aria-label="翌月"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <Legend />

      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-sand">
        <table className="min-w-full border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-ink/[0.03] text-[10px] uppercase tracking-wider text-ink/50">
            <tr>
              <th className="sticky left-0 z-20 min-w-[7rem] border-b border-ink/10 bg-ink/[0.03] px-3 py-2 text-left">
                部屋
              </th>
              {days.map((d) => (
                <th
                  key={isoDay(d)}
                  className={cn(
                    'min-w-[2.25rem] border-b border-l border-ink/5 px-1.5 py-2 text-center font-normal',
                    [0, 6].includes(d.getUTCDay()) && 'text-crimson',
                  )}
                >
                  {d.getUTCDate()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-ink">
            {rooms.map((room) => (
              <tr key={room.id} className="border-t border-ink/5">
                <th className="sticky left-0 z-10 border-r border-ink/5 bg-sand px-3 py-2 text-left text-xs font-normal text-ink/80">
                  {room.name}
                </th>
                {days.map((d) => {
                  const cellIso = isoDay(d);
                  const occupants = reservations.filter(
                    (r) =>
                      r.roomId === room.id &&
                      r.status !== 'cancelled' &&
                      r.status !== 'rejected' &&
                      r.checkIn <= cellIso &&
                      r.checkOut > cellIso,
                  );
                  const conflict = occupants.length > 1;
                  const first = occupants[0];
                  return (
                    <td
                      key={cellIso}
                      className={cn(
                        'h-9 border-l border-ink/5 align-middle',
                        conflict && 'bg-crimson/20 ring-2 ring-inset ring-crimson',
                      )}
                      title={
                        occupants.length === 0
                          ? '空室'
                          : occupants.map((o) => `${o.id} (${o.source}, ${o.status})`).join('\n')
                      }
                    >
                      {first && (
                        <Link
                          href={`/admin/reservations/${first.id}`}
                          className={cn(
                            'mx-0.5 block truncate rounded px-1.5 py-1 text-[9px]',
                            cellColor(first),
                          )}
                        >
                          {abbrevId(first.id)}
                        </Link>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cellColor(r: Reservation): string {
  if (r.status === 'pending') return 'bg-moss/20 text-moss';
  const tone = r.source === 'airbnb' ? 'bg-pink-200 text-pink-900' : 'bg-blue-200 text-blue-900';
  return tone;
}

function abbrevId(id: string): string {
  return id.replace('res-', '').slice(0, 6);
}

function Legend() {
  const items: { label: string; tone: string; status?: ReservationStatus }[] = [
    { label: 'Direct（確定）', tone: 'bg-blue-200 text-blue-900' },
    { label: 'Airbnb（確定）', tone: 'bg-pink-200 text-pink-900' },
    { label: 'Pending（承認待ち）', tone: 'bg-moss/20 text-moss' },
    {
      label: 'ダブルブッキング',
      tone: 'bg-crimson/20 ring-2 ring-inset ring-crimson text-crimson',
    },
  ];
  return (
    <ul className="flex flex-wrap gap-2 text-[11px] text-ink/60">
      {items.map((it) => (
        <li key={it.label} className="inline-flex items-center gap-1.5">
          <span className={cn('inline-block h-3 w-5 rounded-sm', it.tone)} />
          {it.label}
        </li>
      ))}
    </ul>
  );
}
