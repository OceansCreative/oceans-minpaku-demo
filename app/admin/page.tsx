'use client';

import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { CapCounterWidget } from '@/components/admin/widgets/CapCounterWidget';
import { OccupancyWidget } from '@/components/admin/widgets/OccupancyWidget';
import { PeriodFilter } from '@/components/admin/widgets/PeriodFilter';
import { SalesSummaryWidget } from '@/components/admin/widgets/SalesSummaryWidget';
import { resolvePeriod, type PeriodPreset } from '@/lib/services/metrics';
import { useAppStore } from '@/lib/store';
import { toIsoDate } from '@/lib/utils/dates';

export default function AdminDashboardPage() {
  const reservations = useAppStore((s) => s.reservations);
  const rooms = useAppStore((s) => s.rooms);
  const guests = useAppStore((s) => s.guests);
  const t = useTranslations('Admin');

  const today = toIsoDate(new Date());
  const [period, setPeriod] = useState<PeriodPreset>('thisMonth');
  const range = useMemo(() => resolvePeriod(period, today), [period, today]);

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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink dark:text-gray-100">{t('navDashboard')}</h1>
          <p className="text-sm text-ink/60 dark:text-gray-400">{t('dashboardSubtitle')}</p>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <OccupancyWidget range={range} />
        <SalesSummaryWidget range={range} />
        <CapCounterWidget />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TodaySection
          title={t('todayCheckIn')}
          tone="text-emerald-700"
          Icon={ArrowDownToLine}
          reservations={checkingIn}
          rooms={rooms}
          guests={guests}
          emptyHint={t('todayCheckInEmpty')}
        />
        <TodaySection
          title={t('todayCheckOut')}
          tone="text-amber-700"
          Icon={ArrowUpFromLine}
          reservations={checkingOut}
          rooms={rooms}
          guests={guests}
          emptyHint={t('todayCheckOutEmpty')}
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
  const t = useTranslations('Admin');
  return (
    <section className="space-y-3 rounded-2xl border border-ink/10 bg-sand p-5 dark:border-gray-700 dark:bg-gray-800">
      <header className="flex items-center justify-between">
        <h2 className={`flex items-center gap-2 font-serif text-base ${tone}`}>
          <Icon className="h-4 w-4" />
          {title}
        </h2>
        <span className="text-xs text-ink/50 dark:text-gray-400">
          {t('countSuffix', { count: reservations.length })}
        </span>
      </header>
      {reservations.length === 0 ? (
        <p className="text-xs text-ink/40 dark:text-gray-500">{emptyHint}</p>
      ) : (
        <ul className="divide-y divide-ink/5 text-sm dark:divide-gray-700">
          {reservations.map((r) => {
            const room = rooms.find((rm) => rm.id === r.roomId);
            const guest = guests.find((g) => g.id === r.guestId);
            return (
              <li key={r.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-ink dark:text-gray-200">{room?.name ?? r.roomId}</p>
                  <p className="text-[11px] text-ink/50 dark:text-gray-400">
                    {guest?.name ?? '—'} · {r.checkIn} → {r.checkOut}
                  </p>
                </div>
                <Link
                  href={`/admin/reservations/${r.id}`}
                  className="text-[11px] text-moss hover:text-ink dark:hover:text-gray-100"
                >
                  {t('detailArrow')}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
