'use client';

import { CheckCircle2, Clock3, Info, Loader2, Network, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { AIRBNB_ICAL_LAG_HOURS, fetchAirbnbCalendar } from '@/lib/mock/airbnb-ical';
import { cn } from '@/lib/utils/cn';

export default function AdminOtaPage() {
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
        <h1 className="font-serif text-2xl text-ink">OTA 連携</h1>
        <p className="text-sm text-ink/60">
          外部予約サイトとの連携設定。Airbnb は iCal で連携、Booking.com / Agoda
          は今後の拡張枠として確保しています。
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border border-ink/10 bg-sand p-5">
        <header className="flex items-center gap-2 text-sm text-ink/80">
          <Network className="h-4 w-4 text-moss" />
          <span className="font-medium">Airbnb（iCal 同期）</span>
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            接続中
          </span>
        </header>
        <label className="block space-y-1">
          <span className="text-xs text-ink/60">iCal URL</span>
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
            今すぐ同期
          </button>
          {lastResult && (
            <p className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              {lastResult.count} 件取得（
              {new Date(lastResult.fetchedAt).toLocaleTimeString('ja-JP')} 完了）
            </p>
          )}
        </div>
        <div className="flex items-start gap-2 rounded-md border border-moss/30 bg-moss/5 px-3 py-2 text-[11px] text-moss">
          <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>
            Airbnb の iCal はリアルタイムではなく{' '}
            <strong>
              {AIRBNB_ICAL_LAG_HOURS.min}〜{AIRBNB_ICAL_LAG_HOURS.max} 時間の遅延
            </strong>{' '}
            があります。同期直後でも他チャネルからの新規予約が反映されていない可能性があるため、当システムでは
            <strong> 承認時の在庫再チェック</strong> を最終防波堤として走らせています（SPEC §13）。
          </p>
        </div>
      </section>

      <Placeholder name="Booking.com" />
      <Placeholder name="Agoda" />

      <div className="flex items-start gap-2 rounded-md border border-ink/10 bg-ink/[0.02] px-4 py-2.5 text-[11px] text-ink/60">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
        <p>
          本番では各 OTA のチャネルマネージャ（SiteMinder / TL-リンカーン
          等）経由で双方向同期するか、各社のパートナーAPIを直接叩く実装に差し替えます。
        </p>
      </div>
    </div>
  );
}

function Placeholder({ name }: { name: string }) {
  return (
    <section
      className={cn(
        'space-y-2 rounded-2xl border border-dashed border-ink/15 bg-sand/40 p-5',
        'text-ink/50',
      )}
    >
      <header className="flex items-center gap-2 text-sm">
        <Network className="h-4 w-4 text-ink/30" />
        <span className="font-medium">{name}</span>
        <span className="ml-auto rounded-full bg-ink/[0.05] px-2 py-0.5 text-[10px] uppercase">
          拡張予定
        </span>
      </header>
      <p className="text-xs">
        {name} 連携枠です。本格運用ではチャネルマネージャ経由 / 直接API いずれかで
        在庫・料金・予約を双方向同期します。
      </p>
    </section>
  );
}
