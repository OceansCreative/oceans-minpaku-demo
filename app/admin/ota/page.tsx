'use client';

import { CheckCircle2, Clock3, Info, Loader2, Network, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { OtaPlaceholderCard } from '@/components/admin/OtaPlaceholderCard';
import { AIRBNB_ICAL_LAG_HOURS, fetchAirbnbCalendar } from '@/lib/mock/airbnb-ical';

export default function AdminOtaPage() {
  const t = useTranslations('Admin');
  const [icalUrl, setIcalUrl] = useState(
    'https://www.airbnb.com/calendar/ical/00000000.ics?s=demo',
  );
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<{
    fetchedAt: string;
    count: number;
  } | null>(null);

  async function syncNow() {
    setSyncing(true);
    try {
      const result = await fetchAirbnbCalendar({ icalUrl });
      setLastResult({ fetchedAt: result.fetchedAt, count: result.entries.length });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl text-ink">{t('navOta')}</h1>
        <p className="text-sm text-ink/60">{t('otaSubtitle')}</p>
      </header>

      <section className="space-y-4 rounded-2xl border border-ink/10 bg-sand p-5">
        <header className="flex items-center gap-2 text-sm text-ink/80">
          <Network className="h-4 w-4 text-moss" />
          <span className="font-medium">{t('otaAirbnbHeading')}</span>
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            {t('otaConnected')}
          </span>
        </header>
        <label className="block space-y-1">
          <span className="text-xs text-ink/60">{t('otaIcalUrl')}</span>
          <input
            type="text"
            value={icalUrl}
            onChange={(e) => setIcalUrl(e.target.value)}
            className="w-full rounded-md border border-ink/15 bg-sand px-3 py-2 font-mono text-xs"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={syncNow}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-xs text-sand hover:bg-ink/90 disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {t('otaSyncNow')}
          </button>
          {lastResult && (
            <p className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              {t('otaSyncResult', {
                count: lastResult.count,
                time: new Date(lastResult.fetchedAt).toLocaleTimeString('ja-JP'),
              })}
            </p>
          )}
        </div>
        <div className="flex items-start gap-2 rounded-md border border-moss/30 bg-moss/5 px-3 py-2 text-[11px] text-moss">
          <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            {t('otaIcalLagBefore')}{' '}
            <strong>
              {t('icalLagHours', {
                min: AIRBNB_ICAL_LAG_HOURS.min,
                max: AIRBNB_ICAL_LAG_HOURS.max,
              })}
            </strong>
            {t('otaIcalLagAfter')}
            <strong> {t('otaIcalSafeguard')}</strong> {t('otaIcalFinal')}
          </p>
        </div>
      </section>

      <OtaPlaceholderCard
        name="Booking.com"
        protocol={t('otaBookingProtocol')}
        notes={t('otaBookingNotes')}
      />
      <OtaPlaceholderCard
        name="Agoda"
        protocol={t('otaAgodaProtocol')}
        notes={t('otaAgodaNotes')}
      />

      <div className="flex items-start gap-2 rounded-md border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-[11px] text-ink/60">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
        <p>{t('otaFooterNote')}</p>
      </div>
    </div>
  );
}
