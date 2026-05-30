'use client';

import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

import { OccupancyWidget } from '@/components/admin/widgets/OccupancyWidget';
import { useAppStore } from '@/lib/store';
import { toIsoDate } from '@/lib/utils/dates';

export default function AdminDashboardPage() {
  const reservations = useAppStore((s) => s.reservations);
  const rooms = useAppStore((s) => s.rooms);
  const guests = useAppStore((s) => s.guests);

  const today = toIsoDate(new Date());

  const checkingIn = useMemo(
    () => reservations.filter((r) => r.status === 'approved' && r.checkIn === today),
    [reservations, today],
  );
  const checkingOut = useMemo(
    () => reservations.filter((r) => r.status === 'approved' && r.checkOut === today),
    [reservations, today],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl text-ink">ダッシュボード</h1>
        <p className="text-sm text-ink/60">本日のオペレーションを一目で把握できます。</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <OccupancyWidget />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TodaySection
          title="本日チェックイン"
          tone="text-emerald-700"
          Icon={ArrowDownToLine}
          reservations={checkingIn}
          rooms={rooms}
          guests={guests}
          emptyHint="本日チェックインの予約はありません。"
        />
        <TodaySection
          title="本日チェックアウト"
          tone="text-amber-700"
          Icon={ArrowUpFromLine}
          reservations={checkingOut}
          rooms={rooms}
          guests={guests}
          emptyHint="本日チェックアウトの予約はありません。"
        />
      </div>
    </div>
  );
}

type Resv = ReturnType<typeof useAppStore.getState>['reservations'][number];
type Room = ReturnType<typeof useAppStore.getState>['rooms'][number];
type Guest = ReturnType<typeof useAppStore.getState>['guests'][number];

function TodaySection({
  title,
  tone,
  Icon,
  reservations,
  rooms,
  guests,
  emptyHint,
}: {
  title: string;
  tone: string;
  Icon: typeof ArrowDownToLine;
  reservations: Resv[];
  rooms: Room[];
  guests: Guest[];
  emptyHint: string;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5">
      <header className="flex items-center justify-between">
        <h2 className={`flex items-center gap-2 font-serif text-base ${tone}`}>
          <Icon className="h-4 w-4" />
          {title}
        </h2>
        <span className="text-xs text-ink/50">{reservations.length} 件</span>
      </header>
      {reservations.length === 0 ? (
        <p className="text-xs text-ink/40">{emptyHint}</p>
      ) : (
        <ul className="divide-y divide-ink/5 text-sm">
          {reservations.map((r) => {
            const room = rooms.find((rm) => rm.id === r.roomId);
            const guest = guests.find((g) => g.id === r.guestId);
            return (
              <li key={r.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-ink">{room?.name ?? r.roomId}</p>
                  <p className="text-[11px] text-ink/50">
                    {guest?.name ?? '—'} · {r.checkIn} → {r.checkOut}
                  </p>
                </div>
                <Link
                  href={`/admin/reservations/${r.id}`}
                  className="text-[11px] text-moss hover:text-ink"
                >
                  詳細 →
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
