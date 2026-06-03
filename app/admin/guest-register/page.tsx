'use client';

import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ScanLine,
  Upload,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { useAppStore } from '@/lib/store';

import type { GuestRegister } from '@/types';

export default function AdminGuestRegisterPage() {
  const reservations = useAppStore((s) => s.reservations);
  const guests = useAppStore((s) => s.guests);
  const register = useAppStore((s) => s.guestRegister);
  const upsert = useAppStore((s) => s.upsertGuestRegister);
  const t = useTranslations('Admin');

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

  function exportCsv() {
    const header = [
      t('csvReservationId'),
      t('csvName'),
      t('csvNationality'),
      t('csvProfession'),
      t('csvPassportNumber'),
      t('csvCheckIn'),
      t('csvCheckOut'),
      t('csvIdDocument'),
    ];
    const rows = register.map((entry) => {
      const reservation = reservations.find((r) => r.id === entry.reservationId);
      return [
        entry.reservationId,
        entry.name,
        entry.nationality,
        entry.profession,
        entry.passportNumber ?? '',
        reservation?.checkIn ?? '',
        reservation?.checkOut ?? '',
        entry.idImageUrl ? t('csvIdObtained') : t('csvIdNotObtained'),
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `guest-register-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <ComplianceNotes />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-ink">{t('guestRegisterTitle')}</h1>
          <p className="text-sm text-ink/60">{t('guestRegisterSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={register.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 bg-sand px-3 py-1.5 text-xs text-ink/80 hover:bg-ink/[0.04] disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" />
          {t('csvExport')}
        </button>
      </header>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-sand">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="px-3 py-2.5 text-left">{t('colReservation')}</th>
              <th className="px-3 py-2.5 text-left">{t('colName')}</th>
              <th className="px-3 py-2.5 text-left">{t('colNationality')}</th>
              <th className="px-3 py-2.5 text-left">{t('colProfession')}</th>
              <th className="px-3 py-2.5 text-left">{t('colPassportNumber')}</th>
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
                      aria-label={t('colName')}
                      className={inputClass}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={merged.nationality ?? guest?.nationality ?? ''}
                      onChange={(e) => updateDraft(r.id, { nationality: e.target.value })}
                      aria-label={t('colNationality')}
                      className={`${inputClass} w-20`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={merged.profession ?? ''}
                      onChange={(e) => updateDraft(r.id, { profession: e.target.value })}
                      aria-label={t('colProfession')}
                      className={inputClass}
                      placeholder={t('professionPlaceholder')}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={merged.passportNumber ?? ''}
                      onChange={(e) => updateDraft(r.id, { passportNumber: e.target.value })}
                      aria-label={t('colPassportNumber')}
                      className={`${inputClass} w-28 font-mono text-xs`}
                      placeholder={t('passportForeignOnly')}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <IdUploadButton
                        uploaded={Boolean(merged.idImageUrl)}
                        onUpload={() =>
                          updateDraft(r.id, {
                            idImageUrl: `https://picsum.photos/seed/id-${r.id}/400/250`,
                          })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => commit(r.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-ink px-2.5 py-1 text-[11px] text-sand hover:bg-ink/90"
                      >
                        <ClipboardCheck className="h-3 w-3" />
                        {t('record')}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {eligible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-ink/40">
                  <Users className="mx-auto mb-1 h-5 w-5 opacity-50" />
                  {t('guestRegisterEmpty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ComplianceNotes() {
  const t = useTranslations('Admin');
  return (
    <section className="rounded-2xl border border-moss/30 bg-moss/[0.06] p-5 text-xs leading-relaxed text-ink/70">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-moss">
        <BookOpen className="h-4 w-4" />
        {t('complianceTitle')}
      </h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          <strong>{t('complianceItem8Title')}</strong>: {t('complianceItem8Body')}
        </li>
        <li>
          <strong>{t('complianceItem6Title')}</strong>: {t('complianceItem6Body')}
        </li>
        <li>
          <strong>{t('complianceItem23Title')}</strong>: {t('complianceItem23Body')}
        </li>
        <li>
          <strong>{t('complianceReportTitle')}</strong>: {t('complianceReportBody')}
        </li>
      </ul>
      <p className="mt-3 text-[11px] text-ink/40">{t('complianceFooter')}</p>
    </section>
  );
}

function IdUploadButton({ uploaded, onUpload }: { uploaded: boolean; onUpload: () => void }) {
  const t = useTranslations('Admin');
  if (uploaded) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700"
        title={t('idCheckOkTitle')}
      >
        <CheckCircle2 className="h-3 w-3" />
        {t('idCheckOk')}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onUpload}
      title={t('idUploadTitle')}
      className="inline-flex items-center gap-1 rounded-md border border-ink/15 px-2 py-1 text-[10px] text-ink/60 hover:bg-ink/[0.04]"
    >
      <Upload className="h-3 w-3" />
      <ScanLine className="h-3 w-3" />
      {t('idUpload')}
    </button>
  );
}

const inputClass =
  'w-full rounded-md border border-ink/15 bg-sand px-2 py-1 text-xs focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss';
