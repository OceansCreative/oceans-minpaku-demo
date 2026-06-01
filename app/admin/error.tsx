'use client';

import { AlertTriangle, LayoutDashboard, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { useAppStore } from '@/lib/store';

/**
 * Admin-scoped error boundary — same shape as the root one, but stays inside
 * the admin shell and surfaces a path back to /admin instead of /.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const resetSampleData = useAppStore((s) => s.resetToSeed);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Admin error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-crimson/10 text-crimson">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h1 className="font-serif text-xl text-ink">管理画面でエラーが発生しました</h1>
      <p className="text-sm text-ink/60">
        再試行で多くの場合は復帰します。続く場合はサンプルデータをリセットしてみてください。
      </p>
      {error.digest && (
        <p className="text-[11px] text-ink/40">
          digest: <code>{error.digest}</code>
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-md bg-ink px-4 py-2 text-sm font-medium text-sand hover:bg-ink/90"
        >
          <RotateCcw className="h-4 w-4" />
          再試行
        </button>
        <button
          type="button"
          onClick={() => {
            resetSampleData();
            reset();
          }}
          className="rounded-md border border-ink/15 px-4 py-2 text-sm text-ink/70 hover:bg-ink/5"
        >
          サンプルデータをリセットして再試行
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 px-4 py-2 text-sm text-ink/70 hover:bg-ink/5"
        >
          <LayoutDashboard className="h-4 w-4" />
          ダッシュボード
        </Link>
      </div>
    </div>
  );
}
