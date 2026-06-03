'use client';

import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useAppStore } from '@/lib/store';

/**
 * Root error boundary — catches anything client-side that escapes a page.
 * Shows a friendly recovery card with two outs: retry the same render or
 * blow away the demo state and start fresh.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const resetSampleData = useAppStore((s) => s.resetToSeed);
  const t = useTranslations('Error');

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-crimson/10 text-crimson">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="font-serif text-2xl text-ink">{t('title')}</h1>
      <p className="text-sm text-ink/60">{t('description')}</p>
      {error.digest && (
        <p className="text-[11px] text-ink/40">
          {t('digestLabel')} <code>{error.digest}</code>
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm font-medium text-sand hover:bg-ink/90"
        >
          <RotateCcw className="h-4 w-4" />
          {t('retry')}
        </button>
        <button
          type="button"
          onClick={() => {
            resetSampleData();
            reset();
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 px-4 py-2 text-sm text-ink/70 hover:bg-ink/5"
        >
          {t('resetAndRetry')}
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 px-4 py-2 text-sm text-ink/70 hover:bg-ink/5"
        >
          <Home className="h-4 w-4" />
          {t('home')}
        </Link>
      </div>
    </div>
  );
}
