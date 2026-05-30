'use client';

import { ClipboardCheck, Users } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useAppStore } from '@/lib/store';

import type { GuestRegister } from '@/types';

export default function AdminGuestRegisterPage() {
  const reservations = useAppStore((s) => s.reservations);
  const guests = useAppStore((s) => s.guests);
  const register = useAppStore((s) => s.guestRegister);
  const upsert = useAppStore((s) => s.upsertGuestRegister);

  const eligible = useMemo(
    () =>
      reservations
        .filter((r) => r.status === 'approved' || r.status === 'pending')
        .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1)),
    [reservations],
  );

  const [drafts, setDrafts] = useState<Record<string, Partial<GuestRegister>>>({});

  function updateDraft(reservationId: string, patch: Partial<GuestRegister>) {
    setDrafts((d) => ({
      ...d,
      [reservationId]: { ...(d[reservationId] ?? {}), ...patch },
    }));
  }

  function commit(reservationId: string) {
    const reservation = reservations.find((r) => r.id === reservationId);
    const guest = guests.find((g) => g.id === reservation?.guestId);
    const existing = register.find((r) => r.reservationId === reservationId);
    const draft = drafts[reservationId] ?? {};
    upsert({
      id: existing?.id ?? `reg-${Math.random().toString(36).slice(2, 8)}`,
      reservationId,
      name: draft.name ?? existing?.name ?? guest?.name ?? '',
      nationality: draft.nationality ?? existing?.nationality ?? guest?.nationality ?? '',
      passportNumber: draft.passportNumber ?? existing?.passportNumber,
      profession: draft.profession ?? existing?.profession ?? '',
      idImageUrl: draft.idImageUrl ?? existing?.idImageUrl,
    });
    setDrafts((d) => {
      const next = { ...d };
      delete next[reservationId];
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-serif text-2xl text-ink">宿泊者名簿</h1>
        <p className="text-sm text-ink/60">
          住宅宿泊事業法 §8 に基づく宿泊者の記録。氏名・国籍・連絡先・職業を記載し、3
          年間保存します。
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-3 py-2.5 text-left">予約</th>
              <th className="px-3 py-2.5 text-left">氏名</th>
              <th className="px-3 py-2.5 text-left">国籍</th>
              <th className="px-3 py-2.5 text-left">職業</th>
              <th className="px-3 py-2.5 text-left">旅券番号</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {eligible.map((r) => {
              const guest = guests.find((g) => g.id === r.guestId);
              const existing = register.find((re) => re.reservationId === r.id);
              const draft = drafts[r.id] ?? {};
              const merged = { ...existing, ...draft };
              return (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-mono text-[11px] text-ink/60">{r.id}</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={merged.name ?? guest?.name ?? ''}
                      onChange={(e) => updateDraft(r.id, { name: e.target.value })}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={merged.nationality ?? guest?.nationality ?? ''}
                      onChange={(e) => updateDraft(r.id, { nationality: e.target.value })}
                      className={`${inputClass} w-20`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={merged.profession ?? ''}
                      onChange={(e) => updateDraft(r.id, { profession: e.target.value })}
                      className={inputClass}
                      placeholder="例: 会社員"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={merged.passportNumber ?? ''}
                      onChange={(e) => updateDraft(r.id, { passportNumber: e.target.value })}
                      className={`${inputClass} w-28 font-mono text-xs`}
                      placeholder="（外国籍のみ）"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => commit(r.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-ink px-2.5 py-1 text-[11px] text-sand hover:bg-ink/90"
                    >
                      <ClipboardCheck className="h-3 w-3" />
                      記録
                    </button>
                  </td>
                </tr>
              );
            })}
            {eligible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-ink/40">
                  <Users className="mx-auto mb-1 h-5 w-5 opacity-50" />
                  記録対象の予約はまだありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-ink/15 bg-sand px-2 py-1 text-xs focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss';
