'use client';

import { ClipboardList, Download } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import {
  buildMinpakuPeriodReport,
  inclusiveEndDate,
  minpakuReportToCsv,
  statutoryReportPeriods,
} from '@/lib/services/compliance-report';
import { useAppStore } from '@/lib/store';
import { toIsoDate } from '@/lib/utils/dates';

/**
 * 住宅宿泊事業法 §14 periodic-report panel. Picks one of the six statutory
 * two-month windows, summarizes nights operated / guests / person-nights and the
 * nationality breakdown via the pure service, and exports the figures as CSV
 * (the real filing goes through the 民泊制度運営システム).
 */
export function PeriodicReportCard() {
  const reservations = useAppStore((s) => s.reservations);
  const guests = useAppStore((s) => s.guests);
  const registers = useAppStore((s) => s.guestRegister);
  const t = useTranslations('Admin');
  const locale = useLocale();

  const today = toIsoDate(new Date());
  const year = Number(today.slice(0, 4));
  const periods = useMemo(() => statutoryReportPeriods(year), [year]);
  const defaultIdx = useMemo(() => {
    const i = periods.findIndex((p) => today < p.end);
    return i === -1 ? periods.length - 1 : i;
  }, [periods, today]);
  const [idx, setIdx] = useState(defaultIdx);
  // periods always has six entries; the literal fallback only satisfies the
  // type-checker under noUncheckedIndexedAccess and is never reached at runtime.
  const period = useMemo(
    () => periods[idx] ?? periods[0] ?? { start: today, end: today, deadline: today },
    [periods, idx, today],
  );

  const report = useMemo(
    () => buildMinpakuPeriodReport({ period, reservations, registers, guests }),
    [period, reservations, registers, guests],
  );

  const regionNames = useMemo(() => {
    try {
      return new Intl.DisplayNames([locale], { type: 'region' });
    } catch {
      return null;
    }
  }, [locale]);
  const nationalityLabel = (code: string): string => {
    if (code === 'UNKNOWN') return t('reportUnknownNat');
    try {
      return regionNames?.of(code) ?? code;
    } catch {
      return code;
    }
  };

  const maxNights = report.byNationality[0]?.guestNights ?? 0;

  function exportCsv() {
    const csv = minpakuReportToCsv(report);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minpaku-report-${period.start}_${inclusiveEndDate(period)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-ink/10 bg-sand p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 font-serif text-base text-ink">
            <ClipboardList className="h-4 w-4 text-moss" />
            {t('reportTitle')}
          </h2>
          <p className="max-w-2xl text-xs leading-relaxed text-ink/55">{t('reportSubtitle')}</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 bg-sand px-3 py-1.5 text-xs text-ink/80 transition-colors hover:bg-ink/[0.04] hover:text-ink"
        >
          <Download className="h-3.5 w-3.5" />
          {t('reportExportCsv')}
        </button>
      </header>

      <label className="flex flex-wrap items-center gap-2 text-xs text-ink/60">
        {t('reportPeriodLabel')}
        <select
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="rounded-md border border-ink/15 bg-sand px-2 py-1 text-xs text-ink"
        >
          {periods.map((p, i) => (
            <option key={p.deadline} value={i}>
              {p.start} 〜 {inclusiveEndDate(p)}（{t('reportDeadline')}: {p.deadline}）
            </option>
          ))}
        </select>
      </label>

      <dl className="grid grid-cols-3 gap-3">
        <Stat label={t('reportNightsOperated')} value={report.nightsOperated} />
        <Stat label={t('reportGuests')} value={report.guestCount} />
        <Stat label={t('reportGuestNights')} value={report.guestNights} />
      </dl>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-ink/40">{t('reportNationality')}</p>
        {report.byNationality.length === 0 ? (
          <p className="text-xs text-ink/40">{t('reportEmpty')}</p>
        ) : (
          <ul className="space-y-1.5">
            {report.byNationality.map((n) => (
              <li key={n.nationality} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 truncate text-ink/80">
                  {nationalityLabel(n.nationality)}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
                  <span
                    className="block h-full rounded-full bg-moss"
                    style={{
                      width: maxNights > 0 ? `${(n.guestNights / maxNights) * 100}%` : '0%',
                    }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right tabular-nums text-ink/70">
                  {n.guestNights}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="border-t border-ink/10 pt-3 text-[11px] leading-relaxed text-ink/40">
        {t('reportNote')}
      </p>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1 rounded-xl border border-ink/10 bg-sand/60 p-3 text-center">
      <p className="text-[11px] text-ink/50">{label}</p>
      <p className="font-serif text-2xl tabular-nums text-ink">{value.toLocaleString()}</p>
    </div>
  );
}
