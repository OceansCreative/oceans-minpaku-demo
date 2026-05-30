'use client';

import 'react-day-picker/style.css';

import { ja } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';

import { detectOverlap } from '@/lib/services/reservation';
import { useAppStore } from '@/lib/store';
import { nightsBetween, toIsoDate } from '@/lib/utils/dates';

import type { Reservation, Room } from '@/types';

interface BookingFlowProps {
  room: Room;
}

/**
 * Multi-step guest booking flow. Each subsequent commit in Phase 3 layers another
 * step (time, parking, pricing, info, payment, submit) onto this component.
 *
 * Step 1 (this commit): date range selection with availability colors.
 */
export function BookingFlow({ room }: BookingFlowProps) {
  const reservations = useAppStore((s) => s.reservations);
  const [range, setRange] = useState<DateRange | undefined>();

  const bookedDays = useMemo(
    () => collectBookedDays(reservations, room.id),
    [reservations, room.id],
  );

  const nights =
    range?.from && range.to ? nightsBetween(toIsoDate(range.from), toIsoDate(range.to)) : 0;

  return (
    <div className="grid gap-8 md:grid-cols-[1.5fr,1fr]">
      <section className="space-y-4">
        <header className="flex items-center gap-2 text-sm text-ink/70">
          <CalendarIcon className="h-4 w-4 text-moss" />
          <span>チェックイン / アウトを選択してください</span>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-sand p-4">
          <DayPicker
            mode="range"
            numberOfMonths={2}
            locale={ja}
            disabled={[{ before: new Date() }, ...bookedDays.map((d) => new Date(d))]}
            selected={range}
            onSelect={setRange}
            classNames={{
              today: 'text-moss font-semibold',
              selected: 'bg-ink text-sand',
              range_start: 'bg-ink text-sand rounded-l-md',
              range_end: 'bg-ink text-sand rounded-r-md',
              range_middle: 'bg-ink/10 text-ink',
              disabled: 'text-ink/20 line-through',
            }}
          />
        </div>

        <ul className="flex flex-wrap gap-3 text-[11px] text-ink/60">
          <li className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-ink" />
            選択中
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-ink/10" />
            滞在期間
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-ink/30 bg-sand line-through" />
            予約済み
          </li>
        </ul>
      </section>

      <aside className="h-fit space-y-3 rounded-2xl border border-ink/10 bg-sand/60 p-5 text-sm">
        <p className="font-serif text-base text-ink">{room.name}</p>
        <dl className="space-y-2 text-xs text-ink/70">
          <div className="flex justify-between">
            <dt>チェックイン</dt>
            <dd className="text-ink">{range?.from ? toIsoDate(range.from) : '— 未選択 —'}</dd>
          </div>
          <div className="flex justify-between">
            <dt>チェックアウト</dt>
            <dd className="text-ink">{range?.to ? toIsoDate(range.to) : '— 未選択 —'}</dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-2">
            <dt>泊数</dt>
            <dd className="text-ink">{nights > 0 ? `${nights} 泊` : '—'}</dd>
          </div>
        </dl>
        <p className="text-[11px] text-ink/40">
          チェックイン/アウトの時刻、駐車場、料金の詳細は次のステップで選択します。
        </p>
      </aside>
    </div>
  );
}

/** Expand every approved/pending reservation into the individual nights it occupies. */
function collectBookedDays(reservations: Reservation[], roomId: string): string[] {
  const out: string[] = [];
  for (const r of reservations) {
    if (r.roomId !== roomId) continue;
    if (r.status === 'cancelled' || r.status === 'rejected') continue;
    const start = new Date(`${r.checkIn}T00:00:00.000Z`);
    const end = new Date(`${r.checkOut}T00:00:00.000Z`);
    const cursor = new Date(start);
    while (cursor < end) {
      out.push(toIsoDate(cursor));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return out;
}

// Re-export so the page can prove availability before submit (used in later commits).
export { detectOverlap };
